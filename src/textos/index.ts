export const textos = {
  bienvenida: {
    lema: 'Reserva tu corte',
    descripcion: 'Ve solo los horarios libres y reserva en menos de un minuto.',
    crearCuenta: 'Crear cuenta',
    iniciarSesion: 'Iniciar sesión',
  },
  inicioSesion: {
    titulo: 'Qué bueno verte',
    subtitulo: 'Entra para ver tus citas y reservar en segundos.',
    correo: 'Correo',
    clave: 'Contraseña',
    entrar: 'Iniciar sesión',
    sinCuenta: '¿No tienes cuenta? Crear cuenta',
  },
  registro: {
    titulo: 'Crea tu cuenta',
    subtitulo: 'Reserva sin escribir por WhatsApp y recibe recordatorios de tus citas.',
    nombre: 'Nombre',
    correo: 'Correo',
    telefono: 'Teléfono',
    clave: 'Contraseña',
    ayudaClave: 'Mínimo 8 caracteres, con al menos una letra y un número.',
    crear: 'Crear cuenta',
    conCuenta: '¿Ya tienes cuenta? Iniciar sesión',
  },
  volver: 'Volver',
  carga: 'Preparando tu agenda',
  sinConexion: {
    titulo: 'Sin conexión',
    mensaje: 'No pudimos conectarnos con Barberly. Revisa tu internet.',
    reintentar: 'Reintentar',
  },
  avisoPanel:
    'Eres propietario: administra tu barbería, tu equipo y tus estadísticas desde el panel web de Barberly.',
  inicioCliente: {
    saludo: (nombre: string) => `Hola, ${nombre}`,
    subtitulo: '¿Listo para tu próximo corte?',
    pronto:
      'Muy pronto: explora barberías cerca de ti, mira sus horarios libres y reserva en segundos.',
    perfil: 'Mi perfil',
  },
  inicioBarbero: {
    saludo: (nombre: string) => `Hola, ${nombre}`,
    subtitulo: 'Así viene tu día.',
    pronto: 'Muy pronto: tu agenda del día y de la semana, en tiempo real.',
    perfil: 'Mi perfil',
  },
  perfil: {
    titulo: 'Mi perfil',
    correo: 'Correo',
    telefono: 'Teléfono',
    barberias: 'Tus barberías',
    rol: { PROPIETARIO: 'Propietario', BARBERO: 'Barbero' },
    cerrarSesion: 'Cerrar sesión',
  },
  proximamente: 'Esta pantalla llega en la siguiente fase.',
  marca: 'Barberly',
} as const;
