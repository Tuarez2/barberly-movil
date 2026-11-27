// T1.15: recuperar la contraseña con un código de 6 dígitos (AUT-07, D-01).
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { recuperarClave, restablecerClave } from '@/api/autenticacion';
import { ErrorApi } from '@/api/cliente';

import IniciarSesion from '../app/(autenticacion)/iniciar-sesion';
import RecuperarClave from '../app/(autenticacion)/recuperar-clave';
import RestablecerClave from '../app/(autenticacion)/restablecer-clave';
import { renderConConsultas } from './utilidades';

const mockEmpujar = jest.fn();
const mockReemplazar = jest.fn();
let mockParametros: Record<string, string> = {};

jest.mock('expo-router', () => {
  const { Text: TextoMock } = jest.requireActual('react-native');
  return {
    Redirect: ({ href }: { href: string }) => <TextoMock>{`redirige a ${href}`}</TextoMock>,
    useRouter: () => ({ push: mockEmpujar, replace: mockReemplazar, back: jest.fn() }),
    useLocalSearchParams: () => mockParametros,
  };
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock('@/api/autenticacion', () => ({
  iniciarSesion: jest.fn(),
  recuperarClave: jest.fn(),
  restablecerClave: jest.fn(),
}));
jest.mock('@/sesion/proveedor-sesion', () => ({
  nombreDispositivo: 'Pixel de prueba',
  useSesion: () => ({ entrar: jest.fn() }),
}));

const NEUTRO =
  'Si el correo está registrado, te enviamos un código de 6 dígitos para restablecer tu contraseña.';

async function escribir(testID: string, texto: string) {
  await fireEvent.changeText(screen.getByTestId(testID), texto);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockParametros = {};
});

describe('T1.15: enlace desde Iniciar sesión', () => {
  it('AUT-07: «¿Olvidaste tu contraseña?» abre Recuperar con el correo escrito', async () => {
    await renderConConsultas(<IniciarSesion />);

    await escribir('campo-correo', 'ana@barberly.test');
    await fireEvent.press(screen.getByTestId('boton-olvide-clave'));

    expect(mockEmpujar).toHaveBeenCalledWith({
      pathname: '/recuperar-clave',
      params: { correo: 'ana@barberly.test' },
    });
  });
});

describe('T1.15: Recuperar contraseña', () => {
  it('AUT-07: pide el código con el correo normalizado y pasa a Restablecer', async () => {
    jest.mocked(recuperarClave).mockResolvedValueOnce({ mensaje: 'texto del servidor' });
    await renderConConsultas(<RecuperarClave />);

    await escribir('campo-correo', ' Ana@Barberly.test ');
    await fireEvent.press(screen.getByTestId('boton-enviar-codigo'));

    await waitFor(() =>
      expect(mockEmpujar).toHaveBeenCalledWith({
        pathname: '/restablecer-clave',
        params: { correo: 'ana@barberly.test' },
      }),
    );
    expect(jest.mocked(recuperarClave).mock.calls[0]?.[0]).toEqual({
      correo: 'ana@barberly.test',
    });
  });

  it('valida el correo con el esquema del contrato antes de llamar a la API', async () => {
    await renderConConsultas(<RecuperarClave />);

    await escribir('campo-correo', 'no-es-correo');
    await fireEvent.press(screen.getByTestId('boton-enviar-codigo'));

    expect(await screen.findByText('Escribe un correo válido')).toBeTruthy();
    expect(recuperarClave).not.toHaveBeenCalled();
  });

  it('AUT-07: DEMASIADAS_SOLICITUDES va en un aviso y no avanza', async () => {
    jest
      .mocked(recuperarClave)
      .mockRejectedValueOnce(new ErrorApi('DEMASIADAS_SOLICITUDES', 429, 'x'));
    await renderConConsultas(<RecuperarClave />);

    await escribir('campo-correo', 'ana@barberly.test');
    await fireEvent.press(screen.getByTestId('boton-enviar-codigo'));

    expect(await screen.findByTestId('aviso-recuperar-clave')).toBeTruthy();
    expect(
      screen.getByText('Demasiados intentos. Espera unos minutos e intenta de nuevo.'),
    ).toBeTruthy();
    expect(mockEmpujar).not.toHaveBeenCalled();
  });
});

describe('T1.15: Recuperar contraseña sin conexión', () => {
  it('SIN_CONEXION va en un aviso y no avanza', async () => {
    jest.mocked(recuperarClave).mockRejectedValueOnce(new ErrorApi('SIN_CONEXION', 0, 'x'));
    await renderConConsultas(<RecuperarClave />);

    await escribir('campo-correo', 'ana@barberly.test');
    await fireEvent.press(screen.getByTestId('boton-enviar-codigo'));

    expect(await screen.findByTestId('aviso-recuperar-clave')).toBeTruthy();
    expect(
      screen.getByText('No hay conexión. Revisa tu internet e intenta de nuevo.'),
    ).toBeTruthy();
    expect(mockEmpujar).not.toHaveBeenCalled();
  });
});

describe('T1.15: Restablecer contraseña', () => {
  beforeEach(() => {
    mockParametros = { correo: 'ana@barberly.test' };
  });

  async function llenar(codigo = '123456', clave = 'Navaja2027') {
    await escribir('campo-codigo', codigo);
    await escribir('campo-clave-nueva', clave);
    await fireEvent.press(screen.getByTestId('boton-restablecer-clave'));
  }

  it('AUT-07: muestra siempre el mensaje neutro, sin decir si el correo existe', async () => {
    await renderConConsultas(<RestablecerClave />);

    expect(screen.getByTestId('aviso-codigo-enviado')).toBeTruthy();
    expect(screen.getByText(NEUTRO)).toBeTruthy();
    expect(screen.queryByText('texto del servidor')).toBeNull();
  });

  it('el código usa teclado numérico y autocompletado de código de un solo uso', async () => {
    await renderConConsultas(<RestablecerClave />);

    const campo = screen.getByTestId('campo-codigo');
    expect(campo.props.keyboardType).toBe('number-pad');
    expect(campo.props.textContentType).toBe('oneTimeCode');
    expect(campo.props.autoComplete).toBe('one-time-code');
    expect(campo.props.maxLength).toBe(6);
    expect(screen.getByText('Vence en 15 minutos.')).toBeTruthy();
  });

  it('un error de «Pedir otro código» no tapa el error posterior del formulario', async () => {
    jest.mocked(recuperarClave).mockRejectedValueOnce(new ErrorApi('SIN_CONEXION', 0, 'x'));
    jest
      .mocked(restablecerClave)
      .mockRejectedValueOnce(new ErrorApi('DEMASIADAS_SOLICITUDES', 429, 'x'));
    await renderConConsultas(<RestablecerClave />);

    await fireEvent.press(screen.getByTestId('boton-pedir-otro-codigo'));
    expect(
      await screen.findByText('No hay conexión. Revisa tu internet e intenta de nuevo.'),
    ).toBeTruthy();

    await llenar();

    expect(
      await screen.findByText('Demasiados intentos. Espera unos minutos e intenta de nuevo.'),
    ).toBeTruthy();
    expect(
      screen.queryByText('No hay conexión. Revisa tu internet e intenta de nuevo.'),
    ).toBeNull();
  });

  it('AUT-07: con 204 vuelve a Iniciar sesión con el aviso de contraseña cambiada', async () => {
    jest.mocked(restablecerClave).mockResolvedValueOnce(undefined);
    await renderConConsultas(<RestablecerClave />);

    await llenar();

    await waitFor(() =>
      expect(mockReemplazar).toHaveBeenCalledWith({
        pathname: '/iniciar-sesion',
        params: { correo: 'ana@barberly.test', aviso: 'clave-cambiada' },
      }),
    );
    expect(jest.mocked(restablecerClave).mock.calls[0]?.[0]).toEqual({
      correo: 'ana@barberly.test',
      codigo: '123456',
      claveNueva: 'Navaja2027',
    });

    mockParametros = { correo: 'ana@barberly.test', aviso: 'clave-cambiada' };
    await renderConConsultas(<IniciarSesion />);
    expect(screen.getByText('Contraseña cambiada, inicia sesión')).toBeTruthy();
    expect(screen.getByTestId('campo-correo').props.value).toBe('ana@barberly.test');
  });

  it('valida el código de 6 dígitos con el esquema del contrato', async () => {
    await renderConConsultas(<RestablecerClave />);

    await llenar('12a4');

    expect(await screen.findByText('El código tiene 6 dígitos')).toBeTruthy();
    expect(restablecerClave).not.toHaveBeenCalled();
  });

  it('D-01: CODIGO_INVALIDO va con su mensaje en el campo del código', async () => {
    jest.mocked(restablecerClave).mockRejectedValueOnce(new ErrorApi('CODIGO_INVALIDO', 422, 'x'));
    await renderConConsultas(<RestablecerClave />);

    await llenar();

    expect(
      await screen.findByText('El código no es válido o ya venció. Revísalo o pide otro.'),
    ).toBeTruthy();
    expect(screen.queryByTestId('aviso-restablecer-clave')).toBeNull();
    expect(mockReemplazar).not.toHaveBeenCalled();
  });

  it('AUT-07: DEMASIADAS_SOLICITUDES va en un aviso', async () => {
    jest
      .mocked(restablecerClave)
      .mockRejectedValueOnce(new ErrorApi('DEMASIADAS_SOLICITUDES', 429, 'x'));
    await renderConConsultas(<RestablecerClave />);

    await llenar();

    expect(await screen.findByTestId('aviso-restablecer-clave')).toBeTruthy();
    expect(
      screen.getByText('Demasiados intentos. Espera unos minutos e intenta de nuevo.'),
    ).toBeTruthy();
    expect(mockReemplazar).not.toHaveBeenCalled();
  });

  it('SIN_CONEXION va en un aviso', async () => {
    jest.mocked(restablecerClave).mockRejectedValueOnce(new ErrorApi('SIN_CONEXION', 0, 'x'));
    await renderConConsultas(<RestablecerClave />);

    await llenar();

    expect(
      await screen.findByText('No hay conexión. Revisa tu internet e intenta de nuevo.'),
    ).toBeTruthy();
  });

  it('D-01: «Pedir otro código» lo pide para el mismo correo y limpia el código', async () => {
    jest.mocked(restablecerClave).mockRejectedValueOnce(new ErrorApi('CODIGO_INVALIDO', 422, 'x'));
    jest.mocked(recuperarClave).mockResolvedValueOnce({ mensaje: 'x' });
    await renderConConsultas(<RestablecerClave />);
    await llenar();
    await screen.findByText('El código no es válido o ya venció. Revísalo o pide otro.');

    await fireEvent.press(screen.getByTestId('boton-pedir-otro-codigo'));

    await waitFor(() => expect(screen.getByTestId('campo-codigo').props.value).toBe(''));
    expect(recuperarClave).toHaveBeenCalledWith({ correo: 'ana@barberly.test' });
    expect(
      screen.queryByText('El código no es válido o ya venció. Revísalo o pide otro.'),
    ).toBeNull();
    expect(screen.getByText(NEUTRO)).toBeTruthy();
  });

  it('sin correo vuelve a Recuperar contraseña', async () => {
    mockParametros = {};
    await renderConConsultas(<RestablecerClave />);
    expect(screen.getByText('redirige a /recuperar-clave')).toBeTruthy();
  });
});
