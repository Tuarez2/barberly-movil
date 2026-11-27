// Tokens de la sesion (AUT-04, §11.4). El de renovacion vive solo en expo-secure-store;
// el de acceso dura 15 minutos y vive solo en memoria.
import * as SecureStore from 'expo-secure-store';

const CLAVE_RENOVACION = 'barberly.tokenRenovacion';

let tokenAcceso: string | null = null;

export const almacenSesion = {
  tokenAcceso: () => tokenAcceso,
  async guardar(tokens: { tokenAcceso: string; tokenRenovacion: string }): Promise<void> {
    tokenAcceso = tokens.tokenAcceso;
    await SecureStore.setItemAsync(CLAVE_RENOVACION, tokens.tokenRenovacion);
  },
  tokenRenovacion: () => SecureStore.getItemAsync(CLAVE_RENOVACION),
  async limpiar(): Promise<void> {
    tokenAcceso = null;
    await SecureStore.deleteItemAsync(CLAVE_RENOVACION);
  },
};
