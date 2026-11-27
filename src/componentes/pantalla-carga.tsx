import { StyleSheet, Text, View } from 'react-native';

import { textos } from '@/textos';
import { espacios, tipografia, useTema } from '@/tema';

import { CorteDiagonal } from './corte-diagonal';
import { LogoBarberly } from './logo-barberly';

// Carga: el logo y la diagonal que se dibuja (identidad visual §6, tercer uso del corte).
export function PantallaCarga() {
  const { colores } = useTema();

  return (
    <View
      accessibilityLabel={textos.carga}
      accessibilityRole="progressbar"
      style={[estilos.contenedor, { backgroundColor: colores.colorFondo }]}
    >
      <LogoBarberly />
      <CorteDiagonal ancho={140} />
      <Text style={[tipografia.textoChico, { color: colores.colorTextoSecundario }]}>
        {textos.carga}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { alignItems: 'center', flex: 1, gap: espacios.espacio3, justifyContent: 'center' },
});
