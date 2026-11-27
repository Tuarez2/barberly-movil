// Inicio del cliente. Explorar barberías (BUS-01) llega en la etapa 2 (T2.12).
import { PantallaCarga } from '@/componentes/pantalla-carga';
import { PantallaInicio } from '@/componentes/pantalla-inicio';
import { useSesion } from '@/sesion/proveedor-sesion';
import { textos } from '@/textos';

export default function Explorar() {
  const { perfil } = useSesion();
  if (!perfil) return <PantallaCarga />;
  return (
    <PantallaInicio
      perfil={perfil}
      textosInicio={textos.inicioCliente}
      rutaPerfil="/(cliente)/perfil"
    />
  );
}
