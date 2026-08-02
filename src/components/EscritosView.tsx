import { FileText } from 'lucide-react';
import type { Expediente } from '../types';

interface Props {
  expedientes: Expediente[];
  onSelect: (id: string) => void;
}

export default function EscritosView({ expedientes, onSelect }: Props) {
  const pendientes = expedientes.filter((e) => e.escritoPendiente && !e.concluido);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-navy-900/5 flex items-center gap-2">
        <FileText size={16} className="text-amber-600" />
        <h2 className="font-semibold text-navy-900">Escritos Pendientes ({pendientes.length})</h2>
      </div>
      {pendientes.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-navy-900/40">
          No hay escritos marcados como pendientes.
        </div>
      ) : (
        pendientes.map((exp) => (
          <button
            key={exp.id}
            onClick={() => onSelect(exp.id)}
            className="w-full text-left px-5 py-4 border-b border-navy-900/5 last:border-b-0 hover:bg-navy-900/[0.02] transition-colors"
          >
            <div className="font-semibold text-navy-900 text-sm">
              {exp.actor} <span className="text-gold-500 font-normal">vs</span> {exp.demandado}
            </div>
            <div className="text-xs text-navy-900/50 mt-1">Exp. {exp.numero} • {exp.juzgado} — {exp.ciudad}</div>
            {exp.proximoARealizar && (
              <div className="text-xs text-amber-700 bg-amber-50 inline-block px-2 py-1 rounded mt-2">
                {exp.proximoARealizar}
              </div>
            )}
          </button>
        ))
      )}
    </div>
  );
}
