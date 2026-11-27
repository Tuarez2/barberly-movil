// Codigo de error de la API → texto para la persona (docs/errores.md, identidad visual §7).
// Nunca se muestra el mensaje crudo del servidor ni el stack.
import { ErrorApi } from '@/api/cliente';

const MENSAJES: Record<string, string> = {
  SIN_CONEXION: 'No hay conexión. Revisa tu internet e intenta de nuevo.',
  DATOS_INVALIDOS: 'Revisa los datos marcados.',
  AUTENTICACION_REQUERIDA: 'Tu sesión terminó. Inicia sesión de nuevo.',
  TOKEN_VENCIDO: 'Tu sesión terminó. Inicia sesión de nuevo.',
  ACCESO_DENEGADO: 'No tienes permiso para hacer esto.',
  NO_ENCONTRADO: 'No encontramos lo que buscabas.',
  CORREO_REGISTRADO: 'Ya existe una cuenta con ese correo. Inicia sesión.',
  CREDENCIALES_INVALIDAS: 'Correo o contraseña incorrectos.',
  CODIGO_INVALIDO: 'El código no es válido o ya venció. Revísalo o pide otro.',
  DEMASIADAS_SOLICITUDES: 'Demasiados intentos. Espera unos minutos e intenta de nuevo.',
  HORARIO_OCUPADO: 'Ese horario ya fue tomado. Elige otro.',
  INTERNO: 'Algo salió mal de nuestro lado. Intenta de nuevo.',
};

const GENERICO = 'No pudimos completar la acción. Intenta de nuevo.';

export function mensajeDeError(error: unknown): string {
  if (error instanceof ErrorApi) return MENSAJES[error.codigo] ?? GENERICO;
  return GENERICO;
}

// DATOS_INVALIDOS trae { campo, mensaje } por cada problema (validar.ts de la API).
export function erroresPorCampo(error: unknown): Record<string, string> {
  if (!(error instanceof ErrorApi) || error.codigo !== 'DATOS_INVALIDOS') return {};
  if (!Array.isArray(error.detalles)) return {};
  const resultado: Record<string, string> = {};
  for (const detalle of error.detalles as { campo?: unknown; mensaje?: unknown }[]) {
    if (typeof detalle.campo === 'string' && typeof detalle.mensaje === 'string') {
      resultado[detalle.campo] ??= detalle.mensaje;
    }
  }
  return resultado;
}
