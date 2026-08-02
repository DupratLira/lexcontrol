import type { Expediente, Materia } from '../types';

// Nombres reales de columnas en la tabla `expedientes` de Supabase
// (confirmados directamente contra la base de datos existente).
export const EXPEDIENTE_COLUMNS = [
  'id', 'materia', 'juzgado', 'numero_expediente', 'actor', 'demandado',
  'id_cliente', 'tipo_juicio', 'exp_fisico', 'estatus', 'proximo_a_realizar',
  'created_at', 'fecha_limite', 'fecha_situacion', 'es_amparo', 'amparo_numero',
  'amparo_juzgado', 'amparo_tipo', 'es_apelacion', 'apelacion_sala',
  'apelacion_toca', 'apelacion_tipo', 'es_escrito_pendiente', 'escrito_tipo',
  'escrito_fecha_limite', 'created_by_email', 'updated_by_email', 'updated_at',
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
  es_amparo: boolean | null;
  amparo_numero: string | null;
  amparo_juzgado: string | null;
  amparo_tipo: string | null;
  es_apelacion: boolean | null;
  apelacion_sala: string | null;
  apelacion_toca: string | null;
  apelacion_tipo: string | null;
  es_escrito_pendiente: boolean | null;
  escrito_tipo: string | null;
  escrito_fecha_limite: string | null;
  created_by_email: string | null;
  updated_by_email: string | null;
  updated_at: string;
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

    enAmparo: !!row.es_amparo,
    amparoNumero: row.amparo_numero,
    amparoJuzgado: row.amparo_juzgado,
    tipoAmparo: row.amparo_tipo,

    enApelacion: !!row.es_apelacion,
    apelacionSala: row.apelacion_sala,
    apelacionToca: row.apelacion_toca,
    apelacionTipo: row.apelacion_tipo,

    concluido: !!row.concluido,

    creadoPor: row.created_by_email,
    actualizadoPor: row.updated_by_email,
    creadoEn: row.created_at,
    actualizadoEn: row.updated_at,

    bitacora: [],
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
  es_amparo?: boolean;
  amparo_numero?: string | null;
  amparo_juzgado?: string | null;
  amparo_tipo?: string | null;
  es_apelacion?: boolean;
  apelacion_sala?: string | null;
  apelacion_toca?: string | null;
  apelacion_tipo?: string | null;
  es_escrito_pendiente?: boolean;
  escrito_tipo?: string | null;
  escrito_fecha_limite?: string | null;
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
  if (patch.enAmparo !== undefined) out.es_amparo = patch.enAmparo;
  if (patch.amparoNumero !== undefined) out.amparo_numero = patch.amparoNumero;
  if (patch.amparoJuzgado !== undefined) out.amparo_juzgado = patch.amparoJuzgado;
  if (patch.tipoAmparo !== undefined) out.amparo_tipo = patch.tipoAmparo;
  if (patch.enApelacion !== undefined) out.es_apelacion = patch.enApelacion;
  if (patch.apelacionSala !== undefined) out.apelacion_sala = patch.apelacionSala;
  if (patch.apelacionToca !== undefined) out.apelacion_toca = patch.apelacionToca;
  if (patch.apelacionTipo !== undefined) out.apelacion_tipo = patch.apelacionTipo;
  if (patch.escritoPendiente !== undefined) out.es_escrito_pendiente = patch.escritoPendiente;
  if (patch.escritoTipo !== undefined) out.escrito_tipo = patch.escritoTipo;
  if (patch.escritoFechaLimite !== undefined) out.escrito_fecha_limite = patch.escritoFechaLimite;
  if (patch.concluido !== undefined) out.concluido = patch.concluido;
  return out;
}
