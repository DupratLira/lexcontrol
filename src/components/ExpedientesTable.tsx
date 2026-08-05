import { ChevronRight } from 'lucide-react';
import type { Expediente } from '../types';
import Badge from './Badge';

interface Props {
  expedientes: Expediente[];
  onSelect: (id: string) => void;
  selectedId?: string | null;
  tieneActualizacion?: (id: string, actualizadoEn: string) => boolean;
}

export default function ExpedientesTable({ expedientes, onSelect, selectedId, tieneActualizacion }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-navy-900/5">
        <h2 className="font-semibold text-navy-900">Expedientes Registrados ({expedientes.length})</h2>
      </div>
      <div className="lg:max-h-[calc(100vh-220px)] lg:overflow-y-auto">
        {expedientes.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-navy-900/40">
            No se encontraron expedientes con estos filtros.
          </div>
        )}
        {expedientes.map((exp) => {
          const esNuevo = tieneActualizacion?.(exp.id, exp.actualizadoEn);
          return (
            <button
              key={exp.id}
              onClick={() => onSelect(exp.id)}
              className={`w-full text-left px-5 py-4 border-b last:border-b-0 hover:bg-navy-900/[0.02] transition-colors flex items-start justify-between gap-4 group ${
                exp.id === selectedId
                  ? 'bg-gold-500/[0.06] border-gold-400/40 ring-1 ring-inset ring-gold-400/40'
                  : 'border-navy-900/5'
              }`}
            >
              <div className="min-w-0">
                <div className="font-semibold text-navy-900 text-sm sm:text-base leading-snug">
                  {exp.actor} <span className="text-gold-500 font-normal">vs</span> {exp.demandado}
                </div>
                <div className="text-xs sm:text-sm text-navy-900/50 mt-1">
                  Exp. {exp.numero} • {exp.juzgado} — {exp.ciudad}
                </div>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {esNuevo && <Badge tone="red">ACTUALIZADO</Badge>}
                  {exp.amparos.length > 0 && (
                    <Badge tone="red">AMPARO{exp.amparos.length > 1 ? ` ×${exp.amparos.length}` : ''}</Badge>
                  )}
                  {exp.escritoPendiente && <Badge tone="amber">ESCRITO</Badge>}
                  {exp.apelaciones.length > 0 && (
                    <Badge tone="slate">APELACIÓN{exp.apelaciones.length > 1 ? ` ×${exp.apelaciones.length}` : ''}</Badge>
                  )}
                  {exp.concluido && <Badge tone="slate">CONCLUIDO</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {esNuevo && <span className="w-2.5 h-2.5 rounded-full bg-red-500" />}
                <ChevronRight
                  size={18}
                  className="text-navy-900/30 group-hover:text-gold-500 group-hover:translate-x-0.5 transition-all"
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
