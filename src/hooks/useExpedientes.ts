import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  EXPEDIENTE_COLUMNS_WITH_CONCLUIDO,
  expedienteToPatch,
  rowToExpediente,
  type ExpedienteRow,
} from '../lib/mapExpediente';
import type { Actuacion, Expediente } from '../types';

// Si la migracion opcional (supabase-migration.sql) no se ha corrido, la
// columna `concluido` no existe todavia: en ese caso reintentamos sin ella
// para no romper la app, y "concluir" solo funciona de forma local.
async function fetchExpedientesRows(): Promise<{ rows: ExpedienteRow[]; hasConcluido: boolean }> {
  const full = await supabase
    .from('expedientes')
    .select(EXPEDIENTE_COLUMNS_WITH_CONCLUIDO)
    .order('created_at', { ascending: false });

  if (!full.error) {
    return { rows: (full.data ?? []) as unknown as ExpedienteRow[], hasConcluido: true };
  }

  const basic = await supabase
    .from('expedientes')
    .select(EXPEDIENTE_COLUMNS_WITH_CONCLUIDO.replace(',concluido', ''))
    .order('created_at', { ascending: false });

  if (basic.error) throw basic.error;
  return { rows: (basic.data ?? []) as unknown as ExpedienteRow[], hasConcluido: false };
}

export function useExpedientes(userEmail: string | null) {
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasConcluidoCol = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { rows, hasConcluido } = await fetchExpedientesRows();
      hasConcluidoCol.current = hasConcluido;
      const base = rows.map(rowToExpediente);

      const { data: actRows, error: actErr } = await supabase
        .from('actuaciones')
        .select('id, expediente_id, descripcion, created_by_email, created_at')
        .order('created_at', { ascending: false });

      if (!actErr && actRows) {
        const byExpediente = new Map<string, Actuacion[]>();
        for (const row of actRows as Array<{
          id: string; expediente_id: string; descripcion: string;
          created_by_email: string | null; created_at: string;
        }>) {
          const list = byExpediente.get(row.expediente_id) ?? [];
          list.push({
            id: row.id,
            expedienteId: row.expediente_id,
            fecha: row.created_at,
            descripcion: row.descripcion,
            creadoPor: row.created_by_email,
          });
          byExpediente.set(row.expediente_id, list);
        }
        for (const exp of base) {
          exp.bitacora = byExpediente.get(exp.id) ?? [];
        }
      }

      setExpedientes(base);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar expedientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel('expedientes-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expedientes' }, () => {
        load();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const addExpediente = useCallback(
    async (data: Partial<Expediente>) => {
      const payload = { ...expedienteToPatch(data), created_by_email: userEmail, updated_by_email: userEmail };
      if (!hasConcluidoCol.current) delete payload.concluido;
      const { error: err } = await supabase.from('expedientes').insert(payload);
      if (err) throw err;
      await load();
    },
    [userEmail, load]
  );

  const updateExpediente = useCallback(
    async (id: string, patch: Partial<Expediente>) => {
      // actualizacion optimista para que se sienta instantaneo
      setExpedientes((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
      const payload = expedienteToPatch(patch);
      if (!hasConcluidoCol.current) delete payload.concluido;
      payload.updated_by_email = userEmail;
      const { error: err } = await supabase.from('expedientes').update(payload).eq('id', id);
      if (err) {
        await load();
        throw err;
      }
    },
    [userEmail, load]
  );

  const concluirExpediente = useCallback(
    async (id: string) => {
      if (!hasConcluidoCol.current) {
        setExpedientes((prev) => prev.map((e) => (e.id === id ? { ...e, concluido: true } : e)));
        return;
      }
      await updateExpediente(id, { concluido: true });
    },
    [updateExpediente]
  );

  const eliminarExpediente = useCallback(
    async (id: string) => {
      setExpedientes((prev) => prev.filter((e) => e.id !== id));
      const { error: err } = await supabase.from('expedientes').delete().eq('id', id);
      if (err) {
        await load();
        throw err;
      }
    },
    [load]
  );

  const addActuacion = useCallback(
    async (expedienteId: string, descripcion: string) => {
      // La tabla de bitacora es opcional (ver supabase-migration.sql). Si existe, se
      // guarda ahi y se sincroniza entre dispositivos; si no, se agrega solo en
      // memoria para esta sesion.
      const { error: err } = await supabase.from('actuaciones').insert({
        expediente_id: expedienteId,
        descripcion,
        created_by_email: userEmail,
      });
      if (!err) {
        await load();
        return;
      }
      const actuacion: Actuacion = {
        id: `local-${Date.now()}`,
        expedienteId,
        fecha: new Date().toISOString(),
        descripcion,
        creadoPor: userEmail,
      };
      setExpedientes((prev) =>
        prev.map((e) => (e.id === expedienteId ? { ...e, bitacora: [actuacion, ...e.bitacora] } : e))
      );
    },
    [userEmail, load]
  );

  return {
    expedientes,
    loading,
    error,
    reload: load,
    addExpediente,
    updateExpediente,
    addActuacion,
    concluirExpediente,
    eliminarExpediente,
  };
}
