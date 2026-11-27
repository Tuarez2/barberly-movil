import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { movimiento, useTema } from '@/tema';

interface PropiedadesCorte {
  ancho?: number;
  retraso?: number;
}

// El elemento firma: una diagonal fina de 9° que se dibuja de izquierda a derecha (identidad visual §6 y §6.1).
export function CorteDiagonal({ ancho = 120, retraso = 0 }: PropiedadesCorte) {
  const { colores } = useTema();
  const reducir = useReducedMotion();
  const progreso = useSharedValue(reducir ? 1 : 0);

  useEffect(() => {
    if (reducir) return;
    progreso.set(
      withDelay(
        retraso,
        withTiming(1, { duration: movimiento.duracionLenta, easing: movimiento.curvaSalida }),
      ),
    );
  }, [progreso, reducir, retraso]);

  const estiloLinea = useAnimatedStyle(() => ({ width: ancho * progreso.get() }));

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[estilos.contenedor, { width: ancho }]}
    >
      <Animated.View
        style={[estilos.linea, { backgroundColor: colores.colorPrimario }, estiloLinea]}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { height: 24, justifyContent: 'center', transform: [{ rotate: '-9deg' }] },
  linea: { height: 2, borderRadius: 1 },
});
