// Estado de la sesion de la app (AUT-02 a AUT-04, AUT-08, HU-AUT-02).
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Device from 'expo-device';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { almacenSesion } from '@/api/almacen-sesion';
import { cerrarSesion, consultarPerfil } from '@/api/autenticacion';
import { ErrorApi, escucharSesionInvalida, renovarSesion } from '@/api/cliente';
import type { DatosSesion, PerfilUsuario } from '@/api/contrato';

export type EstadoSesion = 'cargando' | 'sin-conexion' | 'sin-sesion' | 'con-sesion';

interface Sesion {
  estado: EstadoSesion;
  perfil: PerfilUsuario | undefined;
  errorPerfil: unknown;
  entrar: (datos: DatosSesion) => Promise<void>;
  salir: () => Promise<void>;
  reintentar: () => void;
}

export const CLAVE_PERFIL = ['perfil'] as const;

// D-04: texto informativo que identifica la sesion en el servidor.
export const nombreDispositivo = (Device.modelName ?? 'Teléfono').slice(0, 100);

const ContextoSesion = createContext<Sesion | null>(null);

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const clienteConsultas = useQueryClient();
  const [estado, setEstado] = useState<EstadoSesion>('cargando');
  const [intento, setIntento] = useState(0);

  // HU-AUT-02: con una sesion vigente, al reabrir la app sigue dentro.
  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const hayToken = Boolean(await almacenSesion.tokenRenovacion());
        const renovada = hayToken && (await renovarSesion());
        if (activo) setEstado(renovada ? 'con-sesion' : 'sin-sesion');
      } catch (error) {
        const sinConexion = error instanceof ErrorApi && error.codigo === 'SIN_CONEXION';
        if (activo) setEstado(sinConexion ? 'sin-conexion' : 'sin-sesion');
      }
    })();
    return () => {
      activo = false;
    };
  }, [intento]);

  // D-02: si la renovacion falla en cualquier momento, se vuelve a pedir el inicio de sesion.
  useEffect(() => {
    escucharSesionInvalida(() => {
      clienteConsultas.clear();
      setEstado('sin-sesion');
    });
    return () => escucharSesionInvalida(undefined);
  }, [clienteConsultas]);

  const consultaPerfil = useQuery({
    queryKey: CLAVE_PERFIL,
    queryFn: consultarPerfil,
    enabled: estado === 'con-sesion',
  });

  const entrar = useCallback(
    async (datos: DatosSesion) => {
      await almacenSesion.guardar(datos);
      await clienteConsultas.invalidateQueries({ queryKey: CLAVE_PERFIL });
      setEstado('con-sesion');
    },
    [clienteConsultas],
  );

  // AUT-03: revoca esta sesion en el servidor; si no hay conexion, igual se borra en el telefono.
  const salir = useCallback(async () => {
    const tokenRenovacion = await almacenSesion.tokenRenovacion();
    if (tokenRenovacion) await cerrarSesion(tokenRenovacion).catch(() => undefined);
    await almacenSesion.limpiar();
    clienteConsultas.clear();
    setEstado('sin-sesion');
  }, [clienteConsultas]);

  const reintentar = useCallback(() => {
    setEstado('cargando');
    setIntento((valor) => valor + 1);
  }, []);

  const valor = useMemo<Sesion>(
    () => ({
      estado,
      perfil: consultaPerfil.data,
      errorPerfil: consultaPerfil.error,
      entrar,
      salir,
      reintentar,
    }),
    [estado, consultaPerfil.data, consultaPerfil.error, entrar, salir, reintentar],
  );

  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>;
}

export function useSesion(): Sesion {
  const sesion = useContext(ContextoSesion);
  if (!sesion) throw new Error('useSesion va dentro de ProveedorSesion');
  return sesion;
}
