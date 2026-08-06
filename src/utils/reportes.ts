import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Expediente, Materia, MotivoConclusion } from '../types';
import { ETIQUETAS_MOTIVO, MOTIVOS_CONCLUSION } from '../types';

export interface FilaReporte {
  mes: string;
  etiqueta: string;
  nuevos: number;
  concluidos: number;
}

export interface FilaMotivo {
  motivo: MotivoConclusion;
  etiqueta: string;
  cantidad: number;
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

function filtrarPorMateria(expedientes: Expediente[], materia: Materia | 'todas'): Expediente[] {
  return materia === 'todas' ? expedientes : expedientes.filter((e) => e.materia === materia);
}

export function calcularReporteMensual(
  expedientes: Expediente[],
  materia: Materia | 'todas',
  motivo: MotivoConclusion | 'todos' = 'todos'
): FilaReporte[] {
  const base = filtrarPorMateria(expedientes, materia);
  const porMes = new Map<string, { nuevos: number; concluidos: number }>();

  for (const e of base) {
    if (!e.creadoEn) continue;
    const clave = claveMes(e.creadoEn);
    const actual = porMes.get(clave) ?? { nuevos: 0, concluidos: 0 };
    actual.nuevos += 1;
    porMes.set(clave, actual);
  }

  for (const e of base) {
    if (!e.concluido || !e.concluidoEn) continue;
    if (motivo !== 'todos' && e.motivoConclusion !== motivo) continue;
    const clave = claveMes(e.concluidoEn);
    const actual = porMes.get(clave) ?? { nuevos: 0, concluidos: 0 };
    actual.concluidos += 1;
    porMes.set(clave, actual);
  }

  return Array.from(porMes.entries())
    .map(([mes, v]) => ({ mes, etiqueta: etiquetaMes(mes), ...v }))
    .sort((a, b) => (a.mes < b.mes ? 1 : -1));
}

export function calcularDesglosePorMotivo(expedientes: Expediente[], materia: Materia | 'todas'): FilaMotivo[] {
  const base = filtrarPorMateria(expedientes, materia).filter((e) => e.concluido && e.motivoConclusion);
  const conteos = new Map<MotivoConclusion, number>();
  for (const e of base) {
    const m = e.motivoConclusion as MotivoConclusion;
    conteos.set(m, (conteos.get(m) ?? 0) + 1);
  }
  return MOTIVOS_CONCLUSION.map((m) => ({ motivo: m, etiqueta: ETIQUETAS_MOTIVO[m], cantidad: conteos.get(m) ?? 0 })).filter(
    (f) => f.cantidad > 0
  );
}

export function calcularMontoConciliado(
  expedientes: Expediente[],
  materia: Materia | 'todas',
  motivo: MotivoConclusion | 'todos'
): number {
  const base = filtrarPorMateria(expedientes, materia);
  return base
    .filter((e) => e.concluido && (motivo === 'todos' || e.motivoConclusion === motivo))
    .reduce((sum, e) => sum + (e.montoConciliacion ?? 0), 0);
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
  const lines = [[`Reporte mensual - ${materiaLabel}`], headers, ...rows].map((r) => r.map((c) => csvEscape(c)).join(','));
  return '﻿' + lines.join('\n');
}

function xmlEscape(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function celda(valor: string | number, tipo: 'String' | 'Number' = 'String'): string {
  return `<Cell><Data ss:Type="${tipo}">${typeof valor === 'string' ? xmlEscape(valor) : valor}</Data></Cell>`;
}

function fila(celdas: string): string {
  return `<Row>${celdas}</Row>`;
}

// Genera un archivo .xls en formato SpreadsheetML (XML nativo de Excel), sin
// depender de librerias de terceros con vulnerabilidades conocidas (SheetJS/xlsx).
export function reporteToExcelXml(
  filas: FilaReporte[],
  desglose: FilaMotivo[],
  montoConciliado: number,
  materiaLabel: string,
  motivoLabel: string
): string {
  const filasHtml: string[] = [];
  filasHtml.push(fila(celda(`Reporte mensual de expedientes — ${materiaLabel} — ${motivoLabel}`)));
  filasHtml.push(fila(''));
  filasHtml.push(fila(celda('Mes') + celda('Nuevos') + celda('Concluidos')));
  for (const f of filas) {
    filasHtml.push(fila(celda(f.etiqueta) + celda(f.nuevos, 'Number') + celda(f.concluidos, 'Number')));
  }
  filasHtml.push(fila(''));
  filasHtml.push(fila(celda('Concluidos por motivo')));
  filasHtml.push(fila(celda('Motivo') + celda('Cantidad')));
  for (const f of desglose) {
    filasHtml.push(fila(celda(f.etiqueta) + celda(f.cantidad, 'Number')));
  }
  if (montoConciliado > 0) {
    filasHtml.push(fila(''));
    filasHtml.push(fila(celda('Monto total conciliado') + celda(montoConciliado, 'Number')));
  }

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Reporte mensual">
  <Table>
${filasHtml.join('\n')}
  </Table>
 </Worksheet>
</Workbook>`;
}

export function generarReportePdf(
  filas: FilaReporte[],
  desglose: FilaMotivo[],
  montoConciliado: number,
  materiaLabel: string,
  motivoLabel: string
): jsPDF {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text('Reporte mensual de expedientes', 14, 16);
  doc.setFontSize(10);
  doc.text(`Materia: ${materiaLabel}   ·   Motivo: ${motivoLabel}`, 14, 23);

  autoTable(doc, {
    startY: 28,
    head: [['Mes', 'Nuevos', 'Concluidos']],
    body: filas.map((f) => [f.etiqueta, String(f.nuevos), String(f.concluidos)]),
    headStyles: { fillColor: [15, 30, 60] },
  });

  let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  if (desglose.length > 0) {
    doc.setFontSize(12);
    doc.text('Concluidos por motivo', 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [['Motivo', 'Cantidad']],
      body: desglose.map((f) => [f.etiqueta, String(f.cantidad)]),
      headStyles: { fillColor: [15, 30, 60] },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  if (montoConciliado > 0) {
    doc.setFontSize(11);
    doc.text(
      `Monto total conciliado: $${montoConciliado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      14,
      y
    );
  }

  return doc;
}
