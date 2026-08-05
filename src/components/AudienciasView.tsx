import { Users } from 'lucide-react';
import type { Expediente } from '../types';

interface Props {
  expedientes: Expediente[];
  onSelect: (id: string) => void;
}

export default function AudienciasView({ expedientes, onSelect }: Props) {
  const conAudiencia = expedientes
    .filter((e) => e.tieneAudiencia && !e.concluido)
    .sort((a, b) => {
      const fa = `${a.audienciaFecha ?? ''}T${a.audienciaHora ?? '00:00'}`;
      const fb = `${b.audienciaFecha ?? ''}T${b.audienciaHora ?? '00:00'}`;
      return fa < fb ? -1 : fa > fb ? 1 : 0;
    });

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-navy-900/5 flex items-center gap-2">
        <Users size={16} className="text-rose-600" />
        <h2 className="font-semibold text-navy-900">Audiencias Programadas ({conAudiencia.length})</h2>
      </div>
      {conAudiencia.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-navy-900/40">
          Ningún expediente tiene audiencia programada. Actívala desde el detalle de un expediente.
        </div>
      ) : (
        conAudiencia.map((exp) => (
          <button
            key={exp.id}
            onClick={() => onSelect(exp.id)}
            className="w-full text-left px-5 py-4 border-b border-navy-900/5 last:border-b-0 hover:bg-navy-900/[0.02] transition-colors flex items-start justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="font-semibold text-navy-900 text-sm">
                {exp.actor} <span className="text-gold-500 font-normal">vs</span> {exp.demandado}
              </div>
              <div className="text-xs text-navy-900/50 mt-1">Exp. {exp.numero} • {exp.juzgado} — {exp.ciudad}</div>
            </div>
            {exp.audienciaFecha && (
              <div className="shrink-0 text-right">
                <div className="text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full">
                  {new Date(exp.audienciaFecha + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
                {exp.audienciaHora && (
                  <div className="text-[11px] text-navy-900/40 mt-1">{exp.audienciaHora} hrs</div>
                )}
              </div>
            )}
          </button>
        ))
      )}
    </div>
  );
}
