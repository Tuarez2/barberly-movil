import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { movimiento, radios, tipografia, useTema } from '@/tema';
import { haptica } from '@/utilidades/haptica';

interface PropiedadesBoton {
  etiqueta: string;
  tipo?: 'primario' | 'secundario' | 'texto';
  cargando?: boolean;
  deshabilitado?: boolean;
  alPresionar: () => void;
  testID?: string;
}

const ALTURA_BOTON = 48;
// D-26: baja a escala 0,97 con resorte firme y da un toque haptico.
export function Boton({
  etiqueta,
  tipo = 'primario',
  cargando = false,
  deshabilitado = false,
  alPresionar,
  testID,
}: PropiedadesBoton) {
  const { colores } = useTema();
  const reducir = useReducedMotion();
  const escala = useSharedValue(1);
  const inactivo = deshabilitado || cargando;
  const esPrimario = tipo === 'primario';

  const estiloAnimado = useAnimatedStyle(() => ({ transform: [{ scale: escala.get() }] }));

  const animarA = (valor: number) => {
    if (!reducir) escala.set(withSpring(valor, movimiento.resorteFirme));
  };

  const colorTexto = esPrimario
    ? colores.colorSobrePrimario
    : tipo === 'texto'
      ? colores.colorTextoPrimario
      : colores.colorTinta;

  return (
    <Animated.View
      style={[estilos.envoltorio, tipo === 'texto' && estilos.envoltorioTexto, estiloAnimado]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={etiqueta}
        accessibilityState={{ disabled: inactivo, busy: cargando }}
        disabled={inactivo}
        testID={testID}
        onPressIn={() => animarA(movimiento.escalaPresionado)}
        onPressOut={() => animarA(1)}
        onPress={() => {
          haptica.toque();
          alPresionar();
        }}
        style={({ pressed }) => [
          estilos.boton,
          tipo === 'texto' && estilos.botonTexto,
          esPrimario && {
            backgroundColor: pressed ? colores.colorPrimarioPresionado : colores.colorPrimario,
          },
          tipo === 'secundario' && {
            borderColor: colores.colorTinta,
            borderWidth: StyleSheet.hairlineWidth * 2,
          },
          inactivo && !cargando && estilos.inactivo,
        ]}
      >
        {cargando ? (
          <ActivityIndicator color={colorTexto} />
        ) : (
          <Text style={[tipografia.cuerpoFuerte, { color: colorTexto }]}>{etiqueta}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  envoltorio: { alignSelf: 'stretch' },
  envoltorioTexto: { alignSelf: 'center' },
  boton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: radios.radioBoton,
    height: ALTURA_BOTON,
    justifyContent: 'center',
  },
  botonTexto: { alignSelf: 'center', height: 44, paddingHorizontal: 12 },
  inactivo: { opacity: 0.5 },
});
