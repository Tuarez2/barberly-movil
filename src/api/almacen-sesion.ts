// Tokens de la sesion (AUT-04, §11.4). El de renovacion vive solo en expo-secure-store;
// el de acceso dura 15 minutos y vive solo en memoria. La membresía activa (AUT-09) se recuerda
// junto a la sesión y se borra con ella.
import * as SecureStore from 'expo-secure-store';

const CLAVE_RENOVACION = 'barberly.tokenRenovacion';
const CLAVE_MEMBRESIA_ACTIVA = 'barberly.membresiaActiva';

let tokenAcceso: string | null = null;

export const almacenSesion = {
  tokenAcceso: () => tokenAcceso,
  async guardar(tokens: { tokenAcceso: string; tokenRenovacion: string }): Promise<void> {
    tokenAcceso = tokens.tokenAcceso;
    await SecureStore.setItemAsync(CLAVE_RENOVACION, tokens.tokenRenovacion);
  },
  tokenRenovacion: () => SecureStore.getItemAsync(CLAVE_RENOVACION),
  membresiaActiva: () => SecureStore.getItemAsync(CLAVE_MEMBRESIA_ACTIVA),
  guardarMembresiaActiva: (eleccion: string) =>
    SecureStore.setItemAsync(CLAVE_MEMBRESIA_ACTIVA, eleccion),
  // La elección puede ser de otra cuenta (en iOS el llavero sobrevive a una reinstalación).
  olvidarMembresiaActiva: () => SecureStore.deleteItemAsync(CLAVE_MEMBRESIA_ACTIVA),
  // Cada borrado se intenta aunque el otro falle.
  async limpiar(): Promise<void> {
    tokenAcceso = null;
    await Promise.allSettled([
      SecureStore.deleteItemAsync(CLAVE_RENOVACION),
      SecureStore.deleteItemAsync(CLAVE_MEMBRESIA_ACTIVA),
    ]);
  },
};
