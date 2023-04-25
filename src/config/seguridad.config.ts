export namespace ConfiguracionSeguridad {
  export const claveJWT = process.env.SECRET_PASSWORD_JWT;
  export const menuUsuarioId = "63d04fcd013402040c040968";
  export const listarAccion = "listar";
  export const guardarAccion = "guardar";
  export const editarAccion = "editar";
  export const eliminarAccion = "eliminar";
  export const descargarAccion = "descargar";
  export const mongodbConnectionString = process.env.CONNECTION_STRING_MONGODB;
  export const rolUsuarioPublico = "6447fb780692cf465038ff62";
}
