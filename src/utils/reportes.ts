import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Expediente, Materia, MotivoConclusion } from '../types';
import { ETIQUETAS_MOTIVO, MOTIVOS_CONCLUSION } from '../types';

export type Periodo =
  | { tipo: 'todo' }
  | { tipo: 'mes'; clave: string }
  | { tipo: 'rango'; desde: string; hasta: string };

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

export interface FilaAlta {
  numero: string;
  materia: Materia;
  actor: string;
  demandado: string;
  cliente: string;
  fecha: string;
}

export interface FilaBaja {
  numero: string;
  materia: Materia;
  actor: string;
  demandado: string;
  motivo: string;
  fecha: string;
  monto: number | null;
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export function claveMes(iso: string): string {
  return iso.slice(0, 7);
}

export function etiquetaMes(clave: string): string {
  const [anio, mes] = clave.split('-');
  return `${MESES[Number(mes) - 1]} ${anio}`;
}

export function claveMesActual(): string {
  return claveMes(new Date().toISOString());
}

function enPeriodo(clave: string, periodo: Periodo): boolean {
  if (periodo.tipo === 'todo') return true;
  if (periodo.tipo === 'mes') return clave === periodo.clave;
  return clave >= periodo.desde && clave <= periodo.hasta;
}

export function etiquetaPeriodo(periodo: Periodo): string {
  if (periodo.tipo === 'todo') return 'Todo el historial';
  if (periodo.tipo === 'mes') return etiquetaMes(periodo.clave);
  return `${etiquetaMes(periodo.desde)} — ${etiquetaMes(periodo.hasta)}`;
}

function filtrarPorMateria(expedientes: Expediente[], materia: Materia | 'todas'): Expediente[] {
  return materia === 'todas' ? expedientes : expedientes.filter((e) => e.materia === materia);
}

const fechaCorta = (iso: string) => new Date(iso).toLocaleDateString('es-MX');

export function calcularReporteMensual(
  expedientes: Expediente[],
  materia: Materia | 'todas',
  motivo: MotivoConclusion | 'todos',
  periodo: Periodo
): FilaReporte[] {
  const base = filtrarPorMateria(expedientes, materia);
  const porMes = new Map<string, { nuevos: number; concluidos: number }>();

  for (const e of base) {
    if (!e.creadoEn) continue;
    const clave = claveMes(e.creadoEn);
    if (!enPeriodo(clave, periodo)) continue;
    const actual = porMes.get(clave) ?? { nuevos: 0, concluidos: 0 };
    actual.nuevos += 1;
    porMes.set(clave, actual);
  }

  for (const e of base) {
    if (!e.concluido || !e.concluidoEn) continue;
    if (motivo !== 'todos' && e.motivoConclusion !== motivo) continue;
    const clave = claveMes(e.concluidoEn);
    if (!enPeriodo(clave, periodo)) continue;
    const actual = porMes.get(clave) ?? { nuevos: 0, concluidos: 0 };
    actual.concluidos += 1;
    porMes.set(clave, actual);
  }

  return Array.from(porMes.entries())
    .map(([mes, v]) => ({ mes, etiqueta: etiquetaMes(mes), ...v }))
    .sort((a, b) => (a.mes < b.mes ? 1 : -1));
}

export function calcularDesglosePorMotivo(
  expedientes: Expediente[],
  materia: Materia | 'todas',
  periodo: Periodo
): FilaMotivo[] {
  const base = filtrarPorMateria(expedientes, materia).filter(
    (e) => e.concluido && e.motivoConclusion && e.concluidoEn && enPeriodo(claveMes(e.concluidoEn), periodo)
  );
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
  motivo: MotivoConclusion | 'todos',
  periodo: Periodo
): number {
  const base = filtrarPorMateria(expedientes, materia);
  return base
    .filter(
      (e) =>
        e.concluido &&
        e.concluidoEn &&
        enPeriodo(claveMes(e.concluidoEn), periodo) &&
        (motivo === 'todos' || e.motivoConclusion === motivo)
    )
    .reduce((sum, e) => sum + (e.montoConciliacion ?? 0), 0);
}

export function obtenerAltas(expedientes: Expediente[], materia: Materia | 'todas', periodo: Periodo): FilaAlta[] {
  return filtrarPorMateria(expedientes, materia)
    .filter((e) => e.creadoEn && enPeriodo(claveMes(e.creadoEn), periodo))
    .map((e) => ({
      numero: e.numero,
      materia: e.materia,
      actor: e.actor,
      demandado: e.demandado,
      cliente: e.cliente,
      fecha: e.creadoEn,
    }))
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
}

export function obtenerBajas(
  expedientes: Expediente[],
  materia: Materia | 'todas',
  motivo: MotivoConclusion | 'todos',
  periodo: Periodo
): FilaBaja[] {
  return filtrarPorMateria(expedientes, materia)
    .filter((e) => e.concluido && e.concluidoEn && enPeriodo(claveMes(e.concluidoEn), periodo))
    .filter((e) => motivo === 'todos' || e.motivoConclusion === motivo)
    .map((e) => ({
      numero: e.numero,
      materia: e.materia,
      actor: e.actor,
      demandado: e.demandado,
      motivo: e.motivoConclusion ? ETIQUETAS_MOTIVO[e.motivoConclusion] : 'Sin especificar',
      fecha: e.concluidoEn as string,
      monto: e.montoConciliacion,
    }))
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
}

// ---------- CSV ----------

function csvEscape(v: string): string {
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return '"' + v.replace(/"/g, '""') + '"';
  }
  return v;
}

function bloqueCsv(titulo: string, headers: string[], rows: string[][]): string[] {
  return [[titulo], headers, ...rows].map((r) => r.map((c) => csvEscape(c)).join(','));
}

export function reporteToCsv(
  filas: FilaReporte[],
  desglose: FilaMotivo[],
  altas: FilaAlta[],
  bajas: FilaBaja[],
  montoConciliado: number,
  materiaLabel: string,
  motivoLabel: string,
  periodoLabel: string
): string {
  const lineas: string[] = [];
  lineas.push(...bloqueCsv(`Reporte — ${periodoLabel} — ${materiaLabel} — ${motivoLabel}`, [], []));
  lineas.push('');
  lineas.push(...bloqueCsv('Resumen mensual', ['Mes', 'Altas', 'Bajas'], filas.map((f) => [f.etiqueta, String(f.nuevos), String(f.concluidos)])));
  lineas.push('');
  if (desglose.length > 0) {
    lineas.push(...bloqueCsv('Bajas por motivo', ['Motivo', 'Cantidad'], desglose.map((f) => [f.etiqueta, String(f.cantidad)])));
    lineas.push('');
  }
  if (montoConciliado > 0) {
    lineas.push(csvEscape('Monto total conciliado') + ',' + montoConciliado.toFixed(2));
    lineas.push('');
  }
  lineas.push(
    ...bloqueCsv(
      'Altas — detalle',
      ['Número', 'Materia', 'Actor', 'Demandado', 'Cliente', 'Fecha'],
      altas.map((a) => [a.numero, a.materia, a.actor, a.demandado, a.cliente, fechaCorta(a.fecha)])
    )
  );
  lineas.push('');
  lineas.push(
    ...bloqueCsv(
      'Bajas — detalle',
      ['Número', 'Materia', 'Actor', 'Demandado', 'Motivo', 'Fecha', 'Monto'],
      bajas.map((b) => [b.numero, b.materia, b.actor, b.demandado, b.motivo, fechaCorta(b.fecha), b.monto ? b.monto.toFixed(2) : ''])
    )
  );
  return '﻿' + lineas.join('\n');
}

// ---------- Excel (SpreadsheetML con estilos, sin depender de librerias vulnerables) ----------

function xmlEscape(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function celda(valor: string | number, estilo?: string, tipo: 'String' | 'Number' = 'String'): string {
  const attrEstilo = estilo ? ` ss:StyleID="${estilo}"` : '';
  return `<Cell${attrEstilo}><Data ss:Type="${tipo}">${typeof valor === 'string' ? xmlEscape(valor) : valor}</Data></Cell>`;
}

function fila(celdas: string): string {
  return `<Row>${celdas}</Row>`;
}

const ESTILOS_XML = `
 <Styles>
  <Style ss:ID="titulo"><Font ss:Bold="1" ss:Size="14" ss:Color="#0E1F3D"/></Style>
  <Style ss:ID="subtitulo"><Font ss:Italic="1" ss:Size="10" ss:Color="#5B6472"/></Style>
  <Style ss:ID="seccion"><Font ss:Bold="1" ss:Size="11" ss:Color="#FFFFFF"/><Interior ss:Color="#B8935A" ss:Pattern="Solid"/></Style>
  <Style ss:ID="encabezado">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0E1F3D" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0A1730"/></Borders>
  </Style>
  <Style ss:ID="celda">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E3E6EB"/></Borders>
  </Style>
  <Style ss:ID="celdaAlt">
   <Interior ss:Color="#F5F2EA" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E3E6EB"/></Borders>
  </Style>
  <Style ss:ID="numero">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E3E6EB"/></Borders>
  </Style>
  <Style ss:ID="numeroAlt">
   <Interior ss:Color="#F5F2EA" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E3E6EB"/></Borders>
  </Style>
  <Style ss:ID="alta"><Interior ss:Color="#E6F4EA" ss:Pattern="Solid"/><Alignment ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E3E6EB"/></Borders></Style>
  <Style ss:ID="baja"><Interior ss:Color="#FCE8E6" ss:Pattern="Solid"/><Alignment ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E3E6EB"/></Borders></Style>
  <Style ss:ID="dinero"><NumberFormat ss:Format="&quot;$&quot;#,##0.00"/><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E3E6EB"/></Borders></Style>
  <Style ss:ID="total"><Font ss:Bold="1" ss:Color="#0E1F3D"/><Interior ss:Color="#DCC399" ss:Pattern="Solid"/><NumberFormat ss:Format="&quot;$&quot;#,##0.00"/><Alignment ss:Horizontal="Right"/></Style>
 </Styles>`;

function columnas(anchos: number[]): string {
  return anchos.map((w) => `<Column ss:Width="${w}"/>`).join('');
}

// Activa los desplegables de filtro de Excel (AutoFilter) sobre el encabezado
// y todas las filas de datos, para poder filtrar/ordenar directo en Excel.
function autoFiltro(filas: number, numColumnas: number): string {
  return `<AutoFilter x:Range="R1C1:R${filas}C${numColumnas}" xmlns="urn:schemas-microsoft-com:office:excel"></AutoFilter>`;
}

function hojaResumen(
  filas: FilaReporte[],
  desglose: FilaMotivo[],
  montoConciliado: number,
  materiaLabel: string,
  motivoLabel: string,
  periodoLabel: string
): string {
  const filasXml: string[] = [];
  filasXml.push(fila(celda('Reporte mensual de expedientes', 'titulo')));
  filasXml.push(fila(celda(`Periodo: ${periodoLabel}   ·   Materia: ${materiaLabel}   ·   Motivo: ${motivoLabel}`, 'subtitulo')));
  filasXml.push(fila(''));
  filasXml.push(fila(celda('RESUMEN POR MES', 'seccion') + celda('', 'seccion') + celda('', 'seccion')));
  filasXml.push(fila(celda('Mes', 'encabezado') + celda('Altas', 'encabezado') + celda('Bajas', 'encabezado')));
  filas.forEach((f, i) => {
    const estiloTexto = i % 2 === 0 ? 'celda' : 'celdaAlt';
    const estiloNum = i % 2 === 0 ? 'numero' : 'numeroAlt';
    filasXml.push(fila(celda(f.etiqueta, estiloTexto) + celda(f.nuevos, estiloNum, 'Number') + celda(f.concluidos, estiloNum, 'Number')));
  });
  const totalAltas = filas.reduce((s, f) => s + f.nuevos, 0);
  const totalBajas = filas.reduce((s, f) => s + f.concluidos, 0);
  filasXml.push(fila(celda('TOTAL', 'total') + celda(totalAltas, 'total', 'Number') + celda(totalBajas, 'total', 'Number')));

  if (desglose.length > 0) {
    filasXml.push(fila(''));
    filasXml.push(fila(celda('BAJAS POR MOTIVO', 'seccion') + celda('', 'seccion')));
    filasXml.push(fila(celda('Motivo', 'encabezado') + celda('Cantidad', 'encabezado')));
    desglose.forEach((f, i) => {
      const estiloTexto = i % 2 === 0 ? 'celda' : 'celdaAlt';
      const estiloNum = i % 2 === 0 ? 'numero' : 'numeroAlt';
      filasXml.push(fila(celda(f.etiqueta, estiloTexto) + celda(f.cantidad, estiloNum, 'Number')));
    });
  }

  if (montoConciliado > 0) {
    filasXml.push(fila(''));
    filasXml.push(fila(celda('Monto total conciliado', 'total') + celda(montoConciliado, 'dinero', 'Number')));
  }

  return `<Worksheet ss:Name="Resumen"><Table>${columnas([220, 120, 120])}${filasXml.join('\n')}</Table></Worksheet>`;
}

function hojaAltas(altas: FilaAlta[]): string {
  const filasXml: string[] = [];
  filasXml.push(
    fila(
      celda('Número', 'encabezado') +
        celda('Materia', 'encabezado') +
        celda('Actor', 'encabezado') +
        celda('Demandado', 'encabezado') +
        celda('Cliente', 'encabezado') +
        celda('Fecha', 'encabezado')
    )
  );
  altas.forEach((a) => {
    filasXml.push(
      fila(
        celda(a.numero, 'alta') +
          celda(a.materia, 'alta') +
          celda(a.actor, 'alta') +
          celda(a.demandado, 'alta') +
          celda(a.cliente, 'alta') +
          celda(fechaCorta(a.fecha), 'alta')
      )
    );
  });
  if (altas.length === 0) filasXml.push(fila(celda('Sin altas en este periodo', 'celda')));
  const filtro = altas.length > 0 ? autoFiltro(1 + altas.length, 6) : '';
  return `<Worksheet ss:Name="Altas"><Table>${columnas([110, 130, 160, 160, 140, 100])}${filasXml.join('\n')}</Table>${filtro}</Worksheet>`;
}

function hojaBajas(bajas: FilaBaja[]): string {
  const filasXml: string[] = [];
  filasXml.push(
    fila(
      celda('Número', 'encabezado') +
        celda('Materia', 'encabezado') +
        celda('Actor', 'encabezado') +
        celda('Demandado', 'encabezado') +
        celda('Motivo', 'encabezado') +
        celda('Fecha', 'encabezado') +
        celda('Monto', 'encabezado')
    )
  );
  bajas.forEach((b) => {
    filasXml.push(
      fila(
        celda(b.numero, 'baja') +
          celda(b.materia, 'baja') +
          celda(b.actor, 'baja') +
          celda(b.demandado, 'baja') +
          celda(b.motivo, 'baja') +
          celda(fechaCorta(b.fecha), 'baja') +
          (b.monto ? celda(b.monto, 'dinero', 'Number') : celda('', 'baja'))
      )
    );
  });
  if (bajas.length === 0) filasXml.push(fila(celda('Sin bajas en este periodo', 'celda')));
  const filtro = bajas.length > 0 ? autoFiltro(1 + bajas.length, 7) : '';
  return `<Worksheet ss:Name="Bajas"><Table>${columnas([110, 130, 160, 160, 180, 100, 100])}${filasXml.join('\n')}</Table>${filtro}</Worksheet>`;
}

export function reporteToExcelXml(
  filas: FilaReporte[],
  desglose: FilaMotivo[],
  altas: FilaAlta[],
  bajas: FilaBaja[],
  montoConciliado: number,
  materiaLabel: string,
  motivoLabel: string,
  periodoLabel: string
): string {
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:x="urn:schemas-microsoft-com:office:excel">
${ESTILOS_XML}
${hojaResumen(filas, desglose, montoConciliado, materiaLabel, motivoLabel, periodoLabel)}
${hojaAltas(altas)}
${hojaBajas(bajas)}
</Workbook>`;
}

// ---------- PDF ----------

const NAVY: [number, number, number] = [14, 31, 61];
const GOLD: [number, number, number] = [184, 147, 90];
const ALT_ROW: [number, number, number] = [245, 242, 234];

export function generarReportePdf(
  filas: FilaReporte[],
  desglose: FilaMotivo[],
  altas: FilaAlta[],
  bajas: FilaBaja[],
  montoConciliado: number,
  materiaLabel: string,
  motivoLabel: string,
  periodoLabel: string
): jsPDF {
  const doc = new jsPDF();
  const finalY = () => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  doc.setFontSize(16);
  doc.setTextColor(...NAVY);
  doc.text('Reporte mensual de expedientes', 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text(`Periodo: ${periodoLabel}   ·   Materia: ${materiaLabel}   ·   Motivo: ${motivoLabel}`, 14, 25);

  autoTable(doc, {
    startY: 30,
    head: [['Mes', 'Altas', 'Bajas']],
    body: filas.map((f) => [f.etiqueta, String(f.nuevos), String(f.concluidos)]),
    foot: [['Total', String(filas.reduce((s, f) => s + f.nuevos, 0)), String(filas.reduce((s, f) => s + f.concluidos, 0))]],
    headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold', halign: 'center' },
    footStyles: { fillColor: GOLD, textColor: NAVY, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: ALT_ROW },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
    styles: { fontSize: 9 },
  });

  let y = finalY() + 10;

  if (desglose.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(...NAVY);
    doc.text('Bajas por motivo', 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [['Motivo', 'Cantidad']],
      body: desglose.map((f) => [f.etiqueta, String(f.cantidad)]),
      headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: ALT_ROW },
      columnStyles: { 1: { halign: 'right' } },
      styles: { fontSize: 9 },
    });
    y = finalY() + 10;
  }

  if (montoConciliado > 0) {
    doc.setFontSize(11);
    doc.setTextColor(...NAVY);
    doc.text(`Monto total conciliado: $${montoConciliado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 14, y);
    y += 10;
  }

  doc.addPage();
  doc.setFontSize(14);
  doc.setTextColor(...NAVY);
  doc.text(`Altas — detalle (${altas.length})`, 14, 18);
  autoTable(doc, {
    startY: 24,
    head: [['Número', 'Materia', 'Actor', 'Demandado', 'Cliente', 'Fecha']],
    body: altas.length
      ? altas.map((a) => [a.numero, a.materia, a.actor, a.demandado, a.cliente, fechaCorta(a.fecha)])
      : [['Sin altas en este periodo', '', '', '', '', '']],
    headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [230, 244, 234] },
    styles: { fontSize: 8 },
  });

  doc.addPage();
  doc.setFontSize(14);
  doc.setTextColor(...NAVY);
  doc.text(`Bajas — detalle (${bajas.length})`, 14, 18);
  autoTable(doc, {
    startY: 24,
    head: [['Número', 'Materia', 'Actor', 'Demandado', 'Motivo', 'Fecha', 'Monto']],
    body: bajas.length
      ? bajas.map((b) => [b.numero, b.materia, b.actor, b.demandado, b.motivo, fechaCorta(b.fecha), b.monto ? `$${b.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : ''])
      : [['Sin bajas en este periodo', '', '', '', '', '', '']],
    headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [252, 232, 230] },
    columnStyles: { 6: { halign: 'right' } },
    styles: { fontSize: 8 },
  });

  return doc;
}
