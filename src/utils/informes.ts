import { jsPDF } from 'jspdf';
import type { Cliente, ExpedienteInforme, Honorario, TipoInforme } from '../hooks/useInformes';

const NAVY: [number, number, number] = [14, 31, 61];
const GOLD: [number, number, number] = [184, 147, 90];

export const ETIQUETA_RIESGO: Record<string, string> = {
  bajo: 'Bajo',
  medio: 'Medio',
  alto: 'Alto',
  critico: 'Crítico',
};

export function fmtFecha(iso: string | null): string {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

export function fmtMonto(n: number | null): string {
  if (n == null) return '';
  return '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function contraparte(e: ExpedienteInforme): string {
  if (e.posicionCliente === 'actor' || e.posicionCliente === 'quejoso') return e.demandado;
  return e.actor;
}

function actuacionesPeriodo(e: ExpedienteInforme, desde: string | null, hasta: string | null, soloVisibles: boolean) {
  return e.actuaciones
    .filter((a) => (!soloVisibles || a.visibleCliente) && (!desde || a.fecha >= desde) && (!hasta || a.fecha <= hasta))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/**
 * Arma el borrador de texto del informe a partir del tablero.
 * - cliente: lenguaje claro, solo actuaciones marcadas visibles, sin estrategia ni riesgos.
 * - interno: incluye estrategia, riesgo y exposición acumulada.
 * El borrador es solo un punto de partida: se revisa y edita antes de enviarlo.
 */
export function construirBorrador(
  tipo: TipoInforme,
  cliente: Cliente,
  expedientes: ExpedienteInforme[],
  desde: string | null,
  hasta: string | null,
  honorarios: Honorario[] = [],
  incluirEstadoCuenta = false
): string {
  const activos = expedientes.filter((e) => !e.concluido);
  const concluidos = expedientes.filter((e) => e.concluido);
  const lineas: string[] = [];
  const periodo = desde || hasta ? `del ${fmtFecha(desde) || 'inicio'} al ${fmtFecha(hasta) || 'la fecha'}` : 'a la fecha';

  if (tipo === 'cliente') {
    lineas.push(`INFORME DE ASUNTOS — ${cliente.nombre.toUpperCase()}`);
    lineas.push(`Periodo: ${periodo}`);
    lineas.push('');
    lineas.push('RESUMEN EJECUTIVO');
    lineas.push(
      `Actualmente atendemos ${activos.length} asunto${activos.length === 1 ? '' : 's'} en trámite` +
        (concluidos.length ? ` y ${concluidos.length} concluido${concluidos.length === 1 ? '' : 's'}` : '') +
        '. A continuación se detalla el estado de cada uno.'
    );
    lineas.push('');
  } else {
    lineas.push(`INFORME INTERNO / ESTRATEGIA — ${cliente.nombre.toUpperCase()}`);
    lineas.push(`Periodo: ${periodo}`);
    lineas.push('');
    const total = activos.reduce((s, e) => s + (e.montoRiesgo ?? 0), 0);
    lineas.push('EXPOSICIÓN');
    lineas.push(`Asuntos activos: ${activos.length}. Monto en riesgo registrado: ${fmtMonto(total) || '$0.00'}.`);
    const criticos = activos.filter((e) => e.nivelRiesgo === 'critico' || e.nivelRiesgo === 'alto');
    if (criticos.length) {
      lineas.push('Riesgo alto o crítico: ' + criticos.map((e) => `${e.numero} (${contraparte(e)})`).join('; ') + '.');
    }
    if (cliente.estrategiaGeneral) {
      lineas.push('');
      lineas.push('ESTRATEGIA GENERAL');
      lineas.push(cliente.estrategiaGeneral);
    }
    lineas.push('');
  }

  lineas.push(tipo === 'cliente' ? 'ESTADO DE LOS ASUNTOS' : 'DETALLE POR ASUNTO');
  activos.forEach((e, i) => {
    lineas.push('');
    lineas.push(`${i + 1}. ${contraparte(e)} — Exp. ${e.numero} (${e.juzgado})`);
    lineas.push(`   ${e.tipoJuicio}${e.posicionCliente ? ` · Nuestro carácter: ${e.posicionCliente}` : ''}`);
    if (tipo === 'cliente') {
      // El estatus y el "próximo" de LexControl son notas internas: no se copian al informe del cliente.
      lineas.push(`   Estado: ${e.resumenCliente || `[REDACTAR RESUMEN PARA EL CLIENTE — estatus interno: ${e.estatus || 'sin registro'}]`}`);
    } else {
      lineas.push(`   Estado: ${e.estatus || 'Sin registro'}`);
      if (e.proximo) lineas.push(`   Siguiente paso: ${e.proximo}`);
    }
    if (e.fechaLimite) lineas.push(`   Fecha relevante: ${fmtFecha(e.fechaLimite)}`);
    if (e.audienciaFecha) lineas.push(`   Audiencia: ${fmtFecha(e.audienciaFecha)}${e.audienciaHora ? ' ' + e.audienciaHora.slice(0, 5) + ' hrs' : ''}`);
    const acts = actuacionesPeriodo(e, desde, hasta, tipo === 'cliente');
    if (acts.length) {
      lineas.push('   Actuaciones del periodo:');
      acts.forEach((a) => lineas.push(`   - ${fmtFecha(a.fecha)}: ${a.descripcion}`));
    }
    if (tipo === 'interno') {
      if (e.nivelRiesgo || e.montoRiesgo != null)
        lineas.push(`   Riesgo: ${e.nivelRiesgo ? ETIQUETA_RIESGO[e.nivelRiesgo] : '—'}${e.montoRiesgo != null ? ' · ' + fmtMonto(e.montoRiesgo) : ''}`);
      if (e.estrategiaInterna) lineas.push(`   Estrategia: ${e.estrategiaInterna}`);
    }
  });

  if (concluidos.length) {
    lineas.push('');
    lineas.push('ASUNTOS CONCLUIDOS');
    concluidos.forEach((e) => lineas.push(`- ${contraparte(e)} — Exp. ${e.numero}: ${(tipo === 'cliente' ? e.resumenCliente || 'Concluido' : e.estatus) || 'Concluido'}`));
  }

  if (honorarios.length && (tipo === 'interno' || incluirEstadoCuenta)) {
    const pactado = honorarios.reduce((s, h) => s + h.monto, 0);
    const cobrado = honorarios.filter((h) => h.fechaPago).reduce((s, h) => s + h.monto, 0);
    lineas.push('');
    lineas.push(tipo === 'cliente' ? 'ESTADO DE CUENTA DE HONORARIOS' : 'HONORARIOS');
    lineas.push(`Pactado: ${fmtMonto(pactado)} · Pagado: ${fmtMonto(cobrado)} · Pendiente: ${fmtMonto(pactado - cobrado)}`);
    const porExp = new Map<string, Honorario[]>();
    for (const h of honorarios) {
      const e = expedientes.find((x) => x.id === h.expedienteId);
      const k = e ? `${contraparte(e)} — Exp. ${e.numero}` : 'General';
      porExp.set(k, [...(porExp.get(k) ?? []), h]);
    }
    for (const [k, hs] of porExp) {
      lineas.push(`- ${k}`);
      for (const h of hs) {
        lineas.push(
          `   ${h.concepto}: ${fmtMonto(h.monto)} — ${h.fechaPago ? 'pagado ' + fmtFecha(h.fechaPago) : 'pendiente' + (h.evento ? ' (' + h.evento + ')' : '')}`
        );
      }
    }
  }

  if (tipo === 'cliente') {
    lineas.push('');
    lineas.push('LO QUE NECESITAMOS DE USTED');
    lineas.push('[Completar: documentos, firmas o decisiones pendientes, planteados como escenarios.]');
  }

  lineas.push('');
  lineas.push('Duprat Lira Abogados');
  return lineas.join('\n');
}

/** PDF con encabezado del despacho a partir del texto ya revisado. */
export function generarInformePdf(titulo: string, contenido: string): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const margen = 20;
  const ancho = W - margen * 2;

  const encabezado = () => {
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, W, 18, 'F');
    doc.setTextColor(220, 195, 153);
    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    doc.text('DUPRAT LIRA ABOGADOS', margen, 11.5);
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.6);
    doc.line(0, 18, W, 18);
  };
  const pie = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text(
      'Av. Insurgentes Sur 300, Sexto Piso, Desp. 613-615, Col. Roma Norte, CDMX · Tel. 5551601668 · contacto@dupratlira.com',
      W / 2,
      H - 10,
      { align: 'center' }
    );
  };

  encabezado();
  pie();
  let y = 30;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...NAVY);
  doc.splitTextToSize(titulo, ancho).forEach((l: string) => {
    doc.text(l, margen, y);
    y += 6;
  });
  y += 2;

  for (const raw of contenido.split('\n')) {
    const esTitulo = raw.trim().length > 0 && raw === raw.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(raw) && raw.length < 90;
    doc.setFont('helvetica', esTitulo ? 'bold' : 'normal');
    doc.setFontSize(esTitulo ? 10.5 : 10);
    doc.setTextColor(...(esTitulo ? NAVY : ([40, 40, 40] as [number, number, number])));
    const partes = raw.trim() === '' ? [''] : doc.splitTextToSize(raw, ancho);
    for (const p of partes) {
      if (y > H - 20) {
        doc.addPage();
        encabezado();
        pie();
        y = 30;
      }
      doc.text(p, margen, y);
      y += raw.trim() === '' ? 3 : 5;
    }
  }
  return doc;
}
