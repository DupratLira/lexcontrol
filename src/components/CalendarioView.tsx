import { AlertTriangle, CalendarClock } from 'lucide-react';
import type { Expediente } from '../types';
import { isVencimientoUrgente } from '../utils/stats';

interface Props {
  expedientes: Expediente[];
  onSelect: (id: string) => void;
}

export default function CalendarioView({ expedientes, onSelect }: Props) {
  const conFecha = expedientes
    .filter((e) => e.fechaLimite && !e.concluido)
    .sort((a, b) => (a.fechaLimite! < b.fechaLimite! ? -1 : 1));

  const grupos = new Map<string, Expediente[]>();
  for (const e of conFecha) {
    const mes = new Date(e.fechaLimite! + 'T00:00:00').toLocaleDateString('es-MX', {
      month: 'long',
      year: 'numeric',
    });
    if (!grupos.has(mes)) grupos.set(mes, []);
    grupos.get(mes)!.push(e);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-navy-900/5 flex items-center gap-2">
        <CalendarClock size={16} className="text-navy-900/50" />
        <h2 className="font-semibold text-navy-900">Próximos Vencimientos ({conFecha.length})</h2>
      </div>
      {conFecha.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-navy-900/40">
          Ningún expediente tiene fecha límite registrada todavía. Agrega una fecha desde el detalle
          de un expediente para verla aquí.
        </div>
      ) : (
        Array.from(grupos.entries()).map(([mes, items]) => (
          <div key={mes}>
            <div className="px-5 py-2 bg-navy-900/[0.03] text-[11px] font-semibold tracking-wide text-navy-900/50 capitalize">
              {mes}
            </div>
            {items.map((exp) => {
              const urgente = isVencimientoUrgente(exp);
              return (
                <button
                  key={exp.id}
                  onClick={() => onSelect(exp.id)}
                  className="w-full text-left px-5 py-3 border-b border-navy-900/5 last:border-b-0 hover:bg-navy-900/[0.02] flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-navy-900 truncate">
                      {exp.actor} <span className="text-gold-500 font-normal">vs</span> {exp.demandado}
                    </div>
                    <div className="text-xs text-navy-900/50">Exp. {exp.numero} • {exp.juzgado}</div>
                  </div>
                  <div
                    className={`shrink-0 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      urgente ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {urgente && <AlertTriangle size={12} />}
                    {new Date(exp.fechaLimite! + 'T00:00:00').toLocaleDateString('es-MX', {
                      day: '2-digit', month: 'short',
                    })}
                  </div>
                </button>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}
