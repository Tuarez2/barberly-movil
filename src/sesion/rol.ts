// Entrada segun el rol (AUT-08, HU-AUT-02, D-10). El propietario no tiene pantallas en la app.
import type { PerfilUsuario } from '@/api/contrato';

export type RutaInicial = '/explorar' | '/hoy';

export function esBarbero(perfil: PerfilUsuario): boolean {
  return perfil.membresias.some((membresia) => membresia.rol === 'BARBERO');
}

export function esPropietario(perfil: PerfilUsuario): boolean {
  return perfil.membresias.some((membresia) => membresia.rol === 'PROPIETARIO');
}

// Barbero → su agenda; cliente o propietario → Explorar (el propietario ve el aviso del panel web).
export function rutaInicial(perfil: PerfilUsuario): RutaInicial {
  return esBarbero(perfil) ? '/hoy' : '/explorar';
}

export function primerNombre(perfil: Pick<PerfilUsuario, 'nombre'>): string {
  return perfil.nombre.trim().split(/\s+/)[0] ?? perfil.nombre;
}
