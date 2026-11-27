import { Redirect, Stack } from 'expo-router';

import { useSesion } from '@/sesion/proveedor-sesion';

// Con sesión abierta no se vuelve a Bienvenida, Registro ni Inicio de sesión.
export default function LayoutAutenticacion() {
  const { estado } = useSesion();
  if (estado === 'con-sesion') return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
