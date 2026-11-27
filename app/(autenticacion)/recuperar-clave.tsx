// Recuperar contraseña (AUT-07, D-01). Sin nodo en Figma (hueco 5 de docs/pantallas.md): se arma
// con los componentes base. La API responde 202 exista o no el correo, así que siempre se pasa a
// Restablecer contraseña con el mensaje neutro; nunca se revela si la cuenta existe.
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import type { z } from 'zod';

import { recuperarClave } from '@/api/autenticacion';
import { esquemaRecuperarClave } from '@/api/contrato';
import { Aviso } from '@/componentes/aviso';
import { Boton } from '@/componentes/boton';
import { CampoTexto } from '@/componentes/campo-texto';
import { PantallaFormulario } from '@/componentes/pantalla-formulario';
import { textos } from '@/textos';
import { erroresPorCampo, mensajeDeError } from '@/textos/errores';
import { haptica } from '@/utilidades/haptica';

type Entrada = z.input<typeof esquemaRecuperarClave>;
type Salida = z.output<typeof esquemaRecuperarClave>;

export default function RecuperarClave() {
  const router = useRouter();
  const parametros = useLocalSearchParams<{ correo?: string }>();
  const { control, handleSubmit, setError } = useForm<Entrada, unknown, Salida>({
    resolver: zodResolver(esquemaRecuperarClave),
    defaultValues: { correo: parametros.correo ?? '' },
  });

  const mutacion = useMutation({
    mutationFn: recuperarClave,
    onSuccess: (_datos, { correo }) => {
      haptica.exito();
      router.push({ pathname: '/restablecer-clave', params: { correo } });
    },
    onError: (error) => {
      haptica.error();
      const mensaje = erroresPorCampo(error).correo;
      if (mensaje) setError('correo', { message: mensaje });
    },
  });

  // DATOS_INVALIDOS del correo va en su campo; DEMASIADAS_SOLICITUDES, SIN_CONEXION y otros, en el aviso.
  const enCampo = Boolean(erroresPorCampo(mutacion.error).correo);
  const errorGeneral = mutacion.isError && !enCampo ? mensajeDeError(mutacion.error) : null;
  const enviar = handleSubmit((datos) => mutacion.mutate(datos));

  return (
    <PantallaFormulario
      titulo={textos.recuperarClave.titulo}
      subtitulo={textos.recuperarClave.subtitulo}
    >
      {errorGeneral ? <Aviso mensaje={errorGeneral} testID="aviso-recuperar-clave" /> : null}
      <Controller
        control={control}
        name="correo"
        render={({ field, fieldState }) => (
          <CampoTexto
            etiqueta={textos.recuperarClave.correo}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            onSubmitEditing={() => enviar()}
            error={fieldState.error?.message}
            testID="campo-correo"
          />
        )}
      />
      <Boton
        etiqueta={textos.recuperarClave.enviar}
        cargando={mutacion.isPending}
        alPresionar={enviar}
        testID="boton-enviar-codigo"
      />
    </PantallaFormulario>
  );
}
