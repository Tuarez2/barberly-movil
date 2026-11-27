// Editar perfil (nodo 11:667, AUT-05): nombre y teléfono; el correo no cambia en el MVP.
// Se reutiliza en (barbero)/perfil/editar (§10.5).
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Text } from 'react-native';
import type { z } from 'zod';

import { ErrorApi } from '@/api/cliente';
import { esquemaEdicionPerfil } from '@/api/contrato';
import { editarPerfil } from '@/api/usuarios';
import { Aviso } from '@/componentes/aviso';
import { Boton } from '@/componentes/boton';
import { CampoTexto } from '@/componentes/campo-texto';
import { PantallaCarga } from '@/componentes/pantalla-carga';
import { PantallaFormulario } from '@/componentes/pantalla-formulario';
import { CLAVE_PERFIL, useSesion } from '@/sesion/proveedor-sesion';
import { textos } from '@/textos';
import { erroresPorCampo, mensajeDeError } from '@/textos/errores';
import { tipografia, useTema } from '@/tema';
import { haptica } from '@/utilidades/haptica';

type Entrada = z.input<typeof esquemaEdicionPerfil>;
type Salida = z.output<typeof esquemaEdicionPerfil>;
type Campo = 'nombre' | 'telefono';
const CAMPOS: Campo[] = ['nombre', 'telefono'];

export default function EditarPerfil() {
  const { perfil } = useSesion();
  if (!perfil) return <PantallaCarga />;
  return <Formulario nombre={perfil.nombre} telefono={perfil.telefono} correo={perfil.correo} />;
}

function Formulario({
  nombre,
  telefono,
  correo,
}: {
  nombre: string;
  telefono: string;
  correo: string;
}) {
  const router = useRouter();
  const { colores } = useTema();
  const clienteConsultas = useQueryClient();
  const { control, handleSubmit, setError } = useForm<Entrada, unknown, Salida>({
    resolver: zodResolver(esquemaEdicionPerfil),
    defaultValues: { nombre, telefono },
  });

  const mutacion = useMutation({
    mutationFn: editarPerfil,
    onSuccess: async () => {
      haptica.exito();
      await clienteConsultas.invalidateQueries({ queryKey: CLAVE_PERFIL });
      router.back();
    },
    onError: (error) => {
      haptica.error();
      for (const [campo, mensaje] of Object.entries(erroresPorCampo(error))) {
        if (CAMPOS.includes(campo as Campo)) setError(campo as Campo, { message: mensaje });
      }
    },
  });

  // DATOS_INVALIDOS se marca en sus campos; si no marca ninguno de esta pantalla, o es otro error
  // (sin conexión, sesión...), va en el aviso.
  const porCampo =
    mutacion.error instanceof ErrorApi &&
    mutacion.error.codigo === 'DATOS_INVALIDOS' &&
    Object.keys(erroresPorCampo(mutacion.error)).some((campo) => CAMPOS.includes(campo as Campo));
  const errorGeneral = mutacion.isError && !porCampo ? mensajeDeError(mutacion.error) : null;
  const enviar = handleSubmit((datos) => mutacion.mutate(datos));

  return (
    <PantallaFormulario
      titulo={textos.editarPerfil.titulo}
      subtitulo={textos.editarPerfil.subtitulo}
    >
      {errorGeneral ? <Aviso mensaje={errorGeneral} testID="aviso-editar-perfil" /> : null}
      <Controller
        control={control}
        name="nombre"
        render={({ field, fieldState }) => (
          <CampoTexto
            etiqueta={textos.editarPerfil.nombre}
            autoComplete="name"
            textContentType="name"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            testID="campo-nombre"
          />
        )}
      />
      <Controller
        control={control}
        name="telefono"
        render={({ field, fieldState }) => (
          <CampoTexto
            etiqueta={textos.editarPerfil.telefono}
            autoComplete="tel"
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            onSubmitEditing={() => enviar()}
            error={fieldState.error?.message}
            testID="campo-telefono"
          />
        )}
      />
      <CampoTexto
        etiqueta={textos.editarPerfil.correo}
        value={correo}
        editable={false}
        accessibilityHint={textos.editarPerfil.correoFijo}
        testID="campo-correo"
      />
      <Text style={[tipografia.textoChico, { color: colores.colorTextoSecundario }]}>
        {textos.editarPerfil.correoFijo}
      </Text>
      <Boton
        etiqueta={textos.editarPerfil.guardar}
        cargando={mutacion.isPending}
        alPresionar={enviar}
        testID="boton-guardar-perfil"
      />
    </PantallaFormulario>
  );
}
