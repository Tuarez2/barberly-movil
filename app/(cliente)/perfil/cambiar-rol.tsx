// Cambiar de barbería o rol (nodo 22:1886, AUT-09, D-10). Se reutiliza en (barbero)/perfil (§10.5).
// La API no guarda la barbería activa: la elección se recuerda en el teléfono (expo-secure-store).
// El propietario no se elige aquí (no tiene pantallas en la app): ve el aviso del panel web.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import type { PerfilUsuario } from '@/api/contrato';
import { Aviso } from '@/componentes/aviso';
import { PantallaCarga } from '@/componentes/pantalla-carga';
import { PantallaFormulario } from '@/componentes/pantalla-formulario';
import { ELECCION_CLIENTE, membresiasElegibles, resolverActiva } from '@/sesion/barberia-activa';
import { CLAVE_PERFIL, useSesion } from '@/sesion/proveedor-sesion';
import { esPropietario, rutaInicial } from '@/sesion/rol';
import { textos } from '@/textos';
import { mensajeDeError } from '@/textos/errores';
import { espacios, movimiento, radios, tipografia, useTema } from '@/tema';
import { haptica } from '@/utilidades/haptica';

interface Opcion {
  clave: string;
  membresiaId: string | null; // null = rol cliente
  titulo: string;
  detalle: string;
}

const ALTURA_OPCION = 64;

export default function CambiarRol() {
  const { perfil, activa, elegirActiva } = useSesion();
  const clienteConsultas = useQueryClient();
  const router = useRouter();
  const { colores } = useTema();
  const reducir = useReducedMotion();

  // AUT-09: se vuelve a pedir GET /usuarios/yo para listar solo las membresías vigentes.
  useEffect(() => {
    void clienteConsultas.invalidateQueries({ queryKey: CLAVE_PERFIL });
  }, [clienteConsultas]);

  const eleccion = useMutation({
    mutationFn: elegirActiva,
    onSuccess: (_resultado, membresiaId) => {
      haptica.exito();
      // Con el GET /usuarios/yo recién pedido: si la elegida ya no está, va al respaldo (AUT-09).
      const reciente = clienteConsultas.getQueryData<PerfilUsuario>(CLAVE_PERFIL) ?? perfil;
      if (!reciente) return;
      router.replace(rutaInicial(resolverActiva(reciente, membresiaId ?? ELECCION_CLIENTE)));
    },
    onError: () => haptica.error(),
  });

  if (!perfil || activa === undefined) return <PantallaCarga />;

  const opciones: Opcion[] = [
    ...membresiasElegibles(perfil).map((membresia) => ({
      clave: membresia.id,
      membresiaId: membresia.id,
      titulo: membresia.barberia.nombre,
      detalle: textos.cambiarRol.comoBarbero,
    })),
    {
      clave: 'cliente',
      membresiaId: null,
      titulo: textos.cambiarRol.cliente,
      detalle: textos.cambiarRol.clienteDescripcion,
    },
  ];
  const idActiva = activa?.id ?? null;

  return (
    <PantallaFormulario titulo={textos.cambiarRol.titulo} subtitulo={textos.cambiarRol.subtitulo}>
      {esPropietario(perfil) ? (
        <Aviso tipo="informacion" mensaje={textos.avisoPanel} testID="aviso-panel" />
      ) : null}
      {eleccion.isError ? (
        <Aviso mensaje={mensajeDeError(eleccion.error)} testID="aviso-cambiar-rol" />
      ) : null}
      <View accessibilityRole="radiogroup" style={estilos.lista}>
        {opciones.map((opcion) => {
          const elegida = opcion.membresiaId === idActiva;
          return (
            <Pressable
              key={opcion.clave}
              accessibilityRole="radio"
              accessibilityLabel={textos.cambiarRol.etiquetaOpcion(opcion.titulo, opcion.detalle)}
              accessibilityState={{ checked: elegida, disabled: eleccion.isPending }}
              disabled={eleccion.isPending}
              onPressIn={() => haptica.toque()}
              onPress={() => eleccion.mutate(opcion.membresiaId)}
              testID={`opcion-rol-${opcion.clave}`}
              style={({ pressed }) => [
                estilos.opcion,
                {
                  backgroundColor: colores.colorSuperficie,
                  borderColor: elegida ? colores.colorPrimario : colores.colorBorde,
                  transform: [{ scale: pressed && !reducir ? movimiento.escalaPresionado : 1 }],
                },
              ]}
            >
              <View style={estilos.textosOpcion}>
                <Text style={[tipografia.cuerpoFuerte, { color: colores.colorTinta }]}>
                  {opcion.titulo}
                </Text>
                <Text style={[tipografia.textoChico, { color: colores.colorTextoSecundario }]}>
                  {opcion.detalle}
                </Text>
              </View>
              {elegida ? (
                <Text style={[tipografia.etiqueta, { color: colores.colorTextoPrimario }]}>
                  {textos.cambiarRol.activa}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </PantallaFormulario>
  );
}

const estilos = StyleSheet.create({
  lista: { gap: espacios.espacio3 },
  opcion: {
    alignItems: 'center',
    borderRadius: radios.radioTarjeta,
    borderWidth: 1,
    flexDirection: 'row',
    gap: espacios.espacio3,
    minHeight: ALTURA_OPCION,
    paddingHorizontal: espacios.espacio4,
    paddingVertical: espacios.espacio3,
  },
  textosOpcion: { flex: 1, gap: espacios.espacio1 },
});
