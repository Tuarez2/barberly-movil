// Entrada según la sesión y la barbería o rol activo (AUT-08, AUT-09, HU-AUT-02, D-10).
import { Redirect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Boton } from '@/componentes/boton';
import { PantallaCarga } from '@/componentes/pantalla-carga';
import { useSesion } from '@/sesion/proveedor-sesion';
import { rutaInicial } from '@/sesion/rol';
import { textos } from '@/textos';
import { mensajeDeError } from '@/textos/errores';
import { espacios, tipografia, useTema } from '@/tema';

export default function Inicio() {
  const { estado, activa, errorPerfil, reintentar, salir } = useSesion();
  const { colores } = useTema();

  if (estado === 'sin-sesion') return <Redirect href="/bienvenida" />;
  if (estado === 'con-sesion' && activa !== undefined) {
    return <Redirect href={rutaInicial(activa)} />;
  }

  const sinConexion = estado === 'sin-conexion';
  if (!sinConexion && !errorPerfil) return <PantallaCarga />;

  return (
    <View style={[estilos.contenedor, { backgroundColor: colores.colorFondo }]}>
      <Text accessibilityRole="header" style={[tipografia.titulo, { color: colores.colorTinta }]}>
        {textos.sinConexion.titulo}
      </Text>
      <Text style={[tipografia.cuerpo, { color: colores.colorTextoSecundario }]}>
        {sinConexion ? textos.sinConexion.mensaje : mensajeDeError(errorPerfil)}
      </Text>
      <Boton etiqueta={textos.sinConexion.reintentar} alPresionar={reintentar} />
      {sinConexion ? null : (
        <Boton
          etiqueta={textos.perfil.cerrarSesion}
          tipo="texto"
          alPresionar={() => void salir()}
        />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    gap: espacios.espacio4,
    justifyContent: 'center',
    padding: espacios.espacio5,
  },
});
