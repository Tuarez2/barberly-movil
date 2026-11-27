// Perfil (nodos 11:579 y 16:1052): datos, barberías, editar, cambiar contraseña, cambiar de
// barbería o rol si es barbero (AUT-09) y cerrar sesión (AUT-03, AUT-05, AUT-06, AUT-08).
// El barbero reutiliza esta pantalla en (barbero)/perfil (§10.5); su foto
// (PUT y DELETE /barberias/:id/barberos/:barberoId/foto) llega con su propia tarea.
import { useMutation } from '@tanstack/react-query';
import { useRouter, useSegments } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Boton } from '@/componentes/boton';
import { CorteDiagonal } from '@/componentes/corte-diagonal';
import { Entrada } from '@/componentes/entrada';
import { PantallaCarga } from '@/componentes/pantalla-carga';
import { ofreceCambio } from '@/sesion/barberia-activa';
import { useSesion } from '@/sesion/proveedor-sesion';
import { textos } from '@/textos';
import { espacios, radios, tipografia, useTema } from '@/tema';

// Una ruta repetida entre grupos se enlaza con su grupo (docs/pantallas.md).
const RUTAS = {
  '(cliente)': {
    editar: '/(cliente)/perfil/editar',
    clave: '/(cliente)/perfil/clave',
    cambiarRol: '/(cliente)/perfil/cambiar-rol',
  },
  '(barbero)': {
    editar: '/(barbero)/perfil/editar',
    clave: '/(barbero)/perfil/clave',
    cambiarRol: '/(barbero)/perfil/cambiar-rol',
  },
} as const;

export default function Perfil() {
  const { perfil, salir } = useSesion();
  const router = useRouter();
  const segmentos: string[] = useSegments();
  const rutas = RUTAS[segmentos[0] === '(barbero)' ? '(barbero)' : '(cliente)'];
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
        <View style={estilos.acciones}>
          <Boton
            etiqueta={textos.perfil.editar}
            tipo="secundario"
            alPresionar={() => router.push(rutas.editar)}
            testID="boton-editar-perfil"
          />
          <Boton
            etiqueta={textos.perfil.cambiarClave}
            tipo="secundario"
            alPresionar={() => router.push(rutas.clave)}
            testID="boton-abrir-cambiar-clave"
          />
          {ofreceCambio(perfil) ? (
            <Boton
              etiqueta={textos.perfil.cambiarRol}
              tipo="secundario"
              alPresionar={() => router.push(rutas.cambiarRol)}
              testID="boton-abrir-cambiar-rol"
            />
          ) : null}
        </View>
      </Entrada>
      <Entrada indice={5}>
        <Boton
          etiqueta={textos.perfil.cerrarSesion}
          tipo="texto"
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
  acciones: { gap: espacios.espacio3 },
  membresia: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
});
