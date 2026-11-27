import { Redirect, Stack } from 'expo-router';

import { PantallaCarga } from '@/componentes/pantalla-carga';
import { useSesion } from '@/sesion/proveedor-sesion';

// Rutas protegidas (AUT-08): sin sesión, a la Bienvenida.
export default function LayoutCliente() {
  const { estado, perfil } = useSesion();
  if (estado === 'cargando') return <PantallaCarga />;
  if (estado !== 'con-sesion') return <Redirect href="/bienvenida" />;
  if (!perfil) return <PantallaCarga />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
