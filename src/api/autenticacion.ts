// Endpoints de autenticacion (DERCAS §10.2, D-14, D-16 a D-18).
import { pedir } from './cliente';
import type { DatosSesion, EntradaInicioSesion, EntradaRegistro, PerfilUsuario } from './contrato';

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
