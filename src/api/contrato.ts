// Copia del contrato de barberly-api (src/compartido/contrato.ts), D-11. Sin logica de negocio.
// Si cambia en la API, se actualiza aqui; la referencia es GET /api/v1/documentacion.
import { z } from 'zod';

export const esquemaUuid = z.uuid();

// DERCAS §10.1: por defecto 1 y 10, maximo 50.
export const esquemaPaginacion = z
  .object({
    pagina: z.coerce.number().int().min(1).default(1),
    limite: z.coerce.number().int().min(1).max(50).default(10),
  })
  .strict();

export type Paginacion = z.infer<typeof esquemaPaginacion>;

export const ROLES_MEMBRESIA = ['PROPIETARIO', 'BARBERO'] as const;
export type RolMembresia = (typeof ROLES_MEMBRESIA)[number];

export interface MetaPaginacion {
  pagina: number;
  limite: number;
  total: number;
}

export interface RespuestaExito<T> {
  datos: T;
  meta?: MetaPaginacion;
}

export interface RespuestaError {
  error: {
    codigo: string;
    mensaje: string;
    detalles?: unknown;
  };
}
