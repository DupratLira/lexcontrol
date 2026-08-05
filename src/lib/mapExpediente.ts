import type { Amparo, Apelacion, Expediente, Materia, TipoAmparo } from '../types';

// Nombres reales de columnas en la tabla `expedientes` de Supabase
// (confirmados directamente contra la base de datos existente).
// Nota: Amparo y Apelacion viven en sus propias tablas (una fila por cada
// uno, permitiendo varios por expediente) y se adjuntan aparte, igual que
// la bitacora de actuaciones.
export const EXPEDIENTE_COLUMNS = [
  'id', 'materia', 'juzgado', 'numero_expediente', 'actor', 'demandado',
  'id_cliente', 'tipo_juicio', 'exp_fisico', 'estatus', 'proximo_a_realizar',
  'created_at', 'fecha_limite', 'fecha_situacion', 'es_escrito_pendiente',
  'escrito_tipo', 'escrito_fecha_limite', 'created_by_email', 'updated_by_email',
  'updated_at', 'es_audiencia', 'audiencia_fecha', 'audiencia_hora',
].join(',');

// La columna `concluido` es opcional: solo existe si se corrió la migración
// incluida en supabase-migration.sql. La pedimos aparte y toleramos que falte.
export const EXPEDIENTE_COLUMNS_WITH_CONCLUIDO = EXPEDIENTE_COLUMNS + ',concluido';

export interface ExpedienteRow {
  id: string;
  materia: string;
  juzgado: string | null;
  numero_expediente: string | null;
  actor: string | null;
  demandado: string | null;
  id_cliente: string | null;
  tipo_juicio: string | null;
  exp_fisico: boolean | null;
  estatus: string | null;
  proximo_a_realizar: string | null;
  created_at: string;
  fecha_limite: string | null;
  fecha_situacion: string | null;
  es_escrito_pendiente: boolean | null;
  escrito_tipo: string | null;
  escrito_fecha_limite: string | null;
  created_by_email: string | null;
  updated_by_email: string | null;
  updated_at: string;
  es_audiencia: boolean | null;
  audiencia_fecha: string | null;
  audiencia_hora: string | null;
  concluido?: boolean | null;
}

export function rowToExpediente(row: ExpedienteRow): Expediente {
  return {
    id: row.id,
    materia: (row.materia as Materia) || 'Civil',
    numero: row.numero_expediente ?? '',
    juzgado: row.juzgado ?? '',
    ciudad: 'CDMX',
    tipoJuicio: row.tipo_juicio ?? '',
    actor: row.actor ?? '',
    demandado: row.demandado ?? '',
    cliente: row.id_cliente ?? 'Despacho',
    expFisico: !!row.exp_fisico,

    situacionActual: row.estatus ?? '',
    fechaSituacion: row.fecha_situacion,
    proximoARealizar: row.proximo_a_realizar ?? '',
    fechaLimite: row.fecha_limite,

    escritoPendiente: !!row.es_escrito_pendiente,
    escritoTipo: row.escrito_tipo,
    escritoFechaLimite: row.escrito_fecha_limite,

    amparos: [],
    apelaciones: [],

    tieneAudiencia: !!row.es_audiencia,
    audienciaFecha: row.audiencia_fecha,
    audienciaHora: row.audiencia_hora,

    concluido: !!row.concluido,

    creadoPor: row.created_by_email,
    actualizadoPor: row.updated_by_email,
    creadoEn: row.created_at,
    actualizadoEn: row.updated_at,

    bitacora: [],
  };
}

export interface AmparoRow {
  id: string;
  expediente_id: string;
  numero: string | null;
  juzgado: string | null;
  tipo: string | null;
  created_at: string;
}

export function rowToAmparo(row: AmparoRow): Amparo {
  return {
    id: row.id,
    expedienteId: row.expediente_id,
    numero: row.numero,
    juzgado: row.juzgado,
    tipo: (row.tipo as TipoAmparo) || null,
    creadoEn: row.created_at,
  };
}

export interface ApelacionRow {
  id: string;
  expediente_id: string;
  sala: string | null;
  toca: string | null;
  tipo: string | null;
  created_at: string;
}

export function rowToApelacion(row: ApelacionRow): Apelacion {
  return {
    id: row.id,
    expedienteId: row.expediente_id,
    sala: row.sala,
    toca: row.toca,
    tipo: row.tipo,
    creadoEn: row.created_at,
  };
}

export interface ExpedienteWritePayload {
  materia?: string;
  juzgado?: string;
  numero_expediente?: string;
  actor?: string;
  demandado?: string;
  id_cliente?: string;
  tipo_juicio?: string;
  exp_fisico?: boolean;
  estatus?: string;
  proximo_a_realizar?: string;
  fecha_limite?: string | null;
  fecha_situacion?: string | null;
  es_escrito_pendiente?: boolean;
  escrito_tipo?: string | null;
  escrito_fecha_limite?: string | null;
  es_audiencia?: boolean;
  audiencia_fecha?: string | null;
  audiencia_hora?: string | null;
  updated_by_email?: string | null;
  created_by_email?: string | null;
  concluido?: boolean;
}

export function expedienteToPatch(patch: Partial<Expediente>): ExpedienteWritePayload {
  const out: ExpedienteWritePayload = {};
  if (patch.materia !== undefined) out.materia = patch.materia;
  if (patch.juzgado !== undefined) out.juzgado = patch.juzgado;
  if (patch.numero !== undefined) out.numero_expediente = patch.numero;
  if (patch.actor !== undefined) out.actor = patch.actor;
  if (patch.demandado !== undefined) out.demandado = patch.demandado;
  if (patch.cliente !== undefined) out.id_cliente = patch.cliente;
  if (patch.tipoJuicio !== undefined) out.tipo_juicio = patch.tipoJuicio;
  if (patch.expFisico !== undefined) out.exp_fisico = patch.expFisico;
  if (patch.situacionActual !== undefined) out.estatus = patch.situacionActual;
  if (patch.proximoARealizar !== undefined) out.proximo_a_realizar = patch.proximoARealizar;
  if (patch.fechaLimite !== undefined) out.fecha_limite = patch.fechaLimite;
  if (patch.fechaSituacion !== undefined) out.fecha_situacion = patch.fechaSituacion;
  if (patch.escritoPendiente !== undefined) out.es_escrito_pendiente = patch.escritoPendiente;
  if (patch.escritoTipo !== undefined) out.escrito_tipo = patch.escritoTipo;
  if (patch.escritoFechaLimite !== undefined) out.escrito_fecha_limite = patch.escritoFechaLimite;
  if (patch.tieneAudiencia !== undefined) out.es_audiencia = patch.tieneAudiencia;
  if (patch.audienciaFecha !== undefined) out.audiencia_fecha = patch.audienciaFecha;
  if (patch.audienciaHora !== undefined) out.audiencia_hora = patch.audienciaHora;
  if (patch.concluido !== undefined) out.concluido = patch.concluido;
  return out;
}
