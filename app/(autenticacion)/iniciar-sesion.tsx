// HU-AUT-02 (AUT-02, D-16). Estados: credenciales inválidas (13:581) y demasiados intentos (13:609).
// Tras restablecer la contraseña (AUT-07, D-01) llega con el correo y el aviso de clave cambiada.
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import type { z } from 'zod';

import { iniciarSesion } from '@/api/autenticacion';
import { esquemaInicioSesion } from '@/api/contrato';
import { Aviso } from '@/componentes/aviso';
import { Boton } from '@/componentes/boton';
import { CampoTexto } from '@/componentes/campo-texto';
import { PantallaFormulario } from '@/componentes/pantalla-formulario';
import { nombreDispositivo, useSesion } from '@/sesion/proveedor-sesion';
import { textos } from '@/textos';
import { erroresPorCampo, mensajeDeError } from '@/textos/errores';
import { haptica } from '@/utilidades/haptica';

const esquemaFormulario = esquemaInicioSesion.omit({ dispositivo: true });
type Formulario = z.input<typeof esquemaFormulario>;

export default function IniciarSesion() {
  const router = useRouter();
  const parametros = useLocalSearchParams<{ correo?: string; aviso?: string }>();
  const { entrar } = useSesion();
  const { control, handleSubmit, setError, getValues } = useForm<
    Formulario,
    unknown,
    z.output<typeof esquemaFormulario>
  >({
    resolver: zodResolver(esquemaFormulario),
    defaultValues: { correo: parametros.correo ?? '', clave: '' },
  });

  const mutacion = useMutation({
    mutationFn: (datos: z.output<typeof esquemaFormulario>) =>
      iniciarSesion({ ...datos, dispositivo: nombreDispositivo }),
    onSuccess: async (sesion) => {
      haptica.exito();
      await entrar(sesion);
      router.replace('/');
    },
    onError: (error) => {
      haptica.error();
      for (const [campo, mensaje] of Object.entries(erroresPorCampo(error))) {
        if (campo === 'correo' || campo === 'clave') setError(campo, { message: mensaje });
      }
    },
  });

  const errorGeneral = mutacion.isError ? mensajeDeError(mutacion.error) : null;

  return (
    <PantallaFormulario
      titulo={textos.inicioSesion.titulo}
      subtitulo={textos.inicioSesion.subtitulo}
    >
      {errorGeneral ? <Aviso mensaje={errorGeneral} testID="aviso-inicio-sesion" /> : null}
      {!errorGeneral && parametros.aviso === 'clave-cambiada' ? (
        <Aviso
          tipo="informacion"
          mensaje={textos.inicioSesion.claveCambiada}
          testID="aviso-clave-cambiada"
        />
      ) : null}
      <Controller
        control={control}
        name="correo"
        render={({ field, fieldState }) => (
          <CampoTexto
            etiqueta={textos.inicioSesion.correo}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            testID="campo-correo"
          />
        )}
      />
      <Controller
        control={control}
        name="clave"
        render={({ field, fieldState }) => (
          <CampoTexto
            etiqueta={textos.inicioSesion.clave}
            esClave
            autoComplete="current-password"
            textContentType="password"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            onSubmitEditing={() => handleSubmit((datos) => mutacion.mutate(datos))()}
            error={fieldState.error?.message}
            testID="campo-clave"
          />
        )}
      />
      <Boton
        etiqueta={textos.inicioSesion.entrar}
        cargando={mutacion.isPending}
        alPresionar={handleSubmit((datos) => mutacion.mutate(datos))}
        testID="boton-iniciar-sesion"
      />
      <Boton
        etiqueta={textos.inicioSesion.olvideClave}
        tipo="texto"
        alPresionar={() =>
          router.push({ pathname: '/recuperar-clave', params: { correo: getValues('correo') } })
        }
        testID="boton-olvide-clave"
      />
      <Boton
        etiqueta={textos.inicioSesion.sinCuenta}
        tipo="texto"
        alPresionar={() => router.replace('/registro')}
      />
    </PantallaFormulario>
  );
}
