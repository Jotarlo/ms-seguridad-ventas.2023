import {authenticate} from '@loopback/authentication';
import {service} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where
} from '@loopback/repository';
import {
  del, get,
  getModelSchemaRef, HttpErrors, param, patch, post, put, requestBody,
  response
} from '@loopback/rest';
import {UserProfile} from '@loopback/security';
import {ConfiguracionNotificaciones} from '../config/notificaciones.config';
import {ConfiguracionSeguridad} from '../config/seguridad.config';
import {Credenciales, CredencialesRecuperarClave, FactorDeAutenticacionPorCodigo, HashValidacionUsuario, Login, PermisosRolMenu, Usuario} from '../models';
import {LoginRepository, UsuarioRepository} from '../repositories';
import {AuthService, NotificacionesService, SeguridadUsuarioService} from '../services';

export class UsuarioController {
  constructor(
    @repository(UsuarioRepository)
    public usuarioRepository: UsuarioRepository,
    @service(SeguridadUsuarioService)
    public servicioSeguridad: SeguridadUsuarioService,
    @repository(LoginRepository)
    public respositorioLogin: LoginRepository,
    @service(AuthService)
    private servicioAuth: AuthService,
    @service(NotificacionesService)
    public servicioNotificaciones: NotificacionesService
  ) { }

  @authenticate({
    strategy: "auth",
    options: ["Usuario", "guardar"]
  })
  @post('/usuario')
  @response(200, {
    description: 'Usuario model instance',
    content: {'application/json': {schema: getModelSchemaRef(Usuario)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {
            title: 'NewUsuario',
            exclude: ['_id'],
          }),
        },
      },
    })
    usuario: Omit<Usuario, '_id'>,
  ): Promise<Usuario> {
    // crear la clave
    let clave = this.servicioSeguridad.crearTextoAleatorio(10);
    console.log(clave);
    // cifrar la clave
    let claveCifrada = this.servicioSeguridad.cifrarTexto(clave);
    // asignar la clave cifrada al usuario
    usuario.clave = claveCifrada;
    usuario.estadoValidacion = true;
    // enviar correo electrónico de notificación
    return this.usuarioRepository.create(usuario);
  }


  @post('/usuario-publico')
  @response(200, {
    description: 'Usuario model instance',
    content: {'application/json': {schema: getModelSchemaRef(Usuario)}},
  })
  async creacionPublica(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {
            title: 'NewUsuario',
            exclude: ['_id'],
          }),
        },
      },
    })
    usuario: Omit<Usuario, '_id'>,
  ): Promise<Usuario> {
    // crear la clave
    let clave = this.servicioSeguridad.crearTextoAleatorio(10);
    console.log(clave);
    // cifrar la clave
    let claveCifrada = this.servicioSeguridad.cifrarTexto(clave);
    // asignar la clave cifrada al usuario
    usuario.clave = claveCifrada;
    // hash de validación de correo
    let hash = this.servicioSeguridad.crearTextoAleatorio(100);
    usuario.hashValidacion = hash;
    usuario.estadoValidacion = false;
    usuario.aceptado = false;
    usuario.rolId = ConfiguracionSeguridad.rolUsuarioPublico;


    // Notificación del hash
    let enlace = `<a href="${ConfiguracionNotificaciones.urlValidacionCorreoFrontend}/${hash}" target='_blank'>Validar</a>`;
    let datos = {
      correoDestino: usuario.correo,
      nombreDestino: usuario.primerNombre + " " + usuario.segundoNombre,
      contenidoCorreo: `Por favor visite este link para validar su correo: ${enlace}`,
      asuntoCorreo: ConfiguracionNotificaciones.asuntoVerificacionCorreo,
    };
    let url = ConfiguracionNotificaciones.urlNotificaciones2fa;
    this.servicioNotificaciones.EnviarNotificacion(datos, url);

    // Envío de clave
    let datosCorreo = {
      correoDestino: usuario.correo,
      nombreDestino: usuario.primerNombre + " " + usuario.segundoNombre,
      contenidoCorreo: `Su clave asignada es: ${clave}`,
      asuntoCorreo: ConfiguracionNotificaciones.claveAsignada,
    };
    this.servicioNotificaciones.EnviarNotificacion(datosCorreo, url);
    // enviar correo electrónico de notificación
    return this.usuarioRepository.create(usuario);

  }


  @post('/validar-hash-usuario')
  @response(200, {
    description: 'Validar hash',
  })
  async ValidarHashUsuario(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(HashValidacionUsuario, {}),
        },
      },
    })
    hash: HashValidacionUsuario,
  ): Promise<boolean> {
    let usuario = await this.usuarioRepository.findOne({
      where: {
        hashValidacion: hash.codigoHash,
        estadoValidacion: false
      }
    });
    if (usuario) {
      usuario.estadoValidacion = true;
      this.usuarioRepository.replaceById(usuario._id, usuario);
      return true;
    }
    return false;
  }

  @get('/usuario/count')
  @response(200, {
    description: 'Usuario model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Usuario) where?: Where<Usuario>,
  ): Promise<Count> {
    return this.usuarioRepository.count(where);
  }

  @authenticate({
    strategy: "auth",
    options: [ConfiguracionSeguridad.menuUsuarioId, ConfiguracionSeguridad.listarAccion]
  })
  @get('/usuario')
  @response(200, {
    description: 'Array of Usuario model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Usuario, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Usuario) filter?: Filter<Usuario>,
  ): Promise<Usuario[]> {
    return this.usuarioRepository.find(filter);
  }

  @patch('/usuario')
  @response(200, {
    description: 'Usuario PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {partial: true}),
        },
      },
    })
    usuario: Usuario,
    @param.where(Usuario) where?: Where<Usuario>,
  ): Promise<Count> {
    return this.usuarioRepository.updateAll(usuario, where);
  }

  @get('/usuario/{id}')
  @response(200, {
    description: 'Usuario model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Usuario, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Usuario, {exclude: 'where'}) filter?: FilterExcludingWhere<Usuario>
  ): Promise<Usuario> {
    return this.usuarioRepository.findById(id, filter);
  }

  @patch('/usuario/{id}')
  @response(204, {
    description: 'Usuario PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {partial: true}),
        },
      },
    })
    usuario: Usuario,
  ): Promise<void> {
    await this.usuarioRepository.updateById(id, usuario);
  }

  @put('/usuario/{id}')
  @response(204, {
    description: 'Usuario PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() usuario: Usuario,
  ): Promise<void> {
    await this.usuarioRepository.replaceById(id, usuario);
  }

  @del('/usuario/{id}')
  @response(204, {
    description: 'Usuario DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.usuarioRepository.deleteById(id);
  }

  /**
   * Métodos personalizados para la API
   */

  @post('/identificar-usuario')
  @response(200, {
    description: "Identificar un usuario por correo y clave",
    content: {'application/json': {schema: getModelSchemaRef(Usuario)}}
  })
  async identificarUsuario(
    @requestBody(
      {
        content: {
          'application/json': {
            schema: getModelSchemaRef(Credenciales)
          }
        }
      }
    )
    credenciales: Credenciales
  ): Promise<object> {
    let usuario = await this.servicioSeguridad.identificarUsuario(credenciales);
    if (usuario) {
      let codigo2fa = this.servicioSeguridad.crearTextoAleatorio(5);
      console.log(codigo2fa);
      let login: Login = new Login();
      login.usuarioId = usuario._id!;
      login.codigo2fa = codigo2fa;
      login.estadoCodigo2fa = false;
      login.token = "";
      login.estadoToken = false;
      this.respositorioLogin.create(login);
      usuario.clave = "";
      // notificar al usuario vía correo o sms
      let datos = {
        correoDestino: usuario.correo,
        nombreDestino: usuario.primerNombre + " " + usuario.segundoNombre,
        contenidoCorreo: `Su código de segundo factor de autenticación es: ${codigo2fa}`,
        asuntoCorreo: ConfiguracionNotificaciones.asunto2fa,
      };
      let url = ConfiguracionNotificaciones.urlNotificaciones2fa;
      this.servicioNotificaciones.EnviarNotificacion(datos, url);
      return usuario;
    }
    return new HttpErrors[401]("Credenciales incorrectas.");
  }



  @post('/recuperar-clave')
  @response(200, {
    description: "Identificar un usuario por correo y clave",
    content: {'application/json': {schema: getModelSchemaRef(Usuario)}}
  })
  async RecuperarClaveUsuario(
    @requestBody(
      {
        content: {
          'application/json': {
            schema: getModelSchemaRef(CredencialesRecuperarClave)
          }
        }
      }
    )
    credenciales: CredencialesRecuperarClave
  ): Promise<object> {
    let usuario = await this.usuarioRepository.findOne({
      where: {
        correo: credenciales.correo
      }
    });
    if (usuario) {
      let nuevaClave = this.servicioSeguridad.crearTextoAleatorio(5);
      console.log(nuevaClave);
      let claveCifrada = this.servicioSeguridad.cifrarTexto(nuevaClave);
      usuario.clave = claveCifrada;
      this.usuarioRepository.updateById(usuario._id, usuario);

      // notificar al usuario vía sms
      let datos = {
        numeroDestino: usuario.celular,
        contenidoMensaje: `Hola ${usuario.primerNombre}, su nueva clave es: ${nuevaClave}`,
      };
      let url = ConfiguracionNotificaciones.urlNotificacionesSms;
      this.servicioNotificaciones.EnviarNotificacion(datos, url);
      return usuario;
    }
    return new HttpErrors[401]("Credenciales incorrectas.");
  }



  @post('/validar-permisos')
  @response(200, {
    description: "Validación de permisos de usuario para lógica de negocio",
    content: {'application/json': {schema: getModelSchemaRef(PermisosRolMenu)}}
  })
  async ValidarPermisosDeUsuario(
    @requestBody(
      {
        content: {
          'application/json': {
            schema: getModelSchemaRef(PermisosRolMenu)
          }
        }
      }
    )
    datos: PermisosRolMenu
  ): Promise<UserProfile | undefined> {
    let idRol = this.servicioSeguridad.obtenerRolDesdeToken(datos.token);
    return this.servicioAuth.VerificarPermisoDeUsuarioPorRol(idRol, datos.idMenu, datos.accion);
  }

  @post('/verificar-2fa')
  @response(200, {
    description: "Validar un código de 2fa"
  })
  async VerificarCodigo2fa(
    @requestBody(
      {
        content: {
          'application/json': {
            schema: getModelSchemaRef(FactorDeAutenticacionPorCodigo)
          }
        }
      }
    )
    credenciales: FactorDeAutenticacionPorCodigo
  ): Promise<object> {
    let usuario = await this.servicioSeguridad.validarCodigo2fa(credenciales);
    if (usuario) {
      let token = this.servicioSeguridad.crearToken(usuario);
      let menu = [];
      if (usuario) {
        usuario.clave = "";
        try {
          this.usuarioRepository.logins(usuario._id).patch(
            {
              estadoCodigo2fa: true,
              token: token
            },
            {
              estadoCodigo2fa: false
            });
        } catch {
          console.log("No se ha almacenado el cambio del estado de token en la base de datos.")
        }
        menu = await this.servicioSeguridad.ConsultarPermisosDeMenuPorUsuario(usuario.rolId);
        return {
          user: usuario,
          token: token,
          menu: menu
        };
      }
    }
    return new HttpErrors[401]("Código de 2fa inválido para el usuario definido.");
  }
}
