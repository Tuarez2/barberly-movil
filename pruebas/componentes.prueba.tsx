import { fireEvent, render, screen } from '@testing-library/react-native';

import { Aviso } from '@/componentes/aviso';
import { Boton } from '@/componentes/boton';
import { CampoTexto } from '@/componentes/campo-texto';

describe('D-26: componentes base', () => {
  it('Boton llama a alPresionar', async () => {
    const alPresionar = jest.fn();
    await render(<Boton etiqueta="Confirmar cita" alPresionar={alPresionar} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Confirmar cita' }));

    expect(alPresionar).toHaveBeenCalledTimes(1);
  });

  it('Boton cargando no se puede presionar y anuncia que esta ocupado', async () => {
    const alPresionar = jest.fn();
    await render(<Boton etiqueta="Entrar" cargando alPresionar={alPresionar} />);

    const boton = screen.getByRole('button', { name: 'Entrar' });
    await fireEvent.press(boton);

    expect(alPresionar).not.toHaveBeenCalled();
    expect(boton.props.accessibilityState).toMatchObject({ busy: true, disabled: true });
  });

  it('CampoTexto muestra el error del campo', async () => {
    await render(<CampoTexto etiqueta="Correo" error="Escribe un correo válido" />);

    expect(screen.getByText('Escribe un correo válido')).toBeTruthy();
  });

  it('CampoTexto de clave permite mostrarla y ocultarla', async () => {
    await render(<CampoTexto etiqueta="Contraseña" esClave />);

    expect(screen.getByLabelText('Contraseña').props.secureTextEntry).toBe(true);
    await fireEvent.press(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(screen.getByLabelText('Contraseña').props.secureTextEntry).toBe(false);
  });

  it('Aviso de error se anuncia como alerta', async () => {
    await render(<Aviso mensaje="Correo o contraseña incorrectos." />);

    expect(screen.getByRole('alert')).toBeTruthy();
  });
});
