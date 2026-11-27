// HU-AUT-01 y HU-AUT-02 en la app (T1.11).
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { iniciarSesion, registrar } from '@/api/autenticacion';
import { ErrorApi } from '@/api/cliente';

import IniciarSesion from '../app/(autenticacion)/iniciar-sesion';
import Registro from '../app/(autenticacion)/registro';
import { renderConConsultas } from './utilidades';

const mockReemplazar = jest.fn();
const mockEntrar = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReemplazar, back: jest.fn(), push: jest.fn() }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock('@/api/autenticacion', () => ({ iniciarSesion: jest.fn(), registrar: jest.fn() }));
jest.mock('@/sesion/proveedor-sesion', () => ({
  nombreDispositivo: 'Pixel de prueba',
  useSesion: () => ({ entrar: mockEntrar }),
}));

const sesion = {
  usuario: { id: 'u1', nombre: 'Ana', correo: 'ana@barberly.test', telefono: '+593991234567' },
  tokenAcceso: 'acceso',
  tokenRenovacion: 'renovacion',
};

async function escribir(testID: string, texto: string) {
  await fireEvent.changeText(screen.getByTestId(testID), texto);
}

describe('T1.11: Inicio de sesión', () => {
  beforeEach(() => jest.clearAllMocks());

  it('HU-AUT-02: con credenciales correctas entra y va a la pantalla de su rol', async () => {
    jest.mocked(iniciarSesion).mockResolvedValueOnce(sesion);
    await renderConConsultas(<IniciarSesion />);

    await escribir('campo-correo', ' Ana@Barberly.test ');
    await escribir('campo-clave', 'Barberly2026');
    await fireEvent.press(screen.getByTestId('boton-iniciar-sesion'));

    await waitFor(() => expect(mockReemplazar).toHaveBeenCalledWith('/'));
    expect(iniciarSesion).toHaveBeenCalledWith({
      correo: 'ana@barberly.test',
      clave: 'Barberly2026',
      dispositivo: 'Pixel de prueba',
    });
    expect(mockEntrar).toHaveBeenCalledWith(sesion);
  });

  it('valida en la app antes de llamar a la API', async () => {
    await renderConConsultas(<IniciarSesion />);

    await fireEvent.press(screen.getByTestId('boton-iniciar-sesion'));

    expect(await screen.findByText('Escribe un correo válido')).toBeTruthy();
    expect(screen.getByText('Escribe tu contraseña')).toBeTruthy();
    expect(iniciarSesion).not.toHaveBeenCalled();
  });

  it('CREDENCIALES_INVALIDAS muestra un aviso claro', async () => {
    jest
      .mocked(iniciarSesion)
      .mockRejectedValueOnce(new ErrorApi('CREDENCIALES_INVALIDAS', 401, 'x'));
    await renderConConsultas(<IniciarSesion />);

    await escribir('campo-correo', 'ana@barberly.test');
    await escribir('campo-clave', 'mala');
    await fireEvent.press(screen.getByTestId('boton-iniciar-sesion'));

    expect(await screen.findByText('Correo o contraseña incorrectos.')).toBeTruthy();
    expect(mockEntrar).not.toHaveBeenCalled();
  });

  it('DEMASIADAS_SOLICITUDES pide esperar', async () => {
    jest
      .mocked(iniciarSesion)
      .mockRejectedValueOnce(new ErrorApi('DEMASIADAS_SOLICITUDES', 429, 'x'));
    await renderConConsultas(<IniciarSesion />);

    await escribir('campo-correo', 'ana@barberly.test');
    await escribir('campo-clave', 'mala');
    await fireEvent.press(screen.getByTestId('boton-iniciar-sesion'));

    expect(
      await screen.findByText('Demasiados intentos. Espera unos minutos e intenta de nuevo.'),
    ).toBeTruthy();
  });
});

describe('T1.11: Registro', () => {
  beforeEach(() => jest.clearAllMocks());

  async function llenar(clave = 'Barberly2026') {
    await escribir('campo-nombre', 'Ana Pérez');
    await escribir('campo-correo', 'ana@barberly.test');
    await escribir('campo-telefono', '099 123 4567');
    await escribir('campo-clave', clave);
  }

  it('HU-AUT-01: con datos válidos crea la cuenta y entra', async () => {
    jest.mocked(registrar).mockResolvedValueOnce(sesion);
    await renderConConsultas(<Registro />);

    await llenar();
    await fireEvent.press(screen.getByTestId('boton-registro'));

    await waitFor(() => expect(mockReemplazar).toHaveBeenCalledWith('/'));
    expect(registrar).toHaveBeenCalledWith({
      nombre: 'Ana Pérez',
      correo: 'ana@barberly.test',
      telefono: '+593991234567',
      clave: 'Barberly2026',
      dispositivo: 'Pixel de prueba',
    });
  });

  it('HU-AUT-01: con una contraseña corta dice qué requisito falta', async () => {
    await renderConConsultas(<Registro />);

    await llenar('abc1');
    await fireEvent.press(screen.getByTestId('boton-registro'));

    expect(await screen.findByText('La contraseña debe tener al menos 8 caracteres')).toBeTruthy();
    expect(registrar).not.toHaveBeenCalled();
  });

  it('HU-AUT-01: con un correo ya registrado lo marca en el campo', async () => {
    jest.mocked(registrar).mockRejectedValueOnce(new ErrorApi('CORREO_REGISTRADO', 409, 'x'));
    await renderConConsultas(<Registro />);

    await llenar();
    await fireEvent.press(screen.getByTestId('boton-registro'));

    expect(
      await screen.findByText('Ya existe una cuenta con ese correo. Inicia sesión.'),
    ).toBeTruthy();
    expect(mockEntrar).not.toHaveBeenCalled();
  });
});
