// Inicio del barbero. La agenda del día (AGE-01) llega en la etapa 4 (T4.6).
import { PantallaCarga } from '@/componentes/pantalla-carga';
import { PantallaInicio } from '@/componentes/pantalla-inicio';
import { useSesion } from '@/sesion/proveedor-sesion';
import { textos } from '@/textos';

export default function Hoy() {
  const { perfil } = useSesion();
  if (!perfil) return <PantallaCarga />;
  return (
    <PantallaInicio
      perfil={perfil}
      textosInicio={textos.inicioBarbero}
      rutaPerfil="/(barbero)/perfil"
    />
  );
}
