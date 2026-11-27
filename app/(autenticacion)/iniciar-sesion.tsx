// HU-AUT-02 (AUT-02, D-16). Estados: credenciales inválidas (13:581) y demasiados intentos (13:609).
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
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
  const { entrar } = useSesion();
  const { control, handleSubmit, setError } = useForm<
    Formulario,
    unknown,
    z.output<typeof esquemaFormulario>
  >({
    resolver: zodResolver(esquemaFormulario),
    defaultValues: { correo: '', clave: '' },
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
        etiqueta={textos.inicioSesion.sinCuenta}
        tipo="texto"
        alPresionar={() => router.replace('/registro')}
      />
    </PantallaFormulario>
  );
}
