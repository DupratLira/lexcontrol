import { Calendar, LayoutGrid, FileText, Users } from 'lucide-react';
import type { TabMode } from '../types';

interface Props {
  active: TabMode;
  onChange: (t: TabMode) => void;
}

const TABS: { key: TabMode; label: string; icon: React.ReactNode }[] = [
  { key: 'tabla', label: 'Tabla', icon: <LayoutGrid size={15} /> },
  { key: 'calendario', label: 'Calendario', icon: <Calendar size={15} /> },
  { key: 'audiencias', label: 'Audiencias', icon: <Users size={15} /> },
  { key: 'escritos', label: 'Escritos', icon: <FileText size={15} /> },
];

export default function ViewTabs({ active, onChange }: Props) {
  return (
    <div className="inline-flex bg-white rounded-lg p-1 shadow-sm border border-navy-900/5">
      {TABS.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            active === t.key ? 'bg-navy-900 text-cream' : 'text-navy-900/60 hover:bg-navy-900/5'
          }`}
        >
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  );
}
