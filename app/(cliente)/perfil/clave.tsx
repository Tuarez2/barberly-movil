// Cambiar contraseña (nodo 11:693, AUT-06, D-05). Se reutiliza en (barbero)/perfil/clave (§10.5).
// CREDENCIALES_INVALIDAS aquí es la contraseña actual incorrecta: se marca en su campo y la sesión sigue.
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { Text } from 'react-native';
import type { z } from 'zod';

import { ErrorApi } from '@/api/cliente';
import { esquemaCambioClave } from '@/api/contrato';
import { cambiarClave } from '@/api/usuarios';
import { Aviso } from '@/componentes/aviso';
import { Boton } from '@/componentes/boton';
import { CampoTexto } from '@/componentes/campo-texto';
import { PantallaFormulario } from '@/componentes/pantalla-formulario';
import { textos } from '@/textos';
import { erroresPorCampo, mensajeDeError } from '@/textos/errores';
import { tipografia, useTema } from '@/tema';
import { haptica } from '@/utilidades/haptica';

type Entrada = z.input<typeof esquemaCambioClave>;
type Salida = z.output<typeof esquemaCambioClave>;
type Campo = keyof Entrada;
const CAMPOS: Campo[] = ['claveActual', 'claveNueva'];
const VACIO: Entrada = { claveActual: '', claveNueva: '' };

export default function CambiarClave() {
  const { colores } = useTema();
  const { control, handleSubmit, setError, reset } = useForm<Entrada, unknown, Salida>({
    resolver: zodResolver(esquemaCambioClave),
    defaultValues: VACIO,
  });

  const mutacion = useMutation({
    mutationFn: cambiarClave,
    onSuccess: () => {
      haptica.exito();
      reset(VACIO);
    },
    onError: (error) => {
      haptica.error();
      if (error instanceof ErrorApi && error.codigo === 'CREDENCIALES_INVALIDAS') {
        setError('claveActual', { message: textos.cambiarClave.actualIncorrecta });
      }
      for (const [campo, mensaje] of Object.entries(erroresPorCampo(error))) {
        if (CAMPOS.includes(campo as Campo)) setError(campo as Campo, { message: mensaje });
      }
    },
  });

  // CREDENCIALES_INVALIDAS y DATOS_INVALIDOS van en su campo; si DATOS_INVALIDOS no marca ninguno
  // de esta pantalla, o es otro error, va en el aviso.
  const codigo = mutacion.error instanceof ErrorApi ? mutacion.error.codigo : null;
  const marcaCampos = Object.keys(erroresPorCampo(mutacion.error)).some((campo) =>
    CAMPOS.includes(campo as Campo),
  );
  const enCampo =
    codigo === 'CREDENCIALES_INVALIDAS' || (codigo === 'DATOS_INVALIDOS' && marcaCampos);
  const errorGeneral = mutacion.isError && !enCampo ? mensajeDeError(mutacion.error) : null;
  const enviar = handleSubmit((datos) => mutacion.mutate(datos));

  return (
    <PantallaFormulario
      titulo={textos.cambiarClave.titulo}
      subtitulo={textos.cambiarClave.subtitulo}
    >
      {errorGeneral ? <Aviso mensaje={errorGeneral} testID="aviso-cambiar-clave" /> : null}
      {mutacion.isSuccess ? (
        <Aviso
          tipo="informacion"
          mensaje={textos.cambiarClave.exito}
          testID="aviso-clave-cambiada"
        />
      ) : null}
      <Controller
        control={control}
        name="claveActual"
        render={({ field, fieldState }) => (
          <CampoTexto
            etiqueta={textos.cambiarClave.claveActual}
            esClave
            autoComplete="current-password"
            textContentType="password"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            testID="campo-clave-actual"
          />
        )}
      />
      <Controller
        control={control}
        name="claveNueva"
        render={({ field, fieldState }) => (
          <CampoTexto
            etiqueta={textos.cambiarClave.claveNueva}
            esClave
            autoComplete="new-password"
            textContentType="newPassword"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            onSubmitEditing={() => enviar()}
            error={fieldState.error?.message}
            accessibilityHint={fieldState.error?.message ?? textos.cambiarClave.ayudaClave}
            testID="campo-clave-nueva"
          />
        )}
      />
      <Text style={[tipografia.textoChico, { color: colores.colorTextoSecundario }]}>
        {textos.cambiarClave.ayudaClave}
      </Text>
      <Boton
        etiqueta={textos.cambiarClave.guardar}
        cargando={mutacion.isPending}
        alPresionar={enviar}
        testID="boton-guardar-clave"
      />
    </PantallaFormulario>
  );
}
