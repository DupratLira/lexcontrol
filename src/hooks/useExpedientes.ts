import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  EXPEDIENTE_COLUMNS_WITH_CONCLUIDO,
  expedienteToPatch,
  rowToExpediente,
  rowToAmparo,
  rowToApelacion,
  type ExpedienteRow,
  type AmparoRow,
  type ApelacionRow,
} from '../lib/mapExpediente';
import type { Actuacion, Amparo, Apelacion, Expediente, TipoAmparo } from '../types';

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
    .select(EXPEDIENTE_COLUMNS_WITH_CONCLUIDO.replace(',concluido,concluido_en', ''))
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

      const { data: amparoRows, error: amparoErr } = await supabase
        .from('amparos')
        .select('id, expediente_id, numero, juzgado, tipo, created_at')
        .order('created_at', { ascending: false });

      if (!amparoErr && amparoRows) {
        const byExpediente = new Map<string, Amparo[]>();
        for (const row of amparoRows as AmparoRow[]) {
          const list = byExpediente.get(row.expediente_id) ?? [];
          list.push(rowToAmparo(row));
          byExpediente.set(row.expediente_id, list);
        }
        for (const exp of base) {
          exp.amparos = byExpediente.get(exp.id) ?? [];
        }
      }

      const { data: apelacionRows, error: apelacionErr } = await supabase
        .from('apelaciones')
        .select('id, expediente_id, sala, toca, tipo, created_at')
        .order('created_at', { ascending: false });

      if (!apelacionErr && apelacionRows) {
        const byExpediente = new Map<string, Apelacion[]>();
        for (const row of apelacionRows as ApelacionRow[]) {
          const list = byExpediente.get(row.expediente_id) ?? [];
          list.push(rowToApelacion(row));
          byExpediente.set(row.expediente_id, list);
        }
        for (const exp of base) {
          exp.apelaciones = byExpediente.get(exp.id) ?? [];
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'amparos' }, () => {
        load();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'apelaciones' }, () => {
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
      await updateExpediente(id, { concluido: true, concluidoEn: new Date().toISOString() });
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

  const addAmparo = useCallback(
    async (expedienteId: string, datos: { numero: string; juzgado: string; tipo: TipoAmparo }) => {
      const { error: err } = await supabase.from('amparos').insert({
        expediente_id: expedienteId,
        numero: datos.numero || null,
        juzgado: datos.juzgado || null,
        tipo: datos.tipo,
        created_by_email: userEmail,
      });
      if (err) throw err;
      await load();
    },
    [userEmail, load]
  );

  const eliminarAmparo = useCallback(
    async (amparoId: string) => {
      const { error: err } = await supabase.from('amparos').delete().eq('id', amparoId);
      if (err) throw err;
      await load();
    },
    [load]
  );

  const addApelacion = useCallback(
    async (expedienteId: string, datos: { sala: string; toca: string; tipo: string }) => {
      const { error: err } = await supabase.from('apelaciones').insert({
        expediente_id: expedienteId,
        sala: datos.sala || null,
        toca: datos.toca || null,
        tipo: datos.tipo || null,
        created_by_email: userEmail,
      });
      if (err) throw err;
      await load();
    },
    [userEmail, load]
  );

  const eliminarApelacion = useCallback(
    async (apelacionId: string) => {
      const { error: err } = await supabase.from('apelaciones').delete().eq('id', apelacionId);
      if (err) throw err;
      await load();
    },
    [load]
  );

  return {
    expedientes,
    loading,
    error,
    reload: load,
    addExpediente,
    updateExpediente,
    addActuacion,
    addAmparo,
    eliminarAmparo,
    addApelacion,
    eliminarApelacion,
    concluirExpediente,
    eliminarExpediente,
  };
}
