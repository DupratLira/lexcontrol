import { ChevronRight } from 'lucide-react';
import type { Expediente } from '../types';
import Badge from './Badge';

interface Props {
  expedientes: Expediente[];
  onSelect: (id: string) => void;
}

export default function ExpedientesTable({ expedientes, onSelect }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-navy-900/5">
        <h2 className="font-semibold text-navy-900">Expedientes Registrados ({expedientes.length})</h2>
      </div>
      <div>
        {expedientes.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-navy-900/40">
            No se encontraron expedientes con estos filtros.
          </div>
        )}
        {expedientes.map((exp) => (
          <button
            key={exp.id}
            onClick={() => onSelect(exp.id)}
            className="w-full text-left px-5 py-4 border-b border-navy-900/5 last:border-b-0 hover:bg-navy-900/[0.02] transition-colors flex items-start justify-between gap-4 group"
          >
            <div className="min-w-0">
              <div className="font-semibold text-navy-900 text-sm sm:text-base leading-snug">
                {exp.actor} <span className="text-gold-500 font-normal">vs</span> {exp.demandado}
              </div>
              <div className="text-xs sm:text-sm text-navy-900/50 mt-1">
                Exp. {exp.numero} • {exp.juzgado} — {exp.ciudad}
              </div>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {exp.enAmparo && <Badge tone="red">AMPARO {exp.tipoAmparo?.toUpperCase()}</Badge>}
                {exp.escritoPendiente && <Badge tone="amber">ESCRITO</Badge>}
                {exp.enApelacion && <Badge tone="slate">APELACIÓN</Badge>}
                {exp.concluido && <Badge tone="slate">CONCLUIDO</Badge>}
              </div>
            </div>
            <ChevronRight
              size={18}
              className="shrink-0 mt-1 text-navy-900/30 group-hover:text-gold-500 group-hover:translate-x-0.5 transition-all"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
