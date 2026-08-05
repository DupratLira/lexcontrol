import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarClock, AlertTriangle, AlertCircle, Users } from 'lucide-react';
import type { Expediente } from '../types';

interface Props {
  expedientes: Expediente[];
  onSelect: (id: string) => void;
}

interface EventoCalendario {
  expediente: Expediente;
  tipo: 'limite' | 'audiencia';
}

type Vista = 'mes' | 'semana' | 'dia';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const WEEKDAYS_LARGO = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function inicioSemana(fecha: Date): Date {
  const d = new Date(fecha);
  const offset = (d.getDay() + 6) % 7; // lunes = 0
  d.setDate(d.getDate() - offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

function diasHasta(fecha: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const objetivo = new Date(fecha + 'T00:00:00');
  return Math.round((objetivo.getTime() - hoy.getTime()) / (24 * 60 * 60 * 1000));
}

type Urgencia = 'red' | 'amber' | 'neutral';

function urgenciaPorDias(dias: number): Urgencia {
  if (dias <= 0) return 'red';
  if (dias <= 4) return 'amber';
  return 'neutral';
}

function pillClase(ev: EventoCalendario): string {
  if (ev.tipo === 'audiencia') return 'bg-rose-100 text-rose-800 hover:bg-rose-200';
  const u = urgenciaPorDias(diasHasta(ev.expediente.fechaLimite!));
  if (u === 'red') return 'bg-red-100 text-red-800 hover:bg-red-200';
  if (u === 'amber') return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
  return 'bg-slate-100 text-slate-600 hover:bg-slate-200';
}

export default function CalendarioView({ expedientes, onSelect }: Props) {
  const hoy = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const [vista, setVista] = useState<Vista>('mes');
  const [fechaRef, setFechaRef] = useState(hoy);

  const eventosPorFecha = useMemo(() => {
    const map: Record<string, EventoCalendario[]> = {};
    for (const e of expedientes) {
      if (e.concluido) continue;
      if (e.fechaLimite) {
        (map[e.fechaLimite] ??= []).push({ expediente: e, tipo: 'limite' });
      }
      if (e.tieneAudiencia && e.audienciaFecha) {
        (map[e.audienciaFecha] ??= []).push({ expediente: e, tipo: 'audiencia' });
      }
    }
    return map;
  }, [expedientes]);

  const diasMes = useMemo(() => {
    const primero = new Date(fechaRef.getFullYear(), fechaRef.getMonth(), 1);
    const ultimo = new Date(fechaRef.getFullYear(), fechaRef.getMonth() + 1, 0);
    const dias: (Date | null)[] = [];
    const offset = (primero.getDay() + 6) % 7;
    for (let i = 0; i < offset; i++) dias.push(null);
    for (let d = 1; d <= ultimo.getDate(); d++) dias.push(new Date(fechaRef.getFullYear(), fechaRef.getMonth(), d));
    return dias;
  }, [fechaRef]);

  const diasSemana = useMemo(() => {
    const inicio = inicioSemana(fechaRef);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(inicio);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [fechaRef]);

  const anterior = () => {
    const d = new Date(fechaRef);
    if (vista === 'mes') d.setMonth(d.getMonth() - 1);
    else if (vista === 'semana') d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setFechaRef(d);
  };
  const siguiente = () => {
    const d = new Date(fechaRef);
    if (vista === 'mes') d.setMonth(d.getMonth() + 1);
    else if (vista === 'semana') d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setFechaRef(d);
  };
  const irAHoy = () => setFechaRef(hoy);

  const irADia = (d: Date) => {
    setFechaRef(d);
    setVista('dia');
  };

  const titulo = useMemo(() => {
    if (vista === 'mes') return `${MONTH_NAMES[fechaRef.getMonth()]} ${fechaRef.getFullYear()}`;
    if (vista === 'dia') {
      const nombre = WEEKDAYS_LARGO[(fechaRef.getDay() + 6) % 7];
      return `${nombre} ${fechaRef.getDate()} de ${MONTH_NAMES[fechaRef.getMonth()]}`;
    }
    const ini = diasSemana[0];
    const fin = diasSemana[6];
    if (ini.getMonth() === fin.getMonth()) {
      return `${ini.getDate()} – ${fin.getDate()} de ${MONTH_NAMES[ini.getMonth()]} ${ini.getFullYear()}`;
    }
    return `${ini.getDate()} de ${MONTH_NAMES[ini.getMonth()]} – ${fin.getDate()} de ${MONTH_NAMES[fin.getMonth()]}`;
  }, [vista, fechaRef, diasSemana]);

  const proximos = useMemo(() => {
    const lista: { expediente: Expediente; tipo: 'limite' | 'audiencia'; fecha: string; dias: number }[] = [];
    for (const e of expedientes) {
      if (e.concluido) continue;
      if (e.fechaLimite) lista.push({ expediente: e, tipo: 'limite', fecha: e.fechaLimite, dias: diasHasta(e.fechaLimite) });
      if (e.tieneAudiencia && e.audienciaFecha) {
        lista.push({ expediente: e, tipo: 'audiencia', fecha: e.audienciaFecha, dias: diasHasta(e.audienciaFecha) });
      }
    }
    return lista.sort((a, b) => a.dias - b.dias).slice(0, 8);
  }, [expedientes]);

  const renderCelda = (fecha: Date, maxVisible: number, alto: string) => {
    const iso = toISODate(fecha);
    const eventos = eventosPorFecha[iso] ?? [];
    const esHoy = sameDay(fecha, hoy);

    const urgenciaMax: Urgencia = eventos.reduce<Urgencia>((max, ev) => {
      if (ev.tipo !== 'limite') return max;
      const u = urgenciaPorDias(diasHasta(ev.expediente.fechaLimite!));
      if (u === 'red') return 'red';
      if (u === 'amber' && max !== 'red') return 'amber';
      return max;
    }, 'neutral');

    const estilo = esHoy
      ? 'border-gold-400 bg-gold-500/5'
      : urgenciaMax === 'red' ? 'border-red-300 bg-red-50/60'
      : urgenciaMax === 'amber' ? 'border-amber-200 bg-amber-50/40'
      : 'border-navy-900/5 bg-white hover:border-navy-900/10';

    const visibles = eventos.slice(0, maxVisible);
    const restantes = eventos.length - visibles.length;

    return (
      <button
        key={iso}
        onClick={() => irADia(fecha)}
        className={`${alto} rounded-lg border p-1.5 flex flex-col gap-1 transition-colors text-left ${estilo}`}
      >
        <span className={`text-[11px] font-semibold leading-none ${esHoy ? 'text-gold-600' : urgenciaMax === 'red' ? 'text-red-600' : urgenciaMax === 'amber' ? 'text-amber-700' : 'text-navy-900/40'}`}>
          {fecha.getDate()}
        </span>
        {visibles.map((ev, i) => (
          <span
            key={`${ev.expediente.id}-${ev.tipo}-${i}`}
            onClick={(e) => { e.stopPropagation(); onSelect(ev.expediente.id); }}
            className={`flex items-center gap-1 text-left text-[9px] leading-tight px-1 py-0.5 rounded truncate transition-colors ${pillClase(ev)}`}
          >
            {ev.tipo === 'audiencia' && <Users size={8} className="shrink-0" />}
            <span className="truncate">{ev.expediente.actor}</span>
          </span>
        ))}
        {restantes > 0 && (
          <span className="text-[9px] font-semibold text-navy-900/40 px-1">+{restantes} más</span>
        )}
      </button>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-navy-900/5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <CalendarClock size={16} className="text-navy-900/50 shrink-0" />
          <h2 className="font-semibold text-navy-900 truncate">{titulo}</h2>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center bg-navy-900/5 rounded-lg p-0.5 mr-1">
            {(['mes', 'semana', 'dia'] as Vista[]).map((v) => (
              <button
                key={v}
                onClick={() => setVista(v)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors capitalize ${
                  vista === v ? 'bg-navy-900 text-cream' : 'text-navy-900/50 hover:text-navy-900'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <button onClick={irAHoy} className="text-[11px] font-semibold text-navy-900/60 bg-navy-900/5 hover:bg-navy-900/10 px-2.5 py-1.5 rounded-lg transition-colors">
            Hoy
          </button>
          <button onClick={anterior} className="p-1.5 rounded-lg text-navy-900/50 hover:bg-navy-900/5 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button onClick={siguiente} className="p-1.5 rounded-lg text-navy-900/50 hover:bg-navy-900/5 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="px-5 py-2 border-b border-navy-900/5 flex flex-wrap items-center gap-3 text-[10px] font-semibold text-navy-900/50">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" />Vencido / Hoy</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />Urgente (≤4d)</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-400" />Futuro</span>
        <span className="flex items-center gap-1"><Users size={11} className="text-rose-500" />Audiencia</span>
      </div>

      {vista !== 'dia' && (
        <div className="p-4">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-wide text-navy-900/40 py-1.5">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {vista === 'mes'
              ? diasMes.map((fecha, idx) =>
                  fecha ? renderCelda(fecha, 2, 'min-h-[68px]') : <div key={`vacio-${idx}`} className="min-h-[68px] rounded-lg bg-navy-900/[0.02]" />
                )
              : diasSemana.map((fecha) => renderCelda(fecha, 6, 'min-h-[140px]'))}
          </div>
        </div>
      )}

      {vista === 'dia' && (
        <div className="p-4">
          {(() => {
            const iso = toISODate(fechaRef);
            const eventos = eventosPorFecha[iso] ?? [];
            if (eventos.length === 0) {
              return <p className="text-sm text-navy-900/40 italic px-1 py-6 text-center">Sin expedientes con fecha registrada este día.</p>;
            }
            return (
              <ul className="space-y-2">
                {eventos.map((ev, i) => (
                  <li key={`${ev.expediente.id}-${ev.tipo}-${i}`}>
                    <button
                      onClick={() => onSelect(ev.expediente.id)}
                      className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                        ev.tipo === 'audiencia' ? 'bg-rose-50 border-rose-200 hover:border-rose-300' : 'bg-blue-50 border-blue-200 hover:border-blue-300'
                      }`}
                    >
                      {ev.tipo === 'audiencia' ? (
                        <Users size={16} className="text-rose-600 shrink-0" />
                      ) : (
                        <CalendarClock size={16} className="text-blue-600 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-navy-900 truncate">
                          {ev.expediente.actor} <span className="text-gold-500 font-normal">vs</span> {ev.expediente.demandado}
                        </div>
                        <div className="text-xs text-navy-900/50 truncate">
                          Exp. {ev.expediente.numero} • {ev.expediente.juzgado}
                          {ev.tipo === 'audiencia' && ev.expediente.audienciaHora && ` • ${ev.expediente.audienciaHora}`}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            );
          })()}
        </div>
      )}

      <div className="border-t border-navy-900/5 p-4">
        <h3 className="font-semibold text-[11px] tracking-wide text-navy-900/50 uppercase flex items-center gap-1.5 mb-3">
          <AlertTriangle size={12} className="text-amber-500" /> Próximos vencimientos y audiencias
        </h3>
        {proximos.length === 0 ? (
          <p className="text-xs text-navy-900/40 italic">No hay fechas registradas.</p>
        ) : (
          <ul className="space-y-1.5">
            {proximos.map(({ expediente, tipo, dias }) => {
              const nivel = tipo === 'audiencia' ? 'neutral' : urgenciaPorDias(dias);
              const filaEstilo =
                nivel === 'red' ? 'bg-red-50 border-red-200 hover:border-red-300'
                : nivel === 'amber' ? 'bg-amber-50 border-amber-200 hover:border-amber-300'
                : tipo === 'audiencia' ? 'bg-rose-50 border-rose-200 hover:border-rose-300'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300';
              const insigniaEstilo =
                nivel === 'red' ? 'bg-red-600 text-white'
                : nivel === 'amber' ? 'bg-amber-500 text-white'
                : tipo === 'audiencia' ? 'bg-rose-500 text-white'
                : 'bg-slate-400 text-white';
              const etiqueta = dias < 0 ? `Vencido ${Math.abs(dias)}d` : dias === 0 ? 'Hoy' : `${dias}d`;

              return (
                <li key={`${expediente.id}-${tipo}`}>
                  <button
                    onClick={() => onSelect(expediente.id)}
                    className={`w-full text-left flex items-center justify-between gap-2 px-3 py-2 rounded-lg border transition-colors ${filaEstilo}`}
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-2">
                      {tipo === 'audiencia' ? (
                        <Users size={14} className="text-rose-600 shrink-0" />
                      ) : nivel === 'red' ? (
                        <AlertCircle size={14} className="text-red-600 shrink-0" />
                      ) : nivel === 'amber' ? (
                        <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                      ) : (
                        <CalendarClock size={14} className="text-navy-900/30 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-navy-900 block truncate">
                          {expediente.actor} <span className="text-gold-500 font-normal">vs</span> {expediente.demandado}
                          {tipo === 'audiencia' && ' · Audiencia'}
                        </span>
                        <span className="text-[10px] text-navy-900/50 block truncate">Exp. {expediente.numero} • {expediente.juzgado}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold whitespace-nowrap shrink-0 px-2 py-0.5 rounded-full ${insigniaEstilo}`}>
                      {etiqueta}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
