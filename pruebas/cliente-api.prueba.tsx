// AUT-04, D-02, D-17: renovacion automatica del token de acceso.
import { almacenSesion } from '@/api/almacen-sesion';
import { ErrorApi, escucharSesionInvalida, pedir, urlApi } from '@/api/cliente';

const mockAlmacen = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(async (clave: string, valor: string) => void mockAlmacen.set(clave, valor)),
  getItemAsync: jest.fn(async (clave: string) => mockAlmacen.get(clave) ?? null),
  deleteItemAsync: jest.fn(async (clave: string) => void mockAlmacen.delete(clave)),
}));

function respuesta(estado: number, cuerpo?: unknown) {
  return Promise.resolve({
    ok: estado >= 200 && estado < 300,
    status: estado,
    json: () => Promise.resolve(cuerpo),
  } as Response);
}

const vencido = { error: { codigo: 'TOKEN_VENCIDO', mensaje: 'Tu sesión venció' } };
const fetchSimulado = jest.fn();

describe('T1.10: cliente HTTP con sesión', () => {
  beforeEach(async () => {
    mockAlmacen.clear();
    fetchSimulado.mockReset();
    globalThis.fetch = fetchSimulado;
    await almacenSesion.guardar({ tokenAcceso: 'acceso-viejo', tokenRenovacion: 'renovacion-1' });
  });

  it('envía el token de acceso en Authorization', async () => {
    fetchSimulado.mockReturnValueOnce(respuesta(200, { datos: { id: 'u1' } }));

    await pedir('/usuarios/yo', { autenticado: true });

    const [, opciones] = fetchSimulado.mock.calls[0];
    expect(opciones.headers.Authorization).toBe('Bearer acceso-viejo');
  });

  it('con TOKEN_VENCIDO renueva una vez y repite la solicitud', async () => {
    fetchSimulado
      .mockReturnValueOnce(respuesta(401, vencido))
      .mockReturnValueOnce(
        respuesta(200, { datos: { tokenAcceso: 'acceso-nuevo', tokenRenovacion: 'renovacion-2' } }),
      )
      .mockReturnValueOnce(respuesta(200, { datos: { id: 'u1' } }));

    const { datos } = await pedir<{ id: string }>('/usuarios/yo', { autenticado: true });

    expect(datos.id).toBe('u1');
    expect(fetchSimulado.mock.calls[1][0]).toBe(`${urlApi()}/autenticacion/renovar`);
    expect(JSON.parse(fetchSimulado.mock.calls[1][1].body)).toEqual({
      tokenRenovacion: 'renovacion-1',
    });
    expect(fetchSimulado.mock.calls[2][1].headers.Authorization).toBe('Bearer acceso-nuevo');
    expect(await almacenSesion.tokenRenovacion()).toBe('renovacion-2');
  });

  it('dos solicitudes vencidas a la vez comparten una sola renovación', async () => {
    fetchSimulado.mockImplementation((url: string) =>
      url.endsWith('/renovar')
        ? respuesta(200, {
            datos: { tokenAcceso: 'acceso-nuevo', tokenRenovacion: 'renovacion-2' },
          })
        : respuesta(
            almacenSesion.tokenAcceso() === 'acceso-nuevo' ? 200 : 401,
            almacenSesion.tokenAcceso() === 'acceso-nuevo' ? { datos: {} } : vencido,
          ),
    );

    await Promise.all([
      pedir('/usuarios/yo', { autenticado: true }),
      pedir('/usuarios/yo', { autenticado: true }),
    ]);

    const renovaciones = fetchSimulado.mock.calls.filter(([url]) => url.endsWith('/renovar'));
    expect(renovaciones).toHaveLength(1);
  });

  it('HU-AUT-02: si la renovación es rechazada borra la sesión y avisa', async () => {
    const alInvalida = jest.fn();
    escucharSesionInvalida(alInvalida);
    fetchSimulado
      .mockReturnValueOnce(respuesta(401, vencido))
      .mockReturnValueOnce(
        respuesta(401, { error: { codigo: 'AUTENTICACION_REQUERIDA', mensaje: '' } }),
      );

    await expect(pedir('/usuarios/yo', { autenticado: true })).rejects.toMatchObject({
      codigo: 'TOKEN_VENCIDO',
    });
    expect(alInvalida).toHaveBeenCalledTimes(1);
    expect(await almacenSesion.tokenRenovacion()).toBeNull();
    escucharSesionInvalida(undefined);
  });

  it('sin red responde SIN_CONEXION', async () => {
    fetchSimulado.mockRejectedValueOnce(new TypeError('Network request failed'));

    await expect(pedir('/salud')).rejects.toEqual(expect.any(ErrorApi));
  });
});
