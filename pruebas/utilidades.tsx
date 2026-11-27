// Utilidades de pruebas: cada render con su propio cliente de consultas, sin reintentos.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

export function renderConConsultas(elemento: ReactElement) {
  const cliente = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  return render(<QueryClientProvider client={cliente}>{elemento}</QueryClientProvider>);
}
