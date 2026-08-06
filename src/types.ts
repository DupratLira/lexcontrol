export type Materia = 'Civil' | 'Familiar' | 'Laboral' | 'Administrativa' | 'Conciliaciones Laborales';

export interface Actuacion {
  id: string;
  expedienteId: string;
  fecha: string; // ISO
  descripcion: string;
  creadoPor?: string | null;
}

export type TipoAmparo = 'Directo' | 'Indirecto' | 'Queja' | 'Revision' | 'Inconformidad';

// Motivo por el que se concluyo un expediente. 'Juicio' aplica a Conciliaciones
// Laborales cuando no hubo conciliacion y el asunto paso a juicio.
export type MotivoConclusion =
  | 'Favorable'
  | 'Desfavorable'
  | 'Convenio'
  | 'Revocacion'
  | 'Abandono'
  | 'Juicio'
  | 'Otro';

export const MOTIVOS_CONCLUSION: MotivoConclusion[] = [
  'Favorable', 'Desfavorable', 'Convenio', 'Revocacion', 'Abandono', 'Juicio', 'Otro',
];

export const ETIQUETAS_MOTIVO: Record<MotivoConclusion, string> = {
  Favorable: 'Favorable',
  Desfavorable: 'Desfavorable',
  Convenio: 'Convenio / Conciliación',
  Revocacion: 'Revocación del cliente',
  Abandono: 'Cliente abandonó el proceso',
  Juicio: 'Se fue a juicio (sin conciliar)',
  Otro: 'Otro',
};

export interface Amparo {
  id: string;
  expedienteId: string;
  numero: string | null;
  juzgado: string | null;
  tipo: TipoAmparo | null;
  creadoEn: string;
}

export interface Apelacion {
  id: string;
  expedienteId: string;
  sala: string | null;
  toca: string | null;
  tipo: string | null;
  creadoEn: string;
}

export interface Expediente {
  id: string;
  materia: Materia;
  numero: string;
  juzgado: string;
  ciudad: string; // no viene de la BD, es constante (CDMX)
  tipoJuicio: string;
  actor: string;
  demandado: string;
  cliente: string;
  expFisico: boolean;

  situacionActual: string;
  fechaSituacion: string | null;
  proximoARealizar: string;
  fechaLimite: string | null;

  escritoPendiente: boolean;
  escritoTipo: string | null;
  escritoFechaLimite: string | null;

  amparos: Amparo[];
  apelaciones: Apelacion[];

  tieneAudiencia: boolean;
  audienciaFecha: string | null;
  audienciaHora: string | null;

  concluido: boolean;
  concluidoEn: string | null;
  motivoConclusion: MotivoConclusion | null;
  motivoNota: string | null;
  montoConciliacion: number | null;

  creadoPor: string | null;
  actualizadoPor: string | null;
  creadoEn: string;
  actualizadoEn: string;

  bitacora: Actuacion[];
}

export const MATERIAS: Materia[] = ['Civil', 'Familiar', 'Laboral', 'Administrativa', 'Conciliaciones Laborales'];

export type ViewMode = 'lista' | 'detalle';
export type TabMode = 'tabla' | 'calendario' | 'escritos' | 'audiencias';

export type QuickFilter = 'todas' | 'amparos' | 'apelaciones' | 'escritos' | 'urgentes' | 'congelados';
