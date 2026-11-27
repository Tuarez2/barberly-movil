import { Redirect, Stack } from 'expo-router';

import { PantallaCarga } from '@/componentes/pantalla-carga';
import { useSesion } from '@/sesion/proveedor-sesion';
import { esBarbero } from '@/sesion/rol';

// Solo para quien tiene una membresía BARBERO activa (AUT-08, SEG-03).
export default function LayoutBarbero() {
  const { estado, perfil } = useSesion();
  if (estado === 'cargando') return <PantallaCarga />;
  if (estado !== 'con-sesion') return <Redirect href="/bienvenida" />;
  if (!perfil) return <PantallaCarga />;
  if (!esBarbero(perfil)) return <Redirect href="/explorar" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
