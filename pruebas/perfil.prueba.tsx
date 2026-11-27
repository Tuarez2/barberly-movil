// T1.13: editar el perfil y cambiar la contraseña en la app (AUT-05, AUT-06, D-05).
import { QueryClient } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { almacenSesion } from '@/api/almacen-sesion';
import { ErrorApi, escucharSesionInvalida } from '@/api/cliente';
import type { PerfilUsuario } from '@/api/contrato';
import { cambiarClave, editarPerfil } from '@/api/usuarios';

import EditarPerfilBarbero from '../app/(barbero)/perfil/editar';
import Perfil from '../app/(cliente)/perfil';
import CambiarClave from '../app/(cliente)/perfil/clave';
import EditarPerfil from '../app/(cliente)/perfil/editar';
import { renderConConsultas } from './utilidades';

const mockEmpujar = jest.fn();
const mockVolver = jest.fn();
const mockReemplazar = jest.fn();
const mockSalir = jest.fn();
let mockSegmentos = ['(cliente)', 'perfil'];

const PERFIL: PerfilUsuario = {
  id: 'u1',
  nombre: 'Ana Pérez',
  correo: 'ana@barberly.test',
  telefono: '+593991234567',
  consentimientoIaEn: null,
  membresias: [],
};

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockEmpujar, back: mockVolver, replace: mockReemplazar }),
  useSegments: () => mockSegmentos,
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock('@/api/usuarios', () => ({ cambiarClave: jest.fn(), editarPerfil: jest.fn() }));
jest.mock('@/sesion/proveedor-sesion', () => ({
  CLAVE_PERFIL: ['perfil'],
  useSesion: () => ({ perfil: PERFIL, salir: mockSalir }),
}));

async function escribir(testID: string, texto: string) {
  await fireEvent.changeText(screen.getByTestId(testID), texto);
}

describe('T1.13: enlaces desde el Perfil', () => {
  beforeEach(() => jest.clearAllMocks());

  it('el cliente abre Editar perfil y Cambiar contraseña de su grupo', async () => {
    mockSegmentos = ['(cliente)', 'perfil'];
    await renderConConsultas(<Perfil />);

    await fireEvent.press(screen.getByTestId('boton-editar-perfil'));
    await fireEvent.press(screen.getByTestId('boton-abrir-cambiar-clave'));

    expect(mockEmpujar).toHaveBeenNthCalledWith(1, '/(cliente)/perfil/editar');
    expect(mockEmpujar).toHaveBeenNthCalledWith(2, '/(cliente)/perfil/clave');
  });

  it('§10.5: el barbero reutiliza las pantallas dentro de (barbero)', async () => {
    mockSegmentos = ['(barbero)', 'perfil'];
    await renderConConsultas(<Perfil />);

    await fireEvent.press(screen.getByTestId('boton-editar-perfil'));
    await fireEvent.press(screen.getByTestId('boton-abrir-cambiar-clave'));

    expect(mockEmpujar).toHaveBeenNthCalledWith(1, '/(barbero)/perfil/editar');
    expect(mockEmpujar).toHaveBeenNthCalledWith(2, '/(barbero)/perfil/clave');
    expect(EditarPerfilBarbero).toBe(EditarPerfil);
  });
});

describe('T1.13: Editar perfil', () => {
  beforeEach(() => jest.clearAllMocks());

  it('AUT-05: muestra los datos actuales y el correo no se puede editar', async () => {
    await renderConConsultas(<EditarPerfil />);

    expect(screen.getByTestId('campo-nombre').props.value).toBe('Ana Pérez');
    expect(screen.getByTestId('campo-telefono').props.value).toBe('+593991234567');
    expect(screen.getByTestId('campo-correo').props.editable).toBe(false);
  });

  it('AUT-05: guarda el teléfono normalizado, invalida GET /usuarios/yo y vuelve', async () => {
    const invalidar = jest.spyOn(QueryClient.prototype, 'invalidateQueries');
    jest.mocked(editarPerfil).mockResolvedValueOnce({ ...PERFIL, telefono: '+593987654321' });
    await renderConConsultas(<EditarPerfil />);

    await escribir('campo-telefono', '098 765 4321');
    await fireEvent.press(screen.getByTestId('boton-guardar-perfil'));

    await waitFor(() => expect(mockVolver).toHaveBeenCalled());
    expect(jest.mocked(editarPerfil).mock.calls[0]?.[0]).toEqual({
      nombre: 'Ana Pérez',
      telefono: '+593987654321',
    });
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ['perfil'] });
    invalidar.mockRestore();
  });

  it('valida con el esquema del contrato antes de llamar a la API', async () => {
    await renderConConsultas(<EditarPerfil />);

    await escribir('campo-nombre', 'A');
    await escribir('campo-telefono', '12');
    await fireEvent.press(screen.getByTestId('boton-guardar-perfil'));

    expect(await screen.findByText('El nombre debe tener al menos 2 caracteres')).toBeTruthy();
    expect(screen.getByText('El teléfono debe tener de 7 a 15 dígitos')).toBeTruthy();
    expect(editarPerfil).not.toHaveBeenCalled();
  });

  it('DATOS_INVALIDOS de la API se marca en su campo', async () => {
    jest
      .mocked(editarPerfil)
      .mockRejectedValueOnce(
        new ErrorApi('DATOS_INVALIDOS', 422, 'x', [
          { campo: 'telefono', mensaje: 'El teléfono debe tener de 7 a 15 dígitos' },
        ]),
      );
    await renderConConsultas(<EditarPerfil />);

    await fireEvent.press(screen.getByTestId('boton-guardar-perfil'));

    expect(await screen.findByText('El teléfono debe tener de 7 a 15 dígitos')).toBeTruthy();
    expect(screen.queryByTestId('aviso-editar-perfil')).toBeNull();
    expect(mockVolver).not.toHaveBeenCalled();
  });

  it('DATOS_INVALIDOS sin un campo de esta pantalla muestra el aviso general', async () => {
    jest
      .mocked(editarPerfil)
      .mockRejectedValueOnce(
        new ErrorApi('DATOS_INVALIDOS', 422, 'x', [{ campo: 'correo', mensaje: 'No permitido' }]),
      );
    await renderConConsultas(<EditarPerfil />);

    await fireEvent.press(screen.getByTestId('boton-guardar-perfil'));

    expect(await screen.findByTestId('aviso-editar-perfil')).toBeTruthy();
    expect(screen.getByText('Revisa los datos marcados.')).toBeTruthy();
    expect(screen.queryByText('No permitido')).toBeNull();
  });

  it('sin conexión avisa y se queda en la pantalla', async () => {
    jest.mocked(editarPerfil).mockRejectedValueOnce(new ErrorApi('SIN_CONEXION', 0, 'x'));
    await renderConConsultas(<EditarPerfil />);

    await fireEvent.press(screen.getByTestId('boton-guardar-perfil'));

    expect(
      await screen.findByText('No hay conexión. Revisa tu internet e intenta de nuevo.'),
    ).toBeTruthy();
    expect(mockVolver).not.toHaveBeenCalled();
  });
});

describe('T1.13: Cambiar contraseña', () => {
  beforeEach(() => jest.clearAllMocks());

  async function llenar(actual = 'Barberly2026', nueva = 'Navaja2027') {
    await escribir('campo-clave-actual', actual);
    await escribir('campo-clave-nueva', nueva);
    await fireEvent.press(screen.getByTestId('boton-guardar-clave'));
  }

  it('AUT-06: con la actual correcta cambia la contraseña y lo confirma', async () => {
    jest.mocked(cambiarClave).mockResolvedValueOnce(undefined);
    await renderConConsultas(<CambiarClave />);

    await llenar();

    expect(await screen.findByText('Listo. Tu contraseña se cambió.')).toBeTruthy();
    expect(jest.mocked(cambiarClave).mock.calls[0]?.[0]).toEqual({
      claveActual: 'Barberly2026',
      claveNueva: 'Navaja2027',
    });
    expect(screen.getByTestId('campo-clave-actual').props.value).toBe('');
  });

  it('la ayuda de la contraseña nueva es un texto fijo bajo el campo', async () => {
    await renderConConsultas(<CambiarClave />);

    expect(
      screen.getByText('Mínimo 8 caracteres, con al menos una letra y un número.'),
    ).toBeTruthy();
    expect(screen.getByTestId('campo-clave-nueva').props.placeholder).toBeUndefined();
  });

  it('DATOS_INVALIDOS sin un campo de esta pantalla muestra el aviso general', async () => {
    jest
      .mocked(cambiarClave)
      .mockRejectedValueOnce(new ErrorApi('DATOS_INVALIDOS', 422, 'x', [{ campo: 'otro' }]));
    await renderConConsultas(<CambiarClave />);

    await llenar();

    expect(await screen.findByTestId('aviso-cambiar-clave')).toBeTruthy();
    expect(screen.getByText('Revisa los datos marcados.')).toBeTruthy();
  });

  it('AUT-06: con una nueva de 7 caracteres dice qué falta y no llama a la API', async () => {
    await renderConConsultas(<CambiarClave />);

    await llenar('Barberly2026', 'abcde12');

    expect(await screen.findByText('La contraseña debe tener al menos 8 caracteres')).toBeTruthy();
    expect(cambiarClave).not.toHaveBeenCalled();
  });

  it('D-05: CREDENCIALES_INVALIDAS marca la actual y NO cierra la sesión', async () => {
    jest
      .mocked(cambiarClave)
      .mockRejectedValueOnce(new ErrorApi('CREDENCIALES_INVALIDAS', 401, 'x'));
    await renderConConsultas(<CambiarClave />);

    await llenar('mala1234');

    expect(await screen.findByText('La contraseña actual no es correcta.')).toBeTruthy();
    expect(screen.queryByText('Correo o contraseña incorrectos.')).toBeNull();
    expect(screen.queryByTestId('aviso-cambiar-clave')).toBeNull();
    expect(mockSalir).not.toHaveBeenCalled();
    expect(mockReemplazar).not.toHaveBeenCalled();
  });

  it('AUT-06: DEMASIADAS_SOLICITUDES pide esperar', async () => {
    jest
      .mocked(cambiarClave)
      .mockRejectedValueOnce(new ErrorApi('DEMASIADAS_SOLICITUDES', 429, 'x'));
    await renderConConsultas(<CambiarClave />);

    await llenar();

    expect(
      await screen.findByText('Demasiados intentos. Espera unos minutos e intenta de nuevo.'),
    ).toBeTruthy();
    expect(mockSalir).not.toHaveBeenCalled();
  });
});

describe('T1.13: PATCH /usuarios/yo/clave en el cliente HTTP', () => {
  const { cambiarClave: cambiarClaveReal } =
    jest.requireActual<typeof import('@/api/usuarios')>('@/api/usuarios');

  it('D-05: un 401 CREDENCIALES_INVALIDAS no renueva ni borra la sesión', async () => {
    const alSesionInvalida = jest.fn();
    escucharSesionInvalida(alSesionInvalida);
    jest.spyOn(almacenSesion, 'tokenAcceso').mockReturnValue('acceso');
    const limpiar = jest.spyOn(almacenSesion, 'limpiar').mockResolvedValue();
    const fetchSimulado = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () =>
        Promise.resolve({ error: { codigo: 'CREDENCIALES_INVALIDAS', mensaje: 'Incorrecta' } }),
    } as unknown as Response);
    globalThis.fetch = fetchSimulado;

    await expect(
      cambiarClaveReal({ claveActual: 'mala1234', claveNueva: 'Navaja2027' }),
    ).rejects.toMatchObject({ codigo: 'CREDENCIALES_INVALIDAS', http: 401 });

    expect(fetchSimulado).toHaveBeenCalledTimes(1);
    expect(fetchSimulado.mock.calls[0][1]).toMatchObject({ method: 'PATCH' });
    expect(fetchSimulado.mock.calls[0][1].headers.Authorization).toBe('Bearer acceso');
    expect(limpiar).not.toHaveBeenCalled();
    expect(alSesionInvalida).not.toHaveBeenCalled();
    escucharSesionInvalida(undefined);
  });
});
