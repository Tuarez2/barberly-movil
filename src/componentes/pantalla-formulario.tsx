import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { textos } from '@/textos';
import { espacios, tipografia, useTema } from '@/tema';

import { Boton } from './boton';
import { CorteDiagonal } from './corte-diagonal';
import { Entrada } from './entrada';

interface PropiedadesPantallaFormulario {
  titulo: string;
  subtitulo: string;
  children: ReactNode;
}

// Estructura comun de Registro e Inicio de sesion: volver, titulo con el corte y formulario.
export function PantallaFormulario({ titulo, subtitulo, children }: PropiedadesPantallaFormulario) {
  const router = useRouter();
  const { colores } = useTema();
  const margenes = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[estilos.raiz, { backgroundColor: colores.colorFondo }]}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          estilos.contenido,
          {
            paddingTop: margenes.top + espacios.espacio3,
            paddingBottom: margenes.bottom + espacios.espacio6,
          },
        ]}
      >
        <View style={estilos.volver}>
          <Boton etiqueta={textos.volver} tipo="texto" alPresionar={() => router.back()} />
        </View>
        <Entrada indice={0}>
          <Text
            accessibilityRole="header"
            style={[tipografia.tituloGrande, { color: colores.colorTinta }]}
          >
            {titulo}
          </Text>
        </Entrada>
        <CorteDiagonal ancho={72} retraso={120} />
        <Entrada indice={2}>
          <Text style={[tipografia.cuerpo, { color: colores.colorTextoSecundario }]}>
            {subtitulo}
          </Text>
        </Entrada>
        <Entrada indice={3}>
          <View style={estilos.formulario}>{children}</View>
        </Entrada>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: { gap: espacios.espacio3, paddingHorizontal: espacios.espacio4 },
  volver: { alignItems: 'flex-start', marginLeft: -espacios.espacio3 },
  formulario: { gap: espacios.espacio4, marginTop: espacios.espacio4 },
});
