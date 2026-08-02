import JSZip from 'jszip';
import type { Expediente } from '../types';

function csvEscape(v: string): string {
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return '"' + v.replace(/"/g, '""') + '"';
  }
  return v;
}

export function expedientesToCsv(expedientes: Expediente[]): string {
  const headers = [
    'Materia', 'Numero', 'Juzgado', 'Ciudad', 'Tipo de Juicio', 'Actor', 'Demandado',
    'Cliente', 'Situacion Actual', 'Proximo a Realizar', 'Fecha Limite',
    'Escrito Pendiente', 'En Amparo', 'Tipo Amparo', 'En Apelacion', 'Concluido',
  ];
  const rows = expedientes.map((e) => [
    e.materia, e.numero, e.juzgado, e.ciudad, e.tipoJuicio, e.actor, e.demandado,
    e.cliente, e.situacionActual, e.proximoARealizar, e.fechaLimite ?? '',
    e.escritoPendiente ? 'Si' : 'No', e.enAmparo ? 'Si' : 'No', e.tipoAmparo ?? '',
    e.enApelacion ? 'Si' : 'No', e.concluido ? 'Si' : 'No',
  ]);
  const lines = [headers, ...rows].map((r) => r.map((c) => csvEscape(String(c))).join(','));
  return '﻿' + lines.join('\n');
}

export async function downloadExpedientesZip(expedientes: Expediente[]) {
  const zip = new JSZip();
  zip.file('expedientes.csv', expedientesToCsv(expedientes));
  zip.file('expedientes.json', JSON.stringify(expedientes, null, 2));
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const fecha = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `lexcontrol-expedientes-${fecha}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
