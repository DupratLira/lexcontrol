import type { Expediente, Materia } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

export function isVencimientoUrgente(exp: Expediente): boolean {
  if (!exp.fechaLimite || exp.concluido) return false;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const limite = new Date(exp.fechaLimite + 'T00:00:00');
  const diffDias = (limite.getTime() - hoy.getTime()) / DAY_MS;
  return diffDias >= 0 && diffDias <= 4;
}

export function isCongelado(exp: Expediente): boolean {
  if (exp.concluido) return false;
  const fechas = exp.bitacora.map((a) => a.fecha);
  fechas.push(exp.creadoEn);
  if (exp.actualizadoEn) fechas.push(exp.actualizadoEn);
  const ultimaActividad = fechas.reduce((max, f) => (f > max ? f : max), fechas[0]);
  const dias = (Date.now() - new Date(ultimaActividad).getTime()) / DAY_MS;
  return dias > 30;
}

export interface DashboardStats {
  total: number;
  amparos: number;
  apelaciones: number;
  escritos: number;
  urgentes: number;
  congelados: number;
  porMateria: Record<Materia, number>;
}

export function computeStats(expedientes: Expediente[]): DashboardStats {
  const activos = expedientes.filter((e) => !e.concluido);
  const porMateria: Record<Materia, number> = {
    Civil: 0,
    Familiar: 0,
    Laboral: 0,
    Administrativa: 0,
    'Conciliaciones Laborales': 0,
  };
  for (const e of activos) porMateria[e.materia]++;

  return {
    total: activos.length,
    amparos: activos.filter((e) => e.amparos.length > 0).length,
    apelaciones: activos.filter((e) => e.apelaciones.length > 0).length,
    escritos: activos.filter((e) => e.escritoPendiente).length,
    urgentes: activos.filter(isVencimientoUrgente).length,
    congelados: activos.filter(isCongelado).length,
    porMateria,
  };
}
