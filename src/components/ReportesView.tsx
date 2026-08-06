import { useMemo, useState } from 'react';
import { X, BarChart3, Download, FileSpreadsheet, FileText } from 'lucide-react';
import type { Expediente, Materia, MotivoConclusion } from '../types';
import { MATERIAS, MOTIVOS_CONCLUSION, ETIQUETAS_MOTIVO } from '../types';
import {
  calcularReporteMensual,
  calcularDesglosePorMotivo,
  calcularMontoConciliado,
  reporteToCsv,
  reporteToExcelXml,
  generarReportePdf,
} from '../utils/reportes';

interface Props {
  expedientes: Expediente[];
  onClose: () => void;
}

function BarraFila({ etiqueta, valor, max, tono }: { etiqueta: string; valor: number; max: number; tono: string }) {
  const pct = max > 0 ? Math.round((valor / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm mb-1">
        <span className="text-navy-900/70">{etiqueta}</span>
        <span className="font-semibold text-navy-900">{valor}</span>
      </div>
      <div className="h-1.5 bg-navy-900/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${tono}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ReportesView({ expedientes, onClose }: Props) {
  const [materia, setMateria] = useState<Materia | 'todas'>('todas');
  const [motivo, setMotivo] = useState<MotivoConclusion | 'todos'>('todos');

  const filas = useMemo(() => calcularReporteMensual(expedientes, materia, motivo), [expedientes, materia, motivo]);
  const desglose = useMemo(() => calcularDesglosePorMotivo(expedientes, materia), [expedientes, materia]);
  const montoConciliado = useMemo(
    () => calcularMontoConciliado(expedientes, materia, motivo),
    [expedientes, materia, motivo]
  );

  const totalNuevos = filas.reduce((sum, f) => sum + f.nuevos, 0);
  const totalConcluidos = filas.reduce((sum, f) => sum + f.concluidos, 0);
  const maxNuevos = Math.max(1, ...filas.map((f) => f.nuevos));
  const maxConcluidos = Math.max(1, ...filas.map((f) => f.concluidos));
  const maxMotivo = Math.max(1, ...desglose.map((f) => f.cantidad));

  const materiaLabel = materia === 'todas' ? 'Todas las materias' : materia;
  const motivoLabel = motivo === 'todos' ? 'Todos los motivos' : ETIQUETAS_MOTIVO[motivo];

  const descargarArchivo = (blob: Blob, nombre: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const fecha = new Date().toISOString().slice(0, 10);

  const descargarCsv = () => {
    const csv = reporteToCsv(filas, materiaLabel);
    descargarArchivo(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `lexcontrol-reporte-${fecha}.csv`);
  };

  const descargarExcel = () => {
    const xml = reporteToExcelXml(filas, desglose, montoConciliado, materiaLabel, motivoLabel);
    descargarArchivo(new Blob([xml], { type: 'application/vnd.ms-excel' }), `lexcontrol-reporte-${fecha}.xls`);
  };

  const descargarPdf = () => {
    const doc = generarReportePdf(filas, desglose, montoConciliado, materiaLabel, motivoLabel);
    doc.save(`lexcontrol-reporte-${fecha}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="bg-navy-900 text-cream px-5 py-4 flex items-center justify-between rounded-t-xl sticky top-0">
          <h3 className="font-serif text-lg flex items-center gap-2">
            <BarChart3 size={18} /> Reporte mensual de expedientes
          </h3>
          <button onClick={onClose} className="text-cream/60 hover:text-cream">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold tracking-wide text-navy-900/50 mb-1">MATERIA</label>
              <select
                value={materia}
                onChange={(e) => setMateria(e.target.value as Materia | 'todas')}
                className="w-full border border-navy-900/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40"
              >
                <option value="todas">Todas (general)</option>
                {MATERIAS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold tracking-wide text-navy-900/50 mb-1">
                MOTIVO DE CONCLUSIÓN
              </label>
              <select
                value={motivo}
                onChange={(e) => setMotivo(e.target.value as MotivoConclusion | 'todos')}
                className="w-full border border-navy-900/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40"
              >
                <option value="todos">Todos</option>
                {MOTIVOS_CONCLUSION.map((m) => (
                  <option key={m} value={m}>{ETIQUETAS_MOTIVO[m]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={descargarCsv}
              className="flex items-center gap-1.5 bg-white border border-navy-900/10 hover:bg-navy-900/5 text-navy-900/80 px-3 py-2 rounded-lg text-sm font-medium"
            >
              <Download size={14} /> CSV
            </button>
            <button
              onClick={descargarExcel}
              className="flex items-center gap-1.5 bg-white border border-navy-900/10 hover:bg-navy-900/5 text-navy-900/80 px-3 py-2 rounded-lg text-sm font-medium"
            >
              <FileSpreadsheet size={14} /> Excel
            </button>
            <button
              onClick={descargarPdf}
              className="flex items-center gap-1.5 bg-white border border-navy-900/10 hover:bg-navy-900/5 text-navy-900/80 px-3 py-2 rounded-lg text-sm font-medium"
            >
              <FileText size={14} /> PDF
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3">
              <div className="text-2xl font-bold text-emerald-700">{totalNuevos}</div>
              <div className="text-xs text-emerald-700/70">Nuevos (total)</div>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-3">
              <div className="text-2xl font-bold text-slate-700">{totalConcluidos}</div>
              <div className="text-xs text-slate-700/70">Concluidos (total)</div>
            </div>
            {montoConciliado > 0 && (
              <div className="bg-teal-50 border border-teal-100 rounded-lg px-4 py-3 col-span-2 sm:col-span-1">
                <div className="text-xl font-bold text-teal-700">
                  ${montoConciliado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-teal-700/70">Monto conciliado</div>
              </div>
            )}
          </div>

          {filas.length === 0 ? (
            <p className="text-sm text-navy-900/40 italic py-6 text-center">Sin datos para estos filtros.</p>
          ) : (
            <>
              <div className="bg-white border border-navy-900/10 rounded-lg p-4 space-y-3">
                <div className="text-[11px] font-semibold tracking-wide text-navy-900/50">NUEVOS POR MES</div>
                {filas.map((f) => (
                  <BarraFila key={f.mes} etiqueta={f.etiqueta} valor={f.nuevos} max={maxNuevos} tono="bg-gradient-to-r from-gold-500 to-gold-300" />
                ))}
              </div>

              <div className="bg-white border border-navy-900/10 rounded-lg p-4 space-y-3">
                <div className="text-[11px] font-semibold tracking-wide text-navy-900/50">CONCLUIDOS POR MES</div>
                {filas.map((f) => (
                  <BarraFila key={f.mes} etiqueta={f.etiqueta} valor={f.concluidos} max={maxConcluidos} tono="bg-gradient-to-r from-navy-900 to-navy-700" />
                ))}
              </div>

              {desglose.length > 0 && (
                <div className="bg-white border border-navy-900/10 rounded-lg p-4 space-y-3">
                  <div className="text-[11px] font-semibold tracking-wide text-navy-900/50">CONCLUIDOS POR MOTIVO</div>
                  {desglose.map((f) => (
                    <BarraFila key={f.motivo} etiqueta={f.etiqueta} valor={f.cantidad} max={maxMotivo} tono="bg-gradient-to-r from-emerald-600 to-emerald-400" />
                  ))}
                </div>
              )}

              <div className="border border-navy-900/10 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-navy-900/50 text-[11px] tracking-wide">
                    <tr>
                      <th className="text-left px-4 py-2 font-semibold">MES</th>
                      <th className="text-right px-4 py-2 font-semibold">NUEVOS</th>
                      <th className="text-right px-4 py-2 font-semibold">CONCLUIDOS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-900/5">
                    {filas.map((f) => (
                      <tr key={f.mes}>
                        <td className="px-4 py-2 text-navy-900/80">{f.etiqueta}</td>
                        <td className="px-4 py-2 text-right font-medium text-emerald-700">{f.nuevos}</td>
                        <td className="px-4 py-2 text-right font-medium text-slate-700">{f.concluidos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <p className="text-xs text-navy-900/30">
            Los expedientes concluidos antes de esta actualización usan la fecha de su última modificación como
            aproximación de la fecha de conclusión, y no tienen motivo registrado.
          </p>
        </div>
      </div>
    </div>
  );
}
