// Perfil del usuario autenticado (DERCAS §10.2, AUT-05, AUT-06, D-05).
import { pedir } from './cliente';
import type { EntradaCambioClave, EntradaEdicionPerfil, UsuarioSesion } from './contrato';

// AUT-05: responde los datos de la cuenta; el correo no cambia en el MVP.
export async function editarPerfil(entrada: EntradaEdicionPerfil): Promise<UsuarioSesion> {
  const { datos } = await pedir<UsuarioSesion>('/usuarios/yo', {
    metodo: 'PATCH',
    cuerpo: entrada,
    autenticado: true,
  });
  return datos;
}

// AUT-06: 204 sin cuerpo. Con la actual incorrecta, CREDENCIALES_INVALIDAS; no cierra la sesión (D-05).
export async function cambiarClave(entrada: EntradaCambioClave): Promise<void> {
  await pedir<void>('/usuarios/yo/clave', {
    metodo: 'PATCH',
    cuerpo: entrada,
    autenticado: true,
  });
}
