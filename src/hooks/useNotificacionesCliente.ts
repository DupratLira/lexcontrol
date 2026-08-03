import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useNotificacionesCliente(userId: string | null, esCliente: boolean) {
  const [vistoPorExpediente, setVistoPorExpediente] = useState<Record<string, string | null>>({});

  const cargar = useCallback(async () => {
    if (!esCliente || !userId) return;
    const { data } = await supabase
      .from('usuarios_expedientes')
      .select('expediente_id, visto_en')
      .eq('usuario_id', userId);
    const mapa: Record<string, string | null> = {};
    for (const fila of data ?? []) {
      mapa[String(fila.expediente_id)] = fila.visto_en;
    }
    setVistoPorExpediente(mapa);
  }, [userId, esCliente]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const marcarVisto = useCallback(
    async (expedienteId: string) => {
      if (!esCliente) return;
      await supabase.rpc('marcar_expediente_visto', { p_expediente_id: Number(expedienteId) });
      setVistoPorExpediente((prev) => ({ ...prev, [expedienteId]: new Date().toISOString() }));
    },
    [esCliente]
  );

  const tieneActualizacion = useCallback(
    (expedienteId: string, actualizadoEn: string) => {
      if (!esCliente) return false;
      const visto = vistoPorExpediente[expedienteId];
      if (!visto) return true;
      return new Date(actualizadoEn).getTime() > new Date(visto).getTime();
    },
    [esCliente, vistoPorExpediente]
  );

  return { marcarVisto, tieneActualizacion };
}
