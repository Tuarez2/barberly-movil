// Restablecer contraseña (AUT-07, D-01). Sin nodo en Figma (hueco 5 de docs/pantallas.md): se arma
// con los componentes base. Con 204 no se abre sesión: vuelve a Iniciar sesión con un aviso.
// CODIGO_INVALIDO va en el campo del código; DEMASIADAS_SOLICITUDES y SIN_CONEXION, en el aviso.
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Text } from 'react-native';
import type { z } from 'zod';

import { recuperarClave, restablecerClave } from '@/api/autenticacion';
import { ErrorApi } from '@/api/cliente';
import { esquemaRestablecerClave } from '@/api/contrato';
import { Aviso } from '@/componentes/aviso';
import { Boton } from '@/componentes/boton';
import { CampoTexto } from '@/componentes/campo-texto';
import { PantallaFormulario } from '@/componentes/pantalla-formulario';
import { textos } from '@/textos';
import { erroresPorCampo, mensajeDeError } from '@/textos/errores';
import { tipografia, useTema } from '@/tema';
import { haptica } from '@/utilidades/haptica';

// El correo llega desde Recuperar contraseña; el formulario pide el código y la clave nueva.
const esquemaFormulario = esquemaRestablecerClave.omit({ correo: true });
type Entrada = z.input<typeof esquemaFormulario>;
type Salida = z.output<typeof esquemaFormulario>;
type Campo = keyof Entrada;
const CAMPOS: Campo[] = ['codigo', 'claveNueva'];

export default function RestablecerClave() {
  const { correo } = useLocalSearchParams<{ correo?: string }>();
  if (!correo) return <Redirect href="/recuperar-clave" />;
  return <Formulario correo={correo} />;
}

function Formulario({ correo }: { correo: string }) {
  const router = useRouter();
  const { colores } = useTema();
  const { control, handleSubmit, setError, resetField } = useForm<Entrada, unknown, Salida>({
    resolver: zodResolver(esquemaFormulario),
    defaultValues: { codigo: '', claveNueva: '' },
  });

  // Pedir otro código invalida el anterior (D-01); la respuesta es la misma exista o no el correo.
  const otroCodigo = useMutation({
    mutationFn: () => recuperarClave({ correo }),
    onMutate: (): void => restablecer.reset(),
    onSuccess: () => {
      haptica.exito();
      resetField('codigo');
    },
    onError: () => haptica.error(),
  });

  const restablecer = useMutation({
    mutationFn: (datos: Salida) => restablecerClave({ ...datos, correo }),
    // Un error anterior de «Pedir otro código» no debe tapar el de este envío.
    onMutate: (): void => otroCodigo.reset(),
    onSuccess: () => {
      haptica.exito();
      router.replace({ pathname: '/iniciar-sesion', params: { correo, aviso: 'clave-cambiada' } });
    },
    onError: (error) => {
      haptica.error();
      if (error instanceof ErrorApi && error.codigo === 'CODIGO_INVALIDO') {
        setError('codigo', { message: mensajeDeError(error) });
      }
      for (const [campo, mensaje] of Object.entries(erroresPorCampo(error))) {
        if (CAMPOS.includes(campo as Campo)) setError(campo as Campo, { message: mensaje });
      }
    },
  });

  const codigoError = restablecer.error instanceof ErrorApi ? restablecer.error.codigo : null;
  const marcaCampos = Object.keys(erroresPorCampo(restablecer.error)).some((campo) =>
    CAMPOS.includes(campo as Campo),
  );
  const enCampo =
    codigoError === 'CODIGO_INVALIDO' || (codigoError === 'DATOS_INVALIDOS' && marcaCampos);
  const errorGeneral = otroCodigo.isError
    ? mensajeDeError(otroCodigo.error)
    : restablecer.isError && !enCampo
      ? mensajeDeError(restablecer.error)
      : null;
  const enviar = handleSubmit((datos) => restablecer.mutate(datos));

  return (
    <PantallaFormulario
      titulo={textos.restablecerClave.titulo}
      subtitulo={textos.restablecerClave.subtitulo(correo)}
    >
      {errorGeneral ? (
        <Aviso mensaje={errorGeneral} testID="aviso-restablecer-clave" />
      ) : (
        <Aviso
          tipo="informacion"
          mensaje={textos.restablecerClave.codigoEnviado}
          testID="aviso-codigo-enviado"
        />
      )}
      <Controller
        control={control}
        name="codigo"
        render={({ field, fieldState }) => (
          <CampoTexto
            etiqueta={textos.restablecerClave.codigo}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={6}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            accessibilityHint={fieldState.error?.message ?? textos.restablecerClave.ayudaCodigo}
            testID="campo-codigo"
          />
        )}
      />
      <Text style={[tipografia.textoChico, { color: colores.colorTextoSecundario }]}>
        {textos.restablecerClave.ayudaCodigo}
      </Text>
      <Controller
        control={control}
        name="claveNueva"
        render={({ field, fieldState }) => (
          <CampoTexto
            etiqueta={textos.restablecerClave.claveNueva}
            esClave
            autoComplete="new-password"
            textContentType="newPassword"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            onSubmitEditing={() => enviar()}
            error={fieldState.error?.message}
            accessibilityHint={fieldState.error?.message ?? textos.restablecerClave.ayudaClave}
            testID="campo-clave-nueva"
          />
        )}
      />
      <Text style={[tipografia.textoChico, { color: colores.colorTextoSecundario }]}>
        {textos.restablecerClave.ayudaClave}
      </Text>
      <Boton
        etiqueta={textos.restablecerClave.guardar}
        cargando={restablecer.isPending}
        deshabilitado={otroCodigo.isPending}
        alPresionar={enviar}
        testID="boton-restablecer-clave"
      />
      <Boton
        etiqueta={textos.restablecerClave.pedirOtro}
        tipo="texto"
        cargando={otroCodigo.isPending}
        deshabilitado={restablecer.isPending}
        alPresionar={() => otroCodigo.mutate()}
        testID="boton-pedir-otro-codigo"
      />
    </PantallaFormulario>
  );
}
