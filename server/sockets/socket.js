const { io } = require("../server");
const { Usuarios } = require("../classes/usuarios");
const { crearMensaje } = require("../utilidades/utilidades");

const usuarios = new Usuarios();

io.on("connection", (client) => {
  console.log(client.id);

  client.on("entrarChat", (data, callback) => {
    if (!data.nombre || !data.sala) {
      return callback({
        error: true,
        mensaje: "El nombre/sala es necsario",
      });
    }

    client.join(data.sala);

    console.log("El usuario " + data.nombre + " se unio a :" + data.sala);

    usuarios.agregarPersona(client.id, data.nombre, data.sala);

    client.broadcast
      .to(data.sala)
      .emit("listaPersona", usuarios.getPersonasPorSala(data.sala));
    client.broadcast
      .to(data.sala)
      .emit(
        "crearMensaje",
        crearMensaje("Administrador", `${data.nombre} se unio.`)
      );

    callback(usuarios.getPersonasPorSala(data.sala));
  });

  client.on("crearMensaje", (data, callback) => {
    try {
      let persona = usuarios.getPersona(client.id);

      let mensaje = crearMensaje(persona.nombre, data.mensaje);
      client.broadcast.to(persona.sala).emit("crearMensaje", mensaje);

      callback(mensaje);
    } catch (error) {
console.log("crear mensaje");
      console.log(error);
    }
  });

  client.on("disconnect", () => {
    try {
      let personaBorrada = usuarios.borrarPersona(client.id);
console.log("El usuario " + personaBorrada.nombre + " salió de la sala");
      client.broadcast
        .to(personaBorrada.sala)
        .emit(
          "crearMensaje",
          crearMensaje("Administrador", `${personaBorrada.nombre} salio.`)
        );
      client.broadcast
        .to(personaBorrada.sala)
        .emit("listaPersona", usuarios.getPersonasPorSala(personaBorrada.sala));
    } catch (error) {
console.log("disconecte");
      console.log(error);
    }
  });

  client.on("cerrarsesion", () => {
    try {
      let personaBorrada = usuarios.borrarPersona(client.id);

      client.broadcast
        .to(personaBorrada.sala)
        .emit(
          "crearMensaje",
          crearMensaje("Administrador", `${personaBorrada.nombre} salio.`)
        );
      client.broadcast
        .to(personaBorrada.sala)
        .emit("listaPersona", usuarios.getPersonasPorSala(personaBorrada.sala));
    } catch (error) {
      console.log(error);
    }
  });

  client.on("connect_failed", function () {
    console.log("Connection Failed");
  });

  //mensajes privados

  client.on("mensajePrivado", (data) => {
    try {
      let persona = usuarios.getPersona(client.id);

      client.broadcast
        .to(data.para)
        .emit("mensajePrivado", crearMensaje(persona.nombre, data.mensaje));
    } catch (error) {
      console.log(error);
    }
  });
});
