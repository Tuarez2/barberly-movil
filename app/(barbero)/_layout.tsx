import { Redirect, Stack } from 'expo-router';

import { PantallaCarga } from '@/componentes/pantalla-carga';
import { useSesion } from '@/sesion/proveedor-sesion';

// Solo con una membresía BARBERO activa y elegida (AUT-08, AUT-09, SEG-03): quien no es barbero
// o eligió el rol cliente va a Explorar.
export default function LayoutBarbero() {
  const { estado, perfil, activa } = useSesion();
  if (estado === 'cargando') return <PantallaCarga />;
  if (estado !== 'con-sesion') return <Redirect href="/bienvenida" />;
  if (!perfil || activa === undefined) return <PantallaCarga />;
  if (!activa) return <Redirect href="/explorar" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
