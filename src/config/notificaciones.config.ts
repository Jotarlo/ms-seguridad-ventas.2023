export namespace ConfiguracionNotificaciones {
  export const asunto2fa: string = "Código de Verificación";
  export const asuntoVerificacionCorreo: string = "Verificación de correo";
  export const urlNotificaciones2fa: string = "http://localhost:5187/Notificaciones/enviar-correo-2fa";
  export const urlNotificacionesSms: string = "http://localhost:5187/Notificaciones/enviar-sms";
  export const urlValidacionCorreoFrontend: string = "http://localhost:4200/validar-hash-usuario-publico";
}
