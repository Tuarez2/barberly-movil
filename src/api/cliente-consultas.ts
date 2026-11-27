import { QueryClient } from '@tanstack/react-query';

import { ErrorApi } from './cliente';

// Errores de negocio (4xx) no se reintentan; los de red y servidor, hasta 2 veces.
export function crearClienteConsultas(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (fallos, error) =>
          !(error instanceof ErrorApi && error.http >= 400 && error.http < 500) && fallos < 2,
      },
      mutations: { retry: false },
    },
  });
}
