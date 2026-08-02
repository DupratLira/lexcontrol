import { Layers } from 'lucide-react';
import type { DashboardStats } from '../utils/stats';
import { MATERIAS } from '../types';

interface Props {
  stats: DashboardStats;
}

export default function MateriaDistribution({ stats }: Props) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-navy-900/60 mb-4">
        <Layers size={14} /> DISTRIBUCIÓN POR MATERIA
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
        {MATERIAS.map((m) => {
          const count = stats.porMateria[m];
          const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
          return (
            <div key={m}>
              <div className="flex items-baseline justify-between text-sm mb-1.5">
                <span className="text-navy-900/80">{m}</span>
                <span className="font-semibold text-navy-900">
                  {count} <span className="text-navy-900/40 font-normal text-xs">{pct}%</span>
                </span>
              </div>
              <div className="h-1.5 bg-navy-900/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-gold-500 to-gold-300 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
