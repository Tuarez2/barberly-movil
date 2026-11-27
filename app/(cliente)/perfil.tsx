// Perfil (nodo 11:579): datos, barberías y cerrar sesión (AUT-03, AUT-08). Editar llega en T1.13.
import { useMutation } from '@tanstack/react-query';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Boton } from '@/componentes/boton';
import { CorteDiagonal } from '@/componentes/corte-diagonal';
import { Entrada } from '@/componentes/entrada';
import { PantallaCarga } from '@/componentes/pantalla-carga';
import { useSesion } from '@/sesion/proveedor-sesion';
import { textos } from '@/textos';
import { espacios, radios, tipografia, useTema } from '@/tema';

export default function Perfil() {
  const { perfil, salir } = useSesion();
  const { colores } = useTema();
  const margenes = useSafeAreaInsets();
  const cierre = useMutation({ mutationFn: salir });

  if (!perfil) return <PantallaCarga />;

  const fila = (etiqueta: string, valor: string) => (
    <View style={estilos.fila}>
      <Text style={[tipografia.etiqueta, { color: colores.colorTextoSecundario }]}>{etiqueta}</Text>
      <Text style={[tipografia.cuerpo, { color: colores.colorTinta }]}>{valor}</Text>
    </View>
  );

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
          {perfil.nombre}
        </Text>
      </Entrada>
      <CorteDiagonal ancho={72} retraso={120} />
      <Entrada indice={2}>
        <View
          style={[
            estilos.tarjeta,
            { backgroundColor: colores.colorSuperficie, borderColor: colores.colorBorde },
          ]}
        >
          {fila(textos.perfil.correo, perfil.correo)}
          {fila(textos.perfil.telefono, perfil.telefono)}
        </View>
      </Entrada>
      {perfil.membresias.length > 0 ? (
        <Entrada indice={3}>
          <View
            style={[
              estilos.tarjeta,
              { backgroundColor: colores.colorSuperficie, borderColor: colores.colorBorde },
            ]}
          >
            <Text style={[tipografia.subtitulo, { color: colores.colorTinta }]}>
              {textos.perfil.barberias}
            </Text>
            {perfil.membresias.map((membresia) => (
              <View key={membresia.id} style={estilos.membresia}>
                <Text style={[tipografia.cuerpo, { color: colores.colorTinta }]}>
                  {membresia.barberia.nombre}
                </Text>
                <Text style={[tipografia.etiqueta, { color: colores.colorAcentoTexto }]}>
                  {textos.perfil.rol[membresia.rol]}
                </Text>
              </View>
            ))}
          </View>
        </Entrada>
      ) : null}
      <Entrada indice={4}>
        <Boton
          etiqueta={textos.perfil.cerrarSesion}
          tipo="secundario"
          cargando={cierre.isPending}
          alPresionar={() => cierre.mutate()}
          testID="boton-cerrar-sesion"
        />
      </Entrada>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenido: { gap: espacios.espacio4, paddingHorizontal: espacios.espacio4 },
  tarjeta: {
    borderRadius: radios.radioTarjeta,
    borderWidth: 1,
    gap: espacios.espacio4,
    padding: espacios.espacio5,
  },
  fila: { gap: espacios.espacio1 },
  membresia: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
});
