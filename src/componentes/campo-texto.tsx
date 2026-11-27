import { type ComponentRef, type Ref, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, useReducedMotion } from 'react-native-reanimated';

import { espacios, movimiento, radios, tipografia, useTema } from '@/tema';

interface PropiedadesCampo extends Omit<TextInputProps, 'style'> {
  ref?: Ref<ComponentRef<typeof TextInput>>;
  etiqueta: string;
  error?: string;
  esClave?: boolean;
}

export function CampoTexto({
  ref,
  etiqueta,
  error,
  esClave = false,
  ...entrada
}: PropiedadesCampo) {
  const { colores } = useTema();
  const reducir = useReducedMotion();
  const [enfocado, setEnfocado] = useState(false);
  const [claveVisible, setClaveVisible] = useState(false);

  const colorBorde = error
    ? colores.colorError
    : enfocado
      ? colores.colorTinta
      : colores.colorBorde;

  return (
    <View style={estilos.contenedor}>
      <Text style={[tipografia.etiqueta, { color: colores.colorTextoSecundario }]}>{etiqueta}</Text>
      <View
        style={[
          estilos.caja,
          { backgroundColor: colores.colorSuperficie, borderColor: colorBorde },
        ]}
      >
        <TextInput
          ref={ref}
          accessibilityLabel={etiqueta}
          accessibilityHint={error}
          placeholderTextColor={colores.colorTextoSecundario}
          secureTextEntry={esClave && !claveVisible}
          style={[tipografia.cuerpo, estilos.entrada, { color: colores.colorTinta }]}
          {...entrada}
          onFocus={(evento) => {
            setEnfocado(true);
            entrada.onFocus?.(evento);
          }}
          onBlur={(evento) => {
            setEnfocado(false);
            entrada.onBlur?.(evento);
          }}
        />
        {esClave ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={claveVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            hitSlop={8}
            onPress={() => setClaveVisible((visible) => !visible)}
            style={estilos.mostrar}
          >
            <Text style={[tipografia.textoChico, { color: colores.colorTextoPrimario }]}>
              {claveVisible ? 'Ocultar' : 'Mostrar'}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Animated.Text
          accessibilityLiveRegion="polite"
          entering={reducir ? undefined : FadeInDown.duration(movimiento.duracionRapida)}
          exiting={reducir ? undefined : FadeOut.duration(movimiento.duracionRapida)}
          style={[tipografia.textoChico, { color: colores.colorError }]}
        >
          {error}
        </Animated.Text>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: espacios.espacio2 },
  caja: {
    alignItems: 'center',
    borderRadius: radios.radioBoton,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 48,
    paddingHorizontal: espacios.espacio4,
  },
  entrada: { flex: 1, paddingVertical: espacios.espacio3 },
  mostrar: { justifyContent: 'center', minHeight: 44, paddingLeft: espacios.espacio3 },
});
