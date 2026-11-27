// Endpoints de autenticacion (DERCAS §10.2, D-01, D-14, D-16 a D-18).
import { pedir } from './cliente';
import type {
  DatosRecuperarClave,
  DatosSesion,
  EntradaInicioSesion,
  EntradaRecuperarClave,
  EntradaRegistro,
  EntradaRestablecerClave,
  PerfilUsuario,
} from './contrato';

export async function registrar(entrada: EntradaRegistro): Promise<DatosSesion> {
  const { datos } = await pedir<DatosSesion>('/autenticacion/registro', {
    metodo: 'POST',
    cuerpo: entrada,
  });
  return datos;
}

export async function iniciarSesion(entrada: EntradaInicioSesion): Promise<DatosSesion> {
  const { datos } = await pedir<DatosSesion>('/autenticacion/iniciar-sesion', {
    metodo: 'POST',
    cuerpo: entrada,
  });
  return datos;
}

// AUT-07, D-01: responde 202 con el mismo mensaje exista o no el correo.
export async function recuperarClave(entrada: EntradaRecuperarClave): Promise<DatosRecuperarClave> {
  const { datos } = await pedir<DatosRecuperarClave>('/autenticacion/recuperar-clave', {
    metodo: 'POST',
    cuerpo: entrada,
  });
  return datos;
}

// AUT-07, D-01: 204; no abre sesion, la app lleva a Iniciar sesion.
export async function restablecerClave(entrada: EntradaRestablecerClave): Promise<void> {
  await pedir<void>('/autenticacion/restablecer-clave', { metodo: 'POST', cuerpo: entrada });
}

export async function cerrarSesion(tokenRenovacion: string): Promise<void> {
  await pedir<void>('/autenticacion/cerrar-sesion', {
    metodo: 'POST',
    cuerpo: { tokenRenovacion },
    autenticado: true,
  });
}

export async function consultarPerfil(): Promise<PerfilUsuario> {
  const { datos } = await pedir<PerfilUsuario>('/usuarios/yo', { autenticado: true });
  return datos;
}
