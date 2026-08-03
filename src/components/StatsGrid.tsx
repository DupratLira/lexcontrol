import { AlertTriangle, Files, Gavel, Hourglass, PenLine, Scale } from 'lucide-react';
import type { DashboardStats } from '../utils/stats';
import type { QuickFilter } from '../types';

interface CardDef {
  key: QuickFilter;
  label: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  cardBg: string;
  sub?: string;
  clickable: boolean;
}

interface Props {
  stats: DashboardStats;
  active: QuickFilter;
  onSelect: (f: QuickFilter) => void;
}

export default function StatsGrid({ stats, active, onSelect }: Props) {
  const cards: CardDef[] = [
    {
      key: 'todas',
      label: 'EXPEDIENTES TOTALES',
      value: stats.total,
      icon: <Files size={20} />,
      iconBg: 'bg-blue-100 text-blue-600',
      cardBg: 'bg-white',
      sub: 'Ver todos',
      clickable: true,
    },
    {
      key: 'amparos',
      label: 'AMPAROS ACTIVOS',
      value: stats.amparos,
      icon: <Scale size={20} />,
      iconBg: 'bg-red-100 text-red-500',
      cardBg: 'bg-white',
      sub: 'Clic para filtrar',
      clickable: true,
    },
    {
      key: 'apelaciones',
      label: 'APELACIONES ACTIVAS',
      value: stats.apelaciones,
      icon: <Gavel size={20} />,
      iconBg: 'bg-emerald-100 text-emerald-600',
      cardBg: 'bg-white',
      sub: 'Clic para filtrar',
      clickable: true,
    },
    {
      key: 'escritos',
      label: 'ESCRITOS PENDIENTES',
      value: stats.escritos,
      icon: <PenLine size={20} />,
      iconBg: 'bg-amber-100 text-amber-600',
      cardBg: 'bg-white',
      sub: 'Clic para filtrar',
      clickable: true,
    },
    {
      key: 'urgentes',
      label: 'VENCIMIENTO URGENTE',
      value: stats.urgentes,
      icon: <AlertTriangle size={20} />,
      iconBg: 'bg-red-200 text-red-600',
      cardBg: 'bg-red-50 border border-red-200',
      sub: 'Menos de 4 días',
      clickable: true,
    },
    {
      key: 'congelados',
      label: 'CONGELADOS',
      value: stats.congelados,
      icon: <Hourglass size={20} />,
      iconBg: 'bg-slate-200 text-slate-500',
      cardBg: 'bg-white',
      sub: 'Más de 30 días sin cambios',
      clickable: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c) => {
        const isActive = active === c.key;
        return (
          <button
            key={c.key}
            disabled={!c.clickable}
            onClick={() => c.clickable && onSelect(isActive ? 'todas' : c.key)}
            className={`text-left rounded-xl p-4 shadow-sm transition-all ${c.cardBg} ${
              c.clickable ? 'hover:shadow-md cursor-pointer' : 'cursor-default'
            } ${isActive ? 'ring-2 ring-gold-500' : ''}`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${c.iconBg}`}>
              {c.icon}
            </div>
            <div className="text-2xl font-bold text-navy-900">{c.value}</div>
            <div className="text-[10px] font-semibold tracking-wide text-navy-900/50 mt-1">{c.label}</div>
            {c.sub && (
              <div className={`text-[11px] mt-0.5 ${c.key === 'urgentes' ? 'text-red-500' : 'text-navy-900/40'}`}>
                {c.sub}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
