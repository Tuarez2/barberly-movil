import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown, FadeOut, useReducedMotion } from 'react-native-reanimated';

import { espacios, movimiento, radios, tipografia, useTema } from '@/tema';

interface PropiedadesAviso {
  mensaje: string;
  tipo?: 'error' | 'informacion';
  testID?: string;
}

// Mensaje de pantalla (errores de la API, avisos como el del panel web, D-10).
export function Aviso({ mensaje, tipo = 'error', testID }: PropiedadesAviso) {
  const { colores } = useTema();
  const reducir = useReducedMotion();
  const color = tipo === 'error' ? colores.colorError : colores.colorAcentoTexto;

  return (
    <Animated.View
      accessible
      accessibilityRole={tipo === 'error' ? 'alert' : 'summary'}
      accessibilityLiveRegion="polite"
      entering={reducir ? undefined : FadeInDown.duration(movimiento.duracionBase)}
      exiting={reducir ? undefined : FadeOut.duration(movimiento.duracionRapida)}
      testID={testID}
      style={[estilos.aviso, { backgroundColor: colores.colorSuperficie, borderLeftColor: color }]}
    >
      <Text style={[tipografia.textoChico, { color: colores.colorTinta }]}>{mensaje}</Text>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  aviso: {
    borderLeftWidth: 3,
    borderRadius: radios.radioChico,
    paddingHorizontal: espacios.espacio4,
    paddingVertical: espacios.espacio3,
  },
});
