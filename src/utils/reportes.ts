import type { Expediente, Materia } from '../types';

export interface FilaReporte {
  mes: string;
  etiqueta: string;
  nuevos: number;
  concluidos: number;
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function claveMes(iso: string): string {
  return iso.slice(0, 7);
}

function etiquetaMes(clave: string): string {
  const [anio, mes] = clave.split('-');
  return `${MESES[Number(mes) - 1]} ${anio}`;
}

export function calcularReporteMensual(expedientes: Expediente[], materia: Materia | 'todas'): FilaReporte[] {
  const filtrados = materia === 'todas' ? expedientes : expedientes.filter((e) => e.materia === materia);
  const porMes = new Map<string, { nuevos: number; concluidos: number }>();

  for (const e of filtrados) {
    if (!e.creadoEn) continue;
    const clave = claveMes(e.creadoEn);
    const actual = porMes.get(clave) ?? { nuevos: 0, concluidos: 0 };
    actual.nuevos += 1;
    porMes.set(clave, actual);
  }

  for (const e of filtrados) {
    if (!e.concluido || !e.concluidoEn) continue;
    const clave = claveMes(e.concluidoEn);
    const actual = porMes.get(clave) ?? { nuevos: 0, concluidos: 0 };
    actual.concluidos += 1;
    porMes.set(clave, actual);
  }

  return Array.from(porMes.entries())
    .map(([mes, v]) => ({ mes, etiqueta: etiquetaMes(mes), ...v }))
    .sort((a, b) => (a.mes < b.mes ? 1 : -1));
}

function csvEscape(v: string): string {
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return '"' + v.replace(/"/g, '""') + '"';
  }
  return v;
}

export function reporteToCsv(filas: FilaReporte[], materiaLabel: string): string {
  const headers = ['Mes', 'Nuevos', 'Concluidos'];
  const rows = filas.map((f) => [f.etiqueta, String(f.nuevos), String(f.concluidos)]);
  const lines = [[`Reporte mensual - ${materiaLabel}`], headers, ...rows].map((r) =>
    r.map((c) => csvEscape(c)).join(',')
  );
  return '﻿' + lines.join('\n');
}
