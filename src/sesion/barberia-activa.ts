// Barbería o rol activo en la app (AUT-09, D-10, D-18). La API no guarda "barbería activa":
// la app recuerda el id de la membresía elegida en expo-secure-store. El propietario no tiene
// pantallas en la app, así que solo se eligen membresías BARBERO o el rol cliente, que siempre
// se puede elegir porque no necesita membresía (§2.3).
import type { MembresiaUsuario, PerfilUsuario } from '@/api/contrato';

// Valor guardado cuando se elige usar la app como cliente.
export const ELECCION_CLIENTE = 'cliente';

// null = rol cliente; si no, la membresía BARBERO con su barberia.id y barberoId (rutas con :id).
export type MembresiaActiva = MembresiaUsuario | null;

// D-18: se respeta el orden de la API, que ya las entrega por el nombre de la barbería.
export function membresiasElegibles(perfil: PerfilUsuario): MembresiaUsuario[] {
  return perfil.membresias.filter((membresia) => membresia.rol === 'BARBERO');
}

// Con al menos una membresía BARBERO hay dos opciones o más (ella y Cliente): se ofrece el cambio.
export function ofreceCambio(perfil: PerfilUsuario): boolean {
  return membresiasElegibles(perfil).length > 0;
}

// Sin elección guardada se elige sola: la primera por nombre o, sin membresía BARBERO, el rol
// cliente. Si la guardada ya no aparece en GET /usuarios/yo, se usa ese mismo respaldo.
export function resolverActiva(perfil: PerfilUsuario, guardada: string | null): MembresiaActiva {
  const elegibles = membresiasElegibles(perfil);
  const [primera] = elegibles;
  if (!primera || guardada === ELECCION_CLIENTE) return null;
  return elegibles.find((membresia) => membresia.id === guardada) ?? primera;
}
