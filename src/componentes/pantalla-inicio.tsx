import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { PerfilUsuario } from '@/api/contrato';
import { esPropietario, primerNombre } from '@/sesion/rol';
import { textos } from '@/textos';
import { espacios, radios, tipografia, useTema } from '@/tema';

import { Aviso } from './aviso';
import { Boton } from './boton';
import { CorteDiagonal } from './corte-diagonal';
import { Entrada } from './entrada';

interface TextosInicio {
  saludo: (nombre: string) => string;
  subtitulo: string;
  pronto: string;
  perfil: string;
}

interface PropiedadesPantallaInicio {
  perfil: PerfilUsuario;
  textosInicio: TextosInicio;
}

// Inicio de cada rol mientras llegan Explorar (etapa 2) y la Agenda (etapa 4).
export function PantallaInicio({ perfil, textosInicio }: PropiedadesPantallaInicio) {
  const router = useRouter();
  const { colores } = useTema();
  const margenes = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ backgroundColor: colores.colorFondo }}
      contentContainerStyle={[
        estilos.contenido,
        {
          paddingTop: margenes.top + espacios.espacio6,
          paddingBottom: margenes.bottom + espacios.espacio6,
        },
      ]}
    >
      <Entrada indice={0}>
        <Text
          accessibilityRole="header"
          style={[tipografia.tituloGrande, { color: colores.colorTinta }]}
        >
          {textosInicio.saludo(primerNombre(perfil))}
        </Text>
      </Entrada>
      <CorteDiagonal ancho={88} retraso={120} />
      <Entrada indice={2}>
        <Text style={[tipografia.cuerpo, { color: colores.colorTextoSecundario }]}>
          {textosInicio.subtitulo}
        </Text>
      </Entrada>
      {esPropietario(perfil) ? (
        <Entrada indice={3}>
          <Aviso tipo="informacion" mensaje={textos.avisoPanel} testID="aviso-panel" />
        </Entrada>
      ) : null}
      <Entrada indice={4}>
        <View
          style={[
            estilos.tarjeta,
            { backgroundColor: colores.colorSuperficie, borderColor: colores.colorBorde },
          ]}
        >
          <Text style={[tipografia.cuerpo, { color: colores.colorTinta }]}>
            {textosInicio.pronto}
          </Text>
        </View>
      </Entrada>
      <Entrada indice={5}>
        <Boton
          etiqueta={textosInicio.perfil}
          tipo="secundario"
          alPresionar={() => router.push('/perfil')}
        />
      </Entrada>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenido: { gap: espacios.espacio4, paddingHorizontal: espacios.espacio4 },
  tarjeta: { borderRadius: radios.radioTarjeta, borderWidth: 1, padding: espacios.espacio5 },
});
