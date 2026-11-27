// HU-AUT-01 (AUT-01, D-14). Estado con errores: nodo 13:671.
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import type { z } from 'zod';

import { registrar } from '@/api/autenticacion';
import { ErrorApi } from '@/api/cliente';
import { esquemaRegistro } from '@/api/contrato';
import { Aviso } from '@/componentes/aviso';
import { Boton } from '@/componentes/boton';
import { CampoTexto } from '@/componentes/campo-texto';
import { PantallaFormulario } from '@/componentes/pantalla-formulario';
import { nombreDispositivo, useSesion } from '@/sesion/proveedor-sesion';
import { textos } from '@/textos';
import { erroresPorCampo, mensajeDeError } from '@/textos/errores';
import { haptica } from '@/utilidades/haptica';

const esquemaFormulario = esquemaRegistro.omit({ dispositivo: true });
type Entrada = z.input<typeof esquemaFormulario>;
type Salida = z.output<typeof esquemaFormulario>;
type Campo = keyof Entrada;
const CAMPOS: Campo[] = ['nombre', 'correo', 'telefono', 'clave'];

export default function Registro() {
  const router = useRouter();
  const { entrar } = useSesion();
  const { control, handleSubmit, setError } = useForm<Entrada, unknown, Salida>({
    resolver: zodResolver(esquemaFormulario),
    defaultValues: { nombre: '', correo: '', telefono: '', clave: '' },
  });

  const mutacion = useMutation({
    mutationFn: (datos: Salida) => registrar({ ...datos, dispositivo: nombreDispositivo }),
    onSuccess: async (sesion) => {
      haptica.exito();
      await entrar(sesion);
      router.replace('/');
    },
    onError: (error) => {
      haptica.error();
      if (error instanceof ErrorApi && error.codigo === 'CORREO_REGISTRADO') {
        setError('correo', { message: mensajeDeError(error) });
      }
      for (const [campo, mensaje] of Object.entries(erroresPorCampo(error))) {
        if (CAMPOS.includes(campo as Campo)) setError(campo as Campo, { message: mensaje });
      }
    },
  });

  const codigo = mutacion.error instanceof ErrorApi ? mutacion.error.codigo : null;
  const errorGeneral =
    mutacion.isError && codigo !== 'CORREO_REGISTRADO' ? mensajeDeError(mutacion.error) : null;
  const enviar = handleSubmit((datos) => mutacion.mutate(datos));

  return (
    <PantallaFormulario titulo={textos.registro.titulo} subtitulo={textos.registro.subtitulo}>
      {errorGeneral ? <Aviso mensaje={errorGeneral} testID="aviso-registro" /> : null}
      <Controller
        control={control}
        name="nombre"
        render={({ field, fieldState }) => (
          <CampoTexto
            etiqueta={textos.registro.nombre}
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
        name="correo"
        render={({ field, fieldState }) => (
          <CampoTexto
            etiqueta={textos.registro.correo}
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
        name="telefono"
        render={({ field, fieldState }) => (
          <CampoTexto
            etiqueta={textos.registro.telefono}
            autoComplete="tel"
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            placeholder="0991234567"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            testID="campo-telefono"
          />
        )}
      />
      <Controller
        control={control}
        name="clave"
        render={({ field, fieldState }) => (
          <CampoTexto
            etiqueta={textos.registro.clave}
            esClave
            autoComplete="new-password"
            textContentType="newPassword"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            onSubmitEditing={() => enviar()}
            error={fieldState.error?.message}
            placeholder={textos.registro.ayudaClave}
            testID="campo-clave"
          />
        )}
      />
      <Boton
        etiqueta={textos.registro.crear}
        cargando={mutacion.isPending}
        alPresionar={enviar}
        testID="boton-registro"
      />
      <Boton
        etiqueta={textos.registro.conCuenta}
        tipo="texto"
        alPresionar={() => router.replace('/iniciar-sesion')}
      />
    </PantallaFormulario>
  );
}
