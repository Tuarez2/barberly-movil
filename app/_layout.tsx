import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { DMSans_600SemiBold } from '@expo-google-fonts/dm-sans/600SemiBold';
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { Fraunces_700Bold } from '@expo-google-fonts/fraunces/700Bold';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { crearClienteConsultas } from '@/api/cliente-consultas';
import { ProveedorSesion } from '@/sesion/proveedor-sesion';
import { useTema } from '@/tema';

SplashScreen.preventAutoHideAsync();

export default function LayoutRaiz() {
  const { modo, colores } = useTema();
  const [clienteConsultas] = useState(crearClienteConsultas);
  const [fuentesListas, errorFuentes] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
  });
  const listo = fuentesListas || errorFuentes !== null;

  useEffect(() => {
    if (listo) SplashScreen.hideAsync();
  }, [listo]);

  if (!listo) return null;

  return (
    <QueryClientProvider client={clienteConsultas}>
      <ProveedorSesion>
        <StatusBar style={modo === 'oscuro' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade_from_bottom',
            contentStyle: { backgroundColor: colores.colorFondo },
          }}
        />
      </ProveedorSesion>
    </QueryClientProvider>
  );
}
