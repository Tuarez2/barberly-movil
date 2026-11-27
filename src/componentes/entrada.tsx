import type { ReactNode } from 'react';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { movimiento } from '@/tema';

interface PropiedadesEntrada {
  indice?: number;
  children: ReactNode;
}

// Entrada en cascada: desvanece y sube 8 px, 40 ms despues del anterior (identidad visual §6.1).
export function Entrada({ indice = 0, children }: PropiedadesEntrada) {
  const reducir = useReducedMotion();
  const animacion = reducir
    ? undefined
    : FadeInDown.duration(movimiento.duracionBase)
        .delay(indice * movimiento.escalonado)
        .withInitialValues({ transform: [{ translateY: movimiento.desplazamientoEntrada }] });

  return <Animated.View entering={animacion}>{children}</Animated.View>;
}
