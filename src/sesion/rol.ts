// Entrada segun el rol (AUT-08, HU-AUT-02, D-10). El propietario no tiene pantallas en la app.
import type { PerfilUsuario } from '@/api/contrato';

import type { MembresiaActiva } from './barberia-activa';

export type RutaInicial = '/explorar' | '/hoy';

export function esBarbero(perfil: PerfilUsuario): boolean {
  return perfil.membresias.some((membresia) => membresia.rol === 'BARBERO');
}

export function esPropietario(perfil: PerfilUsuario): boolean {
  return perfil.membresias.some((membresia) => membresia.rol === 'PROPIETARIO');
}

// Membresía BARBERO activa → su agenda; rol cliente (o propietario) → Explorar, donde el
// propietario ve el aviso del panel web (AUT-09).
export function rutaInicial(activa: MembresiaActiva): RutaInicial {
  return activa ? '/hoy' : '/explorar';
}

export function primerNombre(perfil: Pick<PerfilUsuario, 'nombre'>): string {
  return perfil.nombre.trim().split(/\s+/)[0] ?? perfil.nombre;
}
