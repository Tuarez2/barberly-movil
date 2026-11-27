// Respuesta haptica de la interfaz (D-26). Nunca rompe la app: si el dispositivo no la tiene, se ignora.
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

function intentar(accion: () => Promise<void>): void {
  if (Platform.OS === 'web') return;
  accion().catch(() => undefined);
}

export const haptica = {
  toque: () => intentar(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  exito: () => intentar(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  error: () => intentar(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
