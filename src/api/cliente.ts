// Cliente HTTP unico de la app (skill expo-pantallas): agrega Authorization y, ante un token de acceso
// vencido, renueva la sesion una sola vez y repite la solicitud (AUT-04, D-02, D-17).
import { almacenSesion } from './almacen-sesion';
import type { DatosRenovacion, RespuestaError, RespuestaExito } from './contrato';

// Se lee al usar: Expo la inserta al compilar y las pruebas la fijan en configurar-jest.js.
export function urlApi(): string | undefined {
  return process.env.EXPO_PUBLIC_URL_API;
}

export class ErrorApi extends Error {
  constructor(
    public codigo: string,
    public http: number,
    mensaje: string,
    public detalles?: unknown,
  ) {
    super(mensaje);
    this.name = 'ErrorApi';
  }
}

interface OpcionesPedido {
  metodo?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  cuerpo?: unknown;
  autenticado?: boolean;
}

let alSesionInvalida: (() => void) | undefined;

// El proveedor de sesion se entera cuando la renovacion falla y vuelve a la Bienvenida.
export function escucharSesionInvalida(funcion: (() => void) | undefined): void {
  alSesionInvalida = funcion;
}

async function enviar<T>(ruta: string, opciones: OpcionesPedido): Promise<RespuestaExito<T>> {
  const base = urlApi();
  if (!base) throw new Error('Falta EXPO_PUBLIC_URL_API');

  const cabeceras: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = almacenSesion.tokenAcceso();
  if (opciones.autenticado && token) cabeceras.Authorization = `Bearer ${token}`;

  let respuesta: Response;
  try {
    respuesta = await fetch(`${base}${ruta}`, {
      method: opciones.metodo ?? 'GET',
      headers: cabeceras,
      body: opciones.cuerpo === undefined ? undefined : JSON.stringify(opciones.cuerpo),
    });
  } catch {
    throw new ErrorApi('SIN_CONEXION', 0, 'Sin conexión');
  }
  if (respuesta.status === 204) return { datos: undefined as T };

  const cuerpo: unknown = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    const error = (cuerpo as RespuestaError | null)?.error;
    throw new ErrorApi(
      error?.codigo ?? 'INTERNO',
      respuesta.status,
      error?.mensaje ?? '',
      error?.detalles,
    );
  }
  return cuerpo as RespuestaExito<T>;
}

let renovacionEnCurso: Promise<boolean> | null = null;

// Una sola renovacion a la vez: si varias solicitudes encuentran el token vencido, esperan la misma.
export function renovarSesion(): Promise<boolean> {
  renovacionEnCurso ??= (async () => {
    try {
      const tokenRenovacion = await almacenSesion.tokenRenovacion();
      if (!tokenRenovacion) return false;
      const { datos } = await enviar<DatosRenovacion>('/autenticacion/renovar', {
        metodo: 'POST',
        cuerpo: { tokenRenovacion },
      });
      await almacenSesion.guardar(datos);
      return true;
    } catch (error) {
      // Sin conexion no se borra la sesion: se reintenta mas tarde.
      if (error instanceof ErrorApi && error.codigo === 'SIN_CONEXION') throw error;
      await almacenSesion.limpiar();
      alSesionInvalida?.();
      return false;
    } finally {
      renovacionEnCurso = null;
    }
  })();
  return renovacionEnCurso;
}

async function enviarRenovando<T>(
  ruta: string,
  opciones: OpcionesPedido,
): Promise<RespuestaExito<T>> {
  try {
    return await enviar<T>(ruta, opciones);
  } catch (error) {
    const vencido = error instanceof ErrorApi && error.codigo === 'TOKEN_VENCIDO';
    if (!opciones.autenticado || !vencido) throw error;
    if (!(await renovarSesion())) throw error;
    return enviar<T>(ruta, opciones);
  }
}

export async function pedir<T>(
  ruta: string,
  opciones: OpcionesPedido = {},
): Promise<RespuestaExito<T>> {
  try {
    return await enviarRenovando<T>(ruta, opciones);
  } catch (error) {
    // D-05: solo AUTENTICACION_REQUERIDA en una solicitud autenticada borra la sesión local
    // (p. ej., usuario desactivado), también tras el reintento; la red o un 500 no la borran.
    const rechazada = error instanceof ErrorApi && error.codigo === 'AUTENTICACION_REQUERIDA';
    if (opciones.autenticado && rechazada) {
      await almacenSesion.limpiar();
      alSesionInvalida?.();
    }
    throw error;
  }
}
