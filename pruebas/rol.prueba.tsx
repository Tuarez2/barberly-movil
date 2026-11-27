// T1.12: entrada según el rol, rutas protegidas y cerrar sesión (AUT-03, AUT-08, HU-AUT-02, D-10).
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type { PerfilUsuario } from '@/api/contrato';
import { ELECCION_CLIENTE, type MembresiaActiva, resolverActiva } from '@/sesion/barberia-activa';

import LayoutBarbero from '../app/(barbero)/_layout';
import Explorar from '../app/(cliente)/explorar';
import Perfil from '../app/(cliente)/perfil';
import Inicio from '../app/index';
import { renderConConsultas } from './utilidades';

const mockSesion = {
  estado: 'con-sesion',
  perfil: undefined as PerfilUsuario | undefined,
  errorPerfil: null as unknown,
  activa: undefined as MembresiaActiva | undefined,
  salir: jest.fn(async () => undefined),
  reintentar: jest.fn(),
};

jest.mock('@/sesion/proveedor-sesion', () => ({ useSesion: () => mockSesion }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock('expo-router', () => {
  const { Text: TextoMock } = jest.requireActual('react-native');
  return {
    Redirect: ({ href }: { href: string }) => <TextoMock>{`redirige a ${href}`}</TextoMock>,
    Stack: () => <TextoMock>pila</TextoMock>,
    useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
    useSegments: () => ['(cliente)', 'perfil'],
  };
});

const BARBERIA = { id: 'b1', nombre: 'Barbería Centro' };

function perfilCon(roles: ('PROPIETARIO' | 'BARBERO')[]): PerfilUsuario {
  return {
    id: 'u1',
    nombre: 'Ana Pérez',
    correo: 'ana@barberly.test',
    telefono: '+593991234567',
    consentimientoIaEn: null,
    membresias: roles.map((rol, indice) => ({
      id: `m${indice}`,
      rol,
      barberoId: rol === 'BARBERO' ? 'p1' : null,
      barberia: BARBERIA,
    })),
  };
}

// Sin elección guardada (AUT-09): se resuelve como al entrar por primera vez.
function conPerfil(perfil: PerfilUsuario) {
  mockSesion.perfil = perfil;
  mockSesion.activa = resolverActiva(perfil, null);
}

describe('T1.12: entrada según el rol', () => {
  beforeEach(() => {
    mockSesion.estado = 'con-sesion';
    mockSesion.perfil = undefined;
    mockSesion.activa = undefined;
    mockSesion.errorPerfil = null;
    jest.clearAllMocks();
  });

  it('sin sesión va a la Bienvenida', async () => {
    mockSesion.estado = 'sin-sesion';
    await render(<Inicio />);
    expect(screen.getByText('redirige a /bienvenida')).toBeTruthy();
  });

  it('un cliente entra a Explorar', async () => {
    conPerfil(perfilCon([]));
    await render(<Inicio />);
    expect(screen.getByText('redirige a /explorar')).toBeTruthy();
  });

  it('un barbero entra a su día', async () => {
    conPerfil(perfilCon(['BARBERO']));
    await render(<Inicio />);
    expect(screen.getByText('redirige a /hoy')).toBeTruthy();
  });

  it('D-10: un propietario entra como cliente y ve el aviso del panel web', async () => {
    conPerfil(perfilCon(['PROPIETARIO']));
    await render(<Inicio />);
    expect(screen.getByText('redirige a /explorar')).toBeTruthy();

    await render(<Explorar />);
    expect(screen.getByText('Hola, Ana')).toBeTruthy();
    expect(screen.getByTestId('aviso-panel')).toBeTruthy();
  });

  it('un cliente no ve el aviso del panel', async () => {
    mockSesion.perfil = perfilCon([]);
    await render(<Explorar />);
    expect(screen.queryByTestId('aviso-panel')).toBeNull();
  });

  it('SEG-03: quien no es barbero no entra a las rutas del barbero', async () => {
    conPerfil(perfilCon(['PROPIETARIO']));
    await render(<LayoutBarbero />);
    expect(screen.getByText('redirige a /explorar')).toBeTruthy();
  });

  it('AUT-09: un barbero con su membresía elegida entra a sus rutas', async () => {
    conPerfil(perfilCon(['BARBERO']));
    await render(<LayoutBarbero />);
    expect(screen.getByText('pila')).toBeTruthy();
  });

  it('AUT-09: un barbero que eligió el rol cliente va de /hoy a Explorar', async () => {
    mockSesion.perfil = perfilCon(['BARBERO']);
    mockSesion.activa = resolverActiva(mockSesion.perfil, ELECCION_CLIENTE);
    await render(<LayoutBarbero />);
    expect(screen.getByText('redirige a /explorar')).toBeTruthy();
  });

  it('sin conexión ofrece reintentar', async () => {
    mockSesion.estado = 'sin-conexion';
    await render(<Inicio />);

    await fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
    expect(mockSesion.reintentar).toHaveBeenCalled();
  });

  it('AUT-03: desde el perfil se cierra la sesión', async () => {
    mockSesion.perfil = perfilCon(['BARBERO']);
    await renderConConsultas(<Perfil />);

    expect(screen.getByText('Barbería Centro')).toBeTruthy();
    expect(screen.getByText('Barbero')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('boton-cerrar-sesion'));
    await waitFor(() => expect(mockSesion.salir).toHaveBeenCalled());
  });
});
