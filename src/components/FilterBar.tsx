import { Filter, Plus } from 'lucide-react';
import type { Materia } from '../types';
import { MATERIAS } from '../types';

interface Props {
  activeMateria: Materia | 'todas';
  onChangeMateria: (m: Materia | 'todas') => void;
  onNuevoExpediente: () => void;
  soloLectura?: boolean;
}

export default function FilterBar({ activeMateria, onChangeMateria, onNuevoExpediente, soloLectura }: Props) {
  const pill = (label: string, value: Materia | 'todas') => {
    const active = activeMateria === value;
    return (
      <button
        key={value}
        onClick={() => onChangeMateria(value)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
          active
            ? 'bg-navy-900 text-cream'
            : 'bg-white text-navy-900/70 hover:bg-navy-900/5 border border-navy-900/10'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2 justify-between">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="w-9 h-9 rounded-full bg-white border border-navy-900/10 flex items-center justify-center text-navy-900/50">
          <Filter size={15} />
        </div>
        {pill('Todas', 'todas')}
        {MATERIAS.map((m) => pill(m, m))}
      </div>
      {!soloLectura && (
        <button
          onClick={onNuevoExpediente}
          className="flex items-center gap-2 bg-navy-900 hover:bg-navy-800 text-cream px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={16} /> Nuevo Expediente
        </button>
      )}
    </div>
  );
}
