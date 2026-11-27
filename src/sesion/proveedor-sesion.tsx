// Estado de la sesion de la app (AUT-02 a AUT-04, AUT-08, AUT-09, HU-AUT-02).
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

import { ELECCION_CLIENTE, type MembresiaActiva, resolverActiva } from './barberia-activa';

export type EstadoSesion = 'cargando' | 'sin-conexion' | 'sin-sesion' | 'con-sesion';

interface Sesion {
  estado: EstadoSesion;
  perfil: PerfilUsuario | undefined;
  errorPerfil: unknown;
  // AUT-09: undefined mientras carga; null = rol cliente; si no, la membresía BARBERO elegida.
  activa: MembresiaActiva | undefined;
  elegirActiva: (membresiaId: string | null) => Promise<void>;
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
  // Elección guardada en expo-secure-store; undefined mientras se lee.
  const [guardada, setGuardada] = useState<string | null | undefined>(undefined);

  // HU-AUT-02: con una sesion vigente, al reabrir la app sigue dentro.
  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const hayToken = Boolean(await almacenSesion.tokenRenovacion());
        // AUT-09: sin sesion, una eleccion que quedo guardada no es de nadie.
        if (!hayToken) await almacenSesion.olvidarMembresiaActiva().catch(() => undefined);
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
      setGuardada(undefined);
      setEstado('sin-sesion');
    });
    return () => escucharSesionInvalida(undefined);
  }, [clienteConsultas]);

  const consultaPerfil = useQuery({
    queryKey: CLAVE_PERFIL,
    queryFn: consultarPerfil,
    enabled: estado === 'con-sesion',
  });

  // AUT-09: con la sesion abierta se lee la membresia elegida la ultima vez.
  useEffect(() => {
    if (estado !== 'con-sesion') return;
    let activo = true;
    almacenSesion
      .membresiaActiva()
      .catch(() => null)
      .then((valor) => {
        if (activo) setGuardada(valor);
      });
    return () => {
      activo = false;
    };
  }, [estado]);

  // Se recalcula con cada GET /usuarios/yo: si la guardada ya no aparece, se usa el respaldo.
  const perfil = consultaPerfil.data;
  const activa = useMemo(
    () => (perfil && guardada !== undefined ? resolverActiva(perfil, guardada) : undefined),
    [perfil, guardada],
  );

  const elegirActiva = useCallback(async (membresiaId: string | null) => {
    const eleccion = membresiaId ?? ELECCION_CLIENTE;
    await almacenSesion.guardarMembresiaActiva(eleccion);
    setGuardada(eleccion);
  }, []);

  const entrar = useCallback(
    async (datos: DatosSesion) => {
      // AUT-09: la eleccion guardada puede ser de otra cuenta; esta empieza por la automatica.
      await almacenSesion.olvidarMembresiaActiva().catch(() => undefined);
      setGuardada(undefined);
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
    setGuardada(undefined);
    setEstado('sin-sesion');
  }, [clienteConsultas]);

  const reintentar = useCallback(() => {
    setEstado('cargando');
    setIntento((valor) => valor + 1);
  }, []);

  const valor = useMemo<Sesion>(
    () => ({
      estado,
      perfil,
      errorPerfil: consultaPerfil.error,
      activa,
      elegirActiva,
      entrar,
      salir,
      reintentar,
    }),
    [estado, perfil, consultaPerfil.error, activa, elegirActiva, entrar, salir, reintentar],
  );

  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>;
}

export function useSesion(): Sesion {
  const sesion = useContext(ContextoSesion);
  if (!sesion) throw new Error('useSesion va dentro de ProveedorSesion');
  return sesion;
}
