// docs/identidad-visual.md §6.1 (D-26). Si cambia un valor, se cambia alli.
import { Easing } from 'react-native-reanimated';

export const movimiento = {
  duracionRapida: 150,
  duracionBase: 250,
  duracionLenta: 400,
  escalonado: 40,
  desplazamientoEntrada: 8,
  escalaPresionado: 0.97,
  resorteSuave: { damping: 18, stiffness: 180 },
  resorteFirme: { damping: 20, stiffness: 320 },
  curvaSalida: Easing.out(Easing.cubic),
} as const;
