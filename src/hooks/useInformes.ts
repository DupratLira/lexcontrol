import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// Modulo "Informes clientes". Tablas: clientes, expedientes (cliente_id,
// posicion_cliente, carpeta_drive_url, resumen_cliente), expedientes_interno
// (solo staff: estrategia, riesgo, monto), informes, informe_expedientes.

export type NivelRiesgo = 'bajo' | 'medio' | 'alto' | 'critico';
export type TipoInforme = 'cliente' | 'interno';
export type EstadoInforme = 'borrador' | 'revisado' | 'enviado';

export interface Cliente {
  id: number;
  nombre: string;
  rfc: string | null;
  contacto: string | null;
  notasInternas: string | null;
  estrategiaGeneral: string | null;
}

export interface ActuacionInforme {
  id: string;
  fecha: string;
  descripcion: string;
  visibleCliente: boolean;
}

export interface ExpedienteInforme {
  id: number;
  materia: string;
  juzgado: string;
  numero: string;
  tipoJuicio: string;
  actor: string;
  demandado: string;
  estatus: string;
  proximo: string;
  fechaLimite: string | null;
  audienciaFecha: string | null;
  audienciaHora: string | null;
  concluido: boolean;
  posicionCliente: string | null;
  carpetaDriveUrl: string | null;
  resumenCliente: string | null;
  // internos
  estrategiaInterna: string | null;
  nivelRiesgo: NivelRiesgo | null;
  montoRiesgo: number | null;
  actuaciones: ActuacionInforme[];
}

export interface Informe {
  id: number;
  clienteId: number;
  tipo: TipoInforme;
  periodoInicio: string | null;
  periodoFin: string | null;
  titulo: string;
  contenido: string;
  estado: EstadoInforme;
  creadoPor: string | null;
  creadoEn: string;
  enviadoEn: string | null;
}

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('clientes')
      .select('id, nombre, rfc, contacto, notas_internas, estrategia_general')
      .order('nombre')
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        setClientes(
          (data ?? []).map((r) => ({
            id: r.id,
            nombre: r.nombre,
            rfc: r.rfc,
            contacto: r.contacto,
            notasInternas: r.notas_internas,
            estrategiaGeneral: r.estrategia_general,
          }))
        );
      });
  }, []);

  return { clientes, error };
}

export function useInformesCliente(clienteId: number | null, userEmail: string) {
  const [expedientes, setExpedientes] = useState<ExpedienteInforme[]>([]);
  const [informes, setInformes] = useState<Informe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!clienteId) {
      setExpedientes([]);
      setInformes([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: exps, error: e1 } = await supabase
        .from('expedientes')
        .select(
          'id, materia, juzgado, numero_expediente, tipo_juicio, actor, demandado, estatus, proximo_a_realizar, fecha_limite, audiencia_fecha, audiencia_hora, concluido, posicion_cliente, carpeta_drive_url, resumen_cliente'
        )
        .eq('cliente_id', clienteId)
        .order('concluido')
        .order('fecha_limite', { ascending: true, nullsFirst: false });
      if (e1) throw e1;
      const ids = (exps ?? []).map((e) => e.id);

      const [{ data: internos }, { data: acts }, { data: infs, error: e3 }] = await Promise.all([
        ids.length
          ? supabase.from('expedientes_interno').select('expediente_id, estrategia_interna, nivel_riesgo, monto_riesgo').in('expediente_id', ids)
          : Promise.resolve({ data: [] as never[] }),
        ids.length
          ? supabase
              .from('actuaciones')
              .select('id, expediente_id, descripcion, created_at, visible_cliente')
              .in('expediente_id', ids)
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [] as never[] }),
        supabase
          .from('informes')
          .select('id, cliente_id, tipo, periodo_inicio, periodo_fin, titulo, contenido, estado, created_by_email, created_at, enviado_en')
          .eq('cliente_id', clienteId)
          .order('created_at', { ascending: false }),
      ]);
      if (e3) throw e3;

      const intMap = new Map<number, { estrategia_interna: string | null; nivel_riesgo: NivelRiesgo | null; monto_riesgo: number | null }>();
      for (const r of (internos ?? []) as Array<{ expediente_id: number; estrategia_interna: string | null; nivel_riesgo: NivelRiesgo | null; monto_riesgo: number | null }>) {
        intMap.set(r.expediente_id, r);
      }
      const actMap = new Map<number, ActuacionInforme[]>();
      for (const a of (acts ?? []) as Array<{ id: string; expediente_id: number; descripcion: string; created_at: string; visible_cliente: boolean }>) {
        const list = actMap.get(a.expediente_id) ?? [];
        list.push({ id: a.id, fecha: a.created_at.slice(0, 10), descripcion: a.descripcion, visibleCliente: a.visible_cliente });
        actMap.set(a.expediente_id, list);
      }

      setExpedientes(
        (exps ?? []).map((e) => {
          const i = intMap.get(e.id);
          return {
            id: e.id,
            materia: e.materia ?? '',
            juzgado: e.juzgado ?? '',
            numero: e.numero_expediente ?? '',
            tipoJuicio: e.tipo_juicio ?? '',
            actor: e.actor ?? '',
            demandado: e.demandado ?? '',
            estatus: e.estatus ?? '',
            proximo: e.proximo_a_realizar ?? '',
            fechaLimite: e.fecha_limite,
            audienciaFecha: e.audiencia_fecha,
            audienciaHora: e.audiencia_hora,
            concluido: !!e.concluido,
            posicionCliente: e.posicion_cliente,
            carpetaDriveUrl: e.carpeta_drive_url,
            resumenCliente: e.resumen_cliente,
            estrategiaInterna: i?.estrategia_interna ?? null,
            nivelRiesgo: i?.nivel_riesgo ?? null,
            montoRiesgo: i?.monto_riesgo != null ? Number(i.monto_riesgo) : null,
            actuaciones: actMap.get(e.id) ?? [],
          };
        })
      );

      setInformes(
        (infs ?? []).map((r) => ({
          id: r.id,
          clienteId: r.cliente_id,
          tipo: r.tipo,
          periodoInicio: r.periodo_inicio,
          periodoFin: r.periodo_fin,
          titulo: r.titulo,
          contenido: r.contenido ?? '',
          estado: r.estado,
          creadoPor: r.created_by_email,
          creadoEn: r.created_at,
          enviadoEn: r.enviado_en,
        }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => {
    load();
  }, [load]);

  const guardarDatosExpediente = useCallback(
    async (
      id: number,
      datos: { resumenCliente: string | null; estrategiaInterna: string | null; nivelRiesgo: NivelRiesgo | null; montoRiesgo: number | null }
    ) => {
      const { error: e1 } = await supabase
        .from('expedientes')
        .update({ resumen_cliente: datos.resumenCliente, updated_by_email: userEmail, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from('expedientes_interno').upsert({
        expediente_id: id,
        estrategia_interna: datos.estrategiaInterna,
        nivel_riesgo: datos.nivelRiesgo,
        monto_riesgo: datos.montoRiesgo,
        updated_at: new Date().toISOString(),
      });
      if (e2) throw e2;
      await load();
    },
    [userEmail, load]
  );

  const guardarInforme = useCallback(
    async (
      inf: Omit<Informe, 'id' | 'creadoPor' | 'creadoEn' | 'enviadoEn'> & { id?: number },
      expedienteIds: number[]
    ): Promise<number> => {
      const payload = {
        cliente_id: inf.clienteId,
        tipo: inf.tipo,
        periodo_inicio: inf.periodoInicio,
        periodo_fin: inf.periodoFin,
        titulo: inf.titulo,
        contenido: inf.contenido,
        estado: inf.estado,
        enviado_en: inf.estado === 'enviado' ? new Date().toISOString() : null,
      };
      let id = inf.id;
      if (id) {
        const { error: err } = await supabase.from('informes').update(payload).eq('id', id);
        if (err) throw err;
      } else {
        const { data, error: err } = await supabase
          .from('informes')
          .insert({ ...payload, created_by_email: userEmail })
          .select('id')
          .single();
        if (err) throw err;
        id = data.id as number;
        if (expedienteIds.length) {
          const snap = expedientes
            .filter((e) => expedienteIds.includes(e.id))
            .map((e) => ({ informe_id: id, expediente_id: e.id, estado_snapshot: e.resumenCliente || e.estatus }));
          await supabase.from('informe_expedientes').insert(snap);
        }
      }
      await load();
      return id!;
    },
    [userEmail, expedientes, load]
  );

  const cambiarVisibilidadActuacion = useCallback(
    async (actuacionId: string, visible: boolean) => {
      setExpedientes((prev) =>
        prev.map((e) => ({ ...e, actuaciones: e.actuaciones.map((a) => (a.id === actuacionId ? { ...a, visibleCliente: visible } : a)) }))
      );
      const { error: err } = await supabase.from('actuaciones').update({ visible_cliente: visible }).eq('id', actuacionId);
      if (err) {
        await load();
        throw err;
      }
    },
    [load]
  );

  const eliminarInforme = useCallback(
    async (id: number) => {
      const { error: err } = await supabase.from('informes').delete().eq('id', id);
      if (err) throw err;
      await load();
    },
    [load]
  );

  return { expedientes, informes, loading, error, reload: load, guardarDatosExpediente, guardarInforme, eliminarInforme, cambiarVisibilidadActuacion };
}
