export type Materia = 'Civil' | 'Familiar' | 'Laboral' | 'Administrativa' | 'Conciliaciones Laborales';

export interface Actuacion {
  id: string;
  expedienteId: string;
  fecha: string; // ISO
  descripcion: string;
  creadoPor?: string | null;
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

  enAmparo: boolean;
  amparoNumero: string | null;
  amparoJuzgado: string | null;
  tipoAmparo: string | null;

  enApelacion: boolean;
  apelacionSala: string | null;
  apelacionToca: string | null;
  apelacionTipo: string | null;

  tieneAudiencia: boolean;
  audienciaFecha: string | null;
  audienciaHora: string | null;

  concluido: boolean;

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
