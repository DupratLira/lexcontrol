import { useMemo, useState } from 'react';
import { X, BarChart3, Download } from 'lucide-react';
import type { Expediente, Materia } from '../types';
import { MATERIAS } from '../types';
import { calcularReporteMensual, reporteToCsv } from '../utils/reportes';

interface Props {
  expedientes: Expediente[];
  onClose: () => void;
}

export default function ReportesView({ expedientes, onClose }: Props) {
  const [materia, setMateria] = useState<Materia | 'todas'>('todas');

  const filas = useMemo(() => calcularReporteMensual(expedientes, materia), [expedientes, materia]);
  const totalNuevos = filas.reduce((sum, f) => sum + f.nuevos, 0);
  const totalConcluidos = filas.reduce((sum, f) => sum + f.concluidos, 0);

  const descargar = () => {
    const csv = reporteToCsv(filas, materia === 'todas' ? 'Todas las materias' : materia);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const fecha = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `lexcontrol-reporte-mensual-${fecha}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
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

        <div className="p-5 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <label className="block text-[11px] font-semibold tracking-wide text-navy-900/50 mb-1">MATERIA</label>
              <select
                value={materia}
                onChange={(e) => setMateria(e.target.value as Materia | 'todas')}
                className="border border-navy-900/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40"
              >
                <option value="todas">Todas (general)</option>
                {MATERIAS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <button
              onClick={descargar}
              className="flex items-center gap-2 bg-navy-900 hover:bg-navy-800 text-cream px-4 py-2 rounded-lg text-sm font-medium"
            >
              <Download size={15} /> Descargar CSV
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3">
              <div className="text-2xl font-bold text-emerald-700">{totalNuevos}</div>
              <div className="text-xs text-emerald-700/70">Nuevos (total)</div>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-3">
              <div className="text-2xl font-bold text-slate-700">{totalConcluidos}</div>
              <div className="text-xs text-slate-700/70">Concluidos (total)</div>
            </div>
          </div>

          {filas.length === 0 ? (
            <p className="text-sm text-navy-900/40 italic py-6 text-center">Sin datos para esta materia.</p>
          ) : (
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
          )}

          <p className="text-xs text-navy-900/30">
            Los expedientes concluidos antes de esta actualización usan la fecha de su última modificación como aproximación de la fecha de conclusión.
          </p>
        </div>
      </div>
    </div>
  );
}
