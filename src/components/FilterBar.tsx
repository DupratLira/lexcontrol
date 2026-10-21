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
        className={`w-full sm:w-auto px-3 sm:px-4 py-2 rounded-full text-sm font-medium leading-tight text-center transition-colors sm:whitespace-nowrap ${
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
    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:justify-between">
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <div className="hidden sm:flex w-9 h-9 rounded-full bg-white border border-navy-900/10 items-center justify-center text-navy-900/50">
          <Filter size={15} />
        </div>
        {pill('Todas', 'todas')}
        {MATERIAS.map((m) => pill(m, m))}
      </div>
      {!soloLectura && (
        <button
          onClick={onNuevoExpediente}
          className="w-full sm:w-auto justify-center flex items-center gap-2 bg-navy-900 hover:bg-navy-800 text-cream px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={16} /> Nuevo Expediente
        </button>
      )}
    </div>
  );
}
