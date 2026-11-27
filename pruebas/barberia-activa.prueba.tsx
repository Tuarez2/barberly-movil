// T1.14: elegir la barbería o el rol activo en la app (AUT-09, AUT-08, D-10, D-18, §2.3).
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Pressable, Text } from 'react-native';

import { almacenSesion } from '@/api/almacen-sesion';
import { cerrarSesion, consultarPerfil } from '@/api/autenticacion';
import { pedir, renovarSesion } from '@/api/cliente';
import type { MembresiaUsuario, PerfilUsuario } from '@/api/contrato';
import { ELECCION_CLIENTE, ofreceCambio, resolverActiva } from '@/sesion/barberia-activa';
import { CLAVE_PERFIL, ProveedorSesion, useSesion } from '@/sesion/proveedor-sesion';

import LayoutBarbero from '../app/(barbero)/_layout';
import CambiarRolBarbero from '../app/(barbero)/perfil/cambiar-rol';
import Perfil from '../app/(cliente)/perfil';
import CambiarRol from '../app/(cliente)/perfil/cambiar-rol';
import Inicio from '../app/index';

const CLAVE_ACTIVA = 'barberly.membresiaActiva';
const mockAlmacen = new Map<string, string>();
const mockEmpujar = jest.fn();
const mockReemplazar = jest.fn();
let mockSegmentos = ['(cliente)', 'perfil'];

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(async (clave: string, valor: string) => void mockAlmacen.set(clave, valor)),
  getItemAsync: jest.fn(async (clave: string) => mockAlmacen.get(clave) ?? null),
  deleteItemAsync: jest.fn(async (clave: string) => void mockAlmacen.delete(clave)),
}));
jest.mock('@/api/cliente', () => ({
  ...jest.requireActual('@/api/cliente'),
  renovarSesion: jest.fn(async () => true),
}));
jest.mock('@/api/autenticacion', () => ({ consultarPerfil: jest.fn(), cerrarSesion: jest.fn() }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock('expo-router', () => {
  const { Text: TextoMock } = jest.requireActual('react-native');
  return {
    Redirect: ({ href }: { href: string }) => <TextoMock>{`redirige a ${href}`}</TextoMock>,
    Stack: () => <TextoMock>pila</TextoMock>,
    useRouter: () => ({ push: mockEmpujar, replace: mockReemplazar, back: jest.fn() }),
    useSegments: () => mockSegmentos,
  };
});

function membresia(id: string, rol: MembresiaUsuario['rol'], nombre: string): MembresiaUsuario {
  return {
    id,
    rol,
    barberoId: rol === 'BARBERO' ? `perfil-${id}` : null,
    barberia: { id: `barberia-${id}`, nombre },
  };
}

const CENTRO = membresia('mC', 'BARBERO', 'Barbería Centro');
const NORTE = membresia('mN', 'BARBERO', 'Barbería Norte');
const SUR = membresia('mS', 'BARBERO', 'Barbería Sur');
const PROPIA = membresia('mP', 'PROPIETARIO', 'Barbería Propia');

function perfilCon(membresias: MembresiaUsuario[]): PerfilUsuario {
  return {
    id: 'u1',
    nombre: 'Ana Pérez',
    correo: 'ana@barberly.test',
    telefono: '+593991234567',
    consentimientoIaEn: null,
    membresias,
  };
}

// Muestra la elección resuelta por el proveedor y permite cerrar sesión.
function Activa() {
  const { estado, activa, salir } = useSesion();
  return (
    <>
      <Text testID="activa">
        {activa === undefined ? `cargando (${estado})` : (activa?.barberia.id ?? 'cliente')}
      </Text>
      <Pressable testID="salir" onPress={() => void salir()} />
    </>
  );
}

// Inicia sesión (o se registra) con otra cuenta en este teléfono.
function Entrar() {
  const { entrar } = useSesion();
  const datos = {
    usuario: { id: 'u2', nombre: 'Luis', correo: 'luis@barberly.test', telefono: '+593990000000' },
    tokenAcceso: 'acceso-otra',
    tokenRenovacion: 'renovacion-otra',
  };
  return (
    <>
      <Activa />
      <Pressable testID="entrar" onPress={() => void entrar(datos)} />
    </>
  );
}

let clienteConsultas: QueryClient;
async function renderConSesion(elemento: ReactElement) {
  clienteConsultas = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  return render(
    <QueryClientProvider client={clienteConsultas}>
      <ProveedorSesion>{elemento}</ProveedorSesion>
    </QueryClientProvider>,
  );
}

async function abrirCon(membresias: MembresiaUsuario[], guardada?: string) {
  if (guardada) mockAlmacen.set(CLAVE_ACTIVA, guardada);
  jest.mocked(consultarPerfil).mockResolvedValue(perfilCon(membresias));
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAlmacen.clear();
  mockAlmacen.set('barberly.tokenRenovacion', 'renovacion');
  mockSegmentos = ['(cliente)', 'perfil'];
});

describe('T1.14: resolver la membresía activa (AUT-09)', () => {
  it('con una sola membresía BARBERO se elige sola y se ofrece cambiar a Cliente (§2.3)', () => {
    const perfil = perfilCon([CENTRO, PROPIA]);
    expect(resolverActiva(perfil, null)).toBe(CENTRO);
    expect(resolverActiva(perfil, 'otra')).toBe(CENTRO);
    expect(resolverActiva(perfil, ELECCION_CLIENTE)).toBeNull();
    expect(ofreceCambio(perfil)).toBe(true);
  });

  it('D-10: sin membresía BARBERO (cliente o solo propietario) queda el rol cliente', () => {
    expect(resolverActiva(perfilCon([]), null)).toBeNull();
    expect(resolverActiva(perfilCon([PROPIA]), PROPIA.id)).toBeNull();
    expect(ofreceCambio(perfilCon([PROPIA]))).toBe(false);
  });

  it('con varias usa la guardada, el rol cliente o, sin elección, la primera por nombre', () => {
    const perfil = perfilCon([CENTRO, NORTE]);
    expect(ofreceCambio(perfil)).toBe(true);
    expect(resolverActiva(perfil, NORTE.id)).toBe(NORTE);
    expect(resolverActiva(perfil, ELECCION_CLIENTE)).toBeNull();
    expect(resolverActiva(perfil, null)).toBe(CENTRO);
  });

  it('si la guardada ya no aparece, se usa la primera por nombre', () => {
    expect(resolverActiva(perfilCon([NORTE, SUR]), CENTRO.id)).toBe(NORTE);
  });

  it('D-18: respeta el orden de la API y no vuelve a ordenar', () => {
    expect(resolverActiva(perfilCon([SUR, CENTRO]), null)).toBe(SUR);
  });
});

describe('T1.14: sin membresía BARBERO', () => {
  it('AUT-09: el cliente (o solo propietario) queda como cliente y no ve el enlace', async () => {
    await abrirCon([PROPIA]);
    await renderConSesion(<Inicio />);
    expect(await screen.findByText('redirige a /explorar')).toBeTruthy();

    await renderConSesion(<Perfil />);
    expect(await screen.findByText('Barbería Propia')).toBeTruthy();
    expect(screen.queryByTestId('boton-abrir-cambiar-rol')).toBeNull();
  });
});

describe('T1.14: una sola membresía BARBERO', () => {
  it('AUT-09: se elige sola y entra a su día', async () => {
    await abrirCon([CENTRO, PROPIA]);
    await renderConSesion(
      <>
        <Inicio />
        <Activa />
      </>,
    );

    expect(await screen.findByText('redirige a /hoy')).toBeTruthy();
    expect(screen.getByTestId('activa').props.children).toBe(CENTRO.barberia.id);
  });

  it('§2.3: el Perfil ofrece el cambio con las opciones Cliente y su barbería', async () => {
    await abrirCon([CENTRO, PROPIA]);
    mockSegmentos = ['(barbero)', 'perfil'];
    await renderConSesion(<Perfil />);

    await fireEvent.press(await screen.findByTestId('boton-abrir-cambiar-rol'));
    expect(mockEmpujar).toHaveBeenCalledWith('/(barbero)/perfil/cambiar-rol');

    await renderConSesion(<CambiarRol />);
    expect(await screen.findByTestId('opcion-rol-mC')).toBeTruthy();
    expect(screen.getByTestId('opcion-rol-cliente')).toBeTruthy();
    expect(screen.queryByTestId('opcion-rol-mP')).toBeNull();
  });

  it('AUT-09: elegir Cliente se recuerda y /hoy redirige a Explorar', async () => {
    await abrirCon([CENTRO]);
    await renderConSesion(<CambiarRol />);

    await fireEvent.press(await screen.findByTestId('opcion-rol-cliente'));

    await waitFor(() => expect(mockReemplazar).toHaveBeenCalledWith('/explorar'));
    expect(mockAlmacen.get(CLAVE_ACTIVA)).toBe(ELECCION_CLIENTE);

    await renderConSesion(
      <>
        <Inicio />
        <LayoutBarbero />
      </>,
    );
    await waitFor(() => expect(screen.getAllByText('redirige a /explorar')).toHaveLength(2));
  });
});

describe('T1.14: varias membresías', () => {
  it('el Perfil ofrece Cambiar de barbería o rol dentro de su grupo (§10.5)', async () => {
    await abrirCon([CENTRO, NORTE]);
    mockSegmentos = ['(barbero)', 'perfil'];
    await renderConSesion(<Perfil />);

    await fireEvent.press(await screen.findByTestId('boton-abrir-cambiar-rol'));

    expect(mockEmpujar).toHaveBeenCalledWith('/(barbero)/perfil/cambiar-rol');
    expect(CambiarRolBarbero).toBe(CambiarRol);
  });

  it('AUT-09: elegir una barbería la guarda y lleva a (barbero) con su barberiaId', async () => {
    await abrirCon([CENTRO, NORTE]);
    await renderConSesion(
      <>
        <CambiarRol />
        <Activa />
      </>,
    );

    const centro = await screen.findByTestId('opcion-rol-mC');
    expect(centro.props.accessibilityState).toMatchObject({ checked: true });
    expect(screen.getByTestId('opcion-rol-mN').props.accessibilityState).toMatchObject({
      checked: false,
    });

    await fireEvent.press(screen.getByTestId('opcion-rol-mN'));

    await waitFor(() => expect(mockReemplazar).toHaveBeenCalledWith('/hoy'));
    expect(mockAlmacen.get(CLAVE_ACTIVA)).toBe(NORTE.id);
    expect(screen.getByTestId('activa').props.children).toBe(NORTE.barberia.id);
  });

  it('AUT-09: elegir el rol cliente lo guarda, lleva a (cliente) y se recuerda al reabrir', async () => {
    await abrirCon([CENTRO, NORTE]);
    await renderConSesion(<CambiarRol />);

    await fireEvent.press(await screen.findByTestId('opcion-rol-cliente'));

    await waitFor(() => expect(mockReemplazar).toHaveBeenCalledWith('/explorar'));
    expect(mockAlmacen.get(CLAVE_ACTIVA)).toBe(ELECCION_CLIENTE);

    await renderConSesion(<Inicio />);
    expect(await screen.findByText('redirige a /explorar')).toBeTruthy();
  });

  it('D-10: el propietario no se elige en la app; ve el aviso del panel web', async () => {
    await abrirCon([CENTRO, PROPIA, NORTE]);
    await renderConSesion(<CambiarRol />);

    expect(await screen.findByTestId('aviso-panel')).toBeTruthy();
    expect(screen.queryByTestId('opcion-rol-mP')).toBeNull();
    expect(screen.getByTestId('opcion-rol-mC')).toBeTruthy();
    expect(screen.getByTestId('opcion-rol-mN')).toBeTruthy();
    expect(screen.getByTestId('opcion-rol-cliente')).toBeTruthy();
  });
});

describe('T1.14: la guardada desaparece', () => {
  it('AUT-09: al volver a pedir GET /usuarios/yo sin ella, usa la primera por nombre', async () => {
    await abrirCon([CENTRO, NORTE], NORTE.id);
    await renderConSesion(<Activa />);
    await waitFor(() =>
      expect(screen.getByTestId('activa').props.children).toBe(NORTE.barberia.id),
    );

    jest.mocked(consultarPerfil).mockResolvedValue(perfilCon([CENTRO, SUR]));
    await act(() => clienteConsultas.invalidateQueries({ queryKey: CLAVE_PERFIL }));

    await waitFor(() =>
      expect(screen.getByTestId('activa').props.children).toBe(CENTRO.barberia.id),
    );
  });

  it('si ya no queda ninguna membresía BARBERO, usa el rol cliente', async () => {
    await abrirCon([CENTRO, NORTE], NORTE.id);
    await renderConSesion(<Activa />);
    await waitFor(() =>
      expect(screen.getByTestId('activa').props.children).toBe(NORTE.barberia.id),
    );

    jest.mocked(consultarPerfil).mockResolvedValue(perfilCon([PROPIA]));
    await act(() => clienteConsultas.invalidateQueries({ queryKey: CLAVE_PERFIL }));

    await waitFor(() => expect(screen.getByTestId('activa').props.children).toBe('cliente'));
  });
});

describe('T1.14: cerrar sesión', () => {
  it('AUT-03: cerrar sesión borra la elección del teléfono', async () => {
    jest.mocked(cerrarSesion).mockResolvedValue(undefined);
    await abrirCon([CENTRO, NORTE], NORTE.id);
    await renderConSesion(<Activa />);
    await waitFor(() =>
      expect(screen.getByTestId('activa').props.children).toBe(NORTE.barberia.id),
    );

    await fireEvent.press(screen.getByTestId('salir'));

    await waitFor(() =>
      expect(screen.getByTestId('activa').props.children).toBe('cargando (sin-sesion)'),
    );
    expect(cerrarSesion).toHaveBeenCalledWith('renovacion');
    expect(mockAlmacen.has(CLAVE_ACTIVA)).toBe(false);
  });

  it('limpiar() intenta cada borrado aunque otro falle', async () => {
    mockAlmacen.set(CLAVE_ACTIVA, NORTE.id);
    jest.mocked(SecureStore.deleteItemAsync).mockRejectedValueOnce(new Error('llavero'));
    await almacenSesion.limpiar();
    expect(mockAlmacen.has(CLAVE_ACTIVA)).toBe(false);
  });

  it('D-05: un 401 AUTENTICACION_REQUERIDA en pedir borra la elección y reinicia el proveedor', async () => {
    await abrirCon([CENTRO, NORTE], NORTE.id);
    jest.spyOn(almacenSesion, 'tokenAcceso').mockReturnValue('acceso');
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () =>
        Promise.resolve({ error: { codigo: 'AUTENTICACION_REQUERIDA', mensaje: 'Inactivo' } }),
    } as unknown as Response);
    await renderConSesion(
      <>
        <Inicio />
        <Activa />
        <Pressable
          testID="pedir"
          onPress={() => void pedir('/usuarios/yo', { autenticado: true }).catch(() => undefined)}
        />
      </>,
    );
    expect(await screen.findByText('redirige a /hoy')).toBeTruthy();
    expect(screen.getByTestId('activa').props.children).toBe(NORTE.barberia.id);

    await fireEvent.press(screen.getByTestId('pedir'));

    expect(await screen.findByText('redirige a /bienvenida')).toBeTruthy();
    expect(screen.getByTestId('activa').props.children).toBe('cargando (sin-sesion)');
    expect(mockAlmacen.has(CLAVE_ACTIVA)).toBe(false);
    expect(mockAlmacen.has('barberly.tokenRenovacion')).toBe(false);
    expect(clienteConsultas.getQueryData(CLAVE_PERFIL)).toBeUndefined();
    jest.mocked(almacenSesion.tokenAcceso).mockRestore();
  });
});

describe('T1.14: la elección guardada puede ser de otra cuenta', () => {
  it('AUT-09: si el arranque no encuentra token, borra la elección', async () => {
    mockAlmacen.delete('barberly.tokenRenovacion');
    mockAlmacen.set(CLAVE_ACTIVA, NORTE.id);
    await renderConSesion(<Activa />);

    await waitFor(() =>
      expect(screen.getByTestId('activa').props.children).toBe('cargando (sin-sesion)'),
    );
    expect(mockAlmacen.has(CLAVE_ACTIVA)).toBe(false);
  });

  it('AUT-09: al entrar con otra cuenta se borra y se elige sola', async () => {
    jest.mocked(renovarSesion).mockResolvedValueOnce(false);
    await abrirCon([CENTRO, NORTE], NORTE.id);
    await renderConSesion(<Entrar />);
    await waitFor(() =>
      expect(screen.getByTestId('activa').props.children).toBe('cargando (sin-sesion)'),
    );
    expect(mockAlmacen.get(CLAVE_ACTIVA)).toBe(NORTE.id);

    await fireEvent.press(screen.getByTestId('entrar'));

    await waitFor(() =>
      expect(screen.getByTestId('activa').props.children).toBe(CENTRO.barberia.id),
    );
    expect(mockAlmacen.has(CLAVE_ACTIVA)).toBe(false);
    expect(mockAlmacen.get('barberly.tokenRenovacion')).toBe('renovacion-otra');
  });
});
