import { useState } from 'react';
import {
  ArrowLeft, Calendar as CalendarIcon, CheckCircle2, Clock, FileText,
  Gavel, Plus, Save, Scale, Trash2,
} from 'lucide-react';
import type { Expediente, Materia } from '../types';
import { MATERIAS } from '../types';
import Toggle from './Toggle';
import { syncFechaLimiteToCalendar } from '../services/googleCalendar';

interface Props {
  expediente: Expediente;
  onBack: () => void;
  onUpdate: (patch: Partial<Expediente>) => void;
  onAddActuacion: (descripcion: string) => void;
  onConcluir: () => void;
  onEliminar: () => void;
}

const MATERIA_STYLE: Record<Materia, string> = {
  Civil: 'bg-blue-100 text-blue-700',
  Familiar: 'bg-purple-100 text-purple-700',
  Laboral: 'bg-emerald-100 text-emerald-700',
  Administrativa: 'bg-amber-100 text-amber-700',
};

export default function ExpedienteDetail({
  expediente, onBack, onUpdate, onAddActuacion, onConcluir, onEliminar,
}: Props) {
  const [local, setLocal] = useState(expediente);
  const [nuevaActuacion, setNuevaActuacion] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);
  const [syncState, setSyncState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);

  const patch = <K extends keyof Expediente>(key: K, value: Expediente[K]) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
  };

  const guardar = () => {
    onUpdate(local);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1600);
  };

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium text-navy-900/70 hover:text-navy-900 bg-white px-4 py-2 rounded-lg shadow-sm w-fit"
      >
        <ArrowLeft size={16} /> Volver a la lista
      </button>

      <div className="bg-white rounded-xl shadow-sm p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <select
              value={local.materia}
              onChange={(e) => patch('materia', e.target.value as Materia)}
              className={`text-[11px] font-semibold tracking-wide px-2 py-1 rounded mb-2 border-0 ${MATERIA_STYLE[local.materia]}`}
            >
              {MATERIAS.map((m) => (
                <option key={m} value={m}>MATERIA {m.toUpperCase()}</option>
              ))}
            </select>
            <input
              value={local.numero}
              onChange={(e) => patch('numero', e.target.value)}
              className="block text-2xl font-bold text-navy-900 bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-gold-400 rounded px-1 -ml-1"
            />
            <div className="flex flex-wrap gap-2 mt-1 text-sm text-navy-900/50">
              <input
                value={local.juzgado}
                onChange={(e) => patch('juzgado', e.target.value)}
                placeholder="Juzgado"
                className="bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-gold-400 rounded px-1"
              />
              <span>—</span>
              <input
                value={local.tipoJuicio}
                onChange={(e) => patch('tipoJuicio', e.target.value)}
                placeholder="Tipo de juicio"
                className="bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-gold-400 rounded px-1 flex-1 min-w-[140px]"
              />
            </div>
          </div>
          <button
            onClick={guardar}
            className="flex items-center gap-2 bg-navy-900 hover:bg-navy-800 text-cream px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shrink-0"
          >
            <Save size={15} /> {savedFlash ? 'Guardado ✓' : 'Actualizar Avance'}
          </button>
        </div>

        <div className="border border-amber-300 bg-amber-50 rounded-lg px-4 py-3 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <Toggle checked={local.escritoPendiente} onChange={(v) => patch('escritoPendiente', v)} />
            <FileText size={16} className="text-amber-600" />
            <span className="text-sm font-medium text-amber-800">¿Hay escrito próximo por realizar?</span>
          </label>
          {local.escritoPendiente && (
            <div className="grid sm:grid-cols-2 gap-3 pl-9">
              <input
                value={local.escritoTipo ?? ''}
                onChange={(e) => patch('escritoTipo', e.target.value || null)}
                placeholder="Tipo de escrito"
                className="border border-amber-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40"
              />
              <input
                type="date"
                value={local.escritoFechaLimite ?? ''}
                onChange={(e) => patch('escritoFechaLimite', e.target.value || null)}
                className="border border-amber-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40"
              />
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <div className="text-[11px] font-semibold tracking-wide text-navy-900/40 mb-1">ACTOR</div>
            <input
              value={local.actor}
              onChange={(e) => patch('actor', e.target.value)}
              className="w-full font-medium text-navy-900 bg-transparent border-0 border-b border-transparent focus:border-gold-400 focus:outline-none py-1"
            />
          </div>
          <div>
            <div className="text-[11px] font-semibold tracking-wide text-navy-900/40 mb-1">DEMANDADO</div>
            <input
              value={local.demandado}
              onChange={(e) => patch('demandado', e.target.value)}
              className="w-full font-medium text-navy-900 bg-transparent border-0 border-b border-transparent focus:border-gold-400 focus:outline-none py-1"
            />
          </div>
          <div>
            <div className="text-[11px] font-semibold tracking-wide text-navy-900/40 mb-1">CLIENTE</div>
            <input
              value={local.cliente}
              onChange={(e) => patch('cliente', e.target.value)}
              className="w-full font-medium text-navy-900 bg-transparent border-0 border-b border-transparent focus:border-gold-400 focus:outline-none py-1"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <Toggle checked={local.expFisico} onChange={(v) => patch('expFisico', v)} />
            <span className="text-sm text-navy-900/70">Expediente físico en despacho</span>
          </label>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
          <div className="text-[11px] font-semibold tracking-wide text-navy-900/50 mb-2">SITUACIÓN ACTUAL / ESTADO</div>
          <textarea
            value={local.situacionActual}
            onChange={(e) => patch('situacionActual', e.target.value)}
            rows={3}
            placeholder="Describe el estado procesal actual..."
            className="w-full bg-transparent border-0 focus:outline-none text-sm resize-none placeholder:text-navy-900/30"
          />
        </div>

        <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
          <div className="text-[11px] font-semibold tracking-wide text-amber-700/70 mb-2">PRÓXIMO A REALIZAR / RECORDATORIO</div>
          <textarea
            value={local.proximoARealizar}
            onChange={(e) => patch('proximoARealizar', e.target.value)}
            rows={2}
            placeholder="¿Qué sigue en este expediente?"
            className="w-full bg-transparent border-0 focus:outline-none text-sm resize-none placeholder:text-amber-700/30"
          />
        </div>

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wide text-blue-700/70">
            <CalendarIcon size={13} /> FECHA LÍMITE
          </div>
          <input
            type="date"
            value={local.fechaLimite ?? ''}
            onChange={(e) => patch('fechaLimite', e.target.value || null)}
            className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40"
          />
          <button
            type="button"
            disabled={!local.fechaLimite || syncState === 'loading'}
            onClick={async () => {
              if (!local.fechaLimite) return;
              setSyncState('loading');
              setSyncError(null);
              const result = await syncFechaLimiteToCalendar({
                numero: local.numero,
                materia: local.materia,
                juzgado: local.juzgado,
                actor: local.actor,
                demandado: local.demandado,
                proximoARealizar: local.proximoARealizar,
                fechaLimite: local.fechaLimite,
              });
              if (result.success) {
                setSyncState('success');
                setTimeout(() => setSyncState('idle'), 2500);
              } else {
                setSyncState('error');
                setSyncError(result.error ?? 'Error desconocido al conectar con Google Calendar.');
              }
            }}
            className="w-full flex items-center justify-center gap-2 bg-white border border-blue-200 hover:bg-blue-100/50 disabled:opacity-50 text-blue-700 rounded-lg py-2 text-sm font-medium transition-colors"
          >
            <CalendarIcon size={14} />
            {syncState === 'loading'
              ? 'Sincronizando…'
              : syncState === 'success'
              ? 'Evento creado en Google Calendar ✓'
              : 'Sincronizar con Google Calendar'}
          </button>
          {syncState === 'error' && syncError && (
            <p className="text-xs text-red-600">{syncError}</p>
          )}
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-3 py-2 cursor-pointer">
            <Toggle checked={local.enAmparo} onChange={(v) => patch('enAmparo', v)} />
            <Scale size={16} className="text-red-500" />
            <span className="text-sm font-medium text-navy-900/80">¿Este asunto se encuentra en Amparo?</span>
            {local.enAmparo && (
              <select
                value={local.tipoAmparo ?? 'Directo'}
                onChange={(e) => patch('tipoAmparo', e.target.value)}
                className="ml-auto text-xs border border-navy-900/10 rounded-lg px-2 py-1"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="Directo">Directo</option>
                <option value="Indirecto">Indirecto</option>
              </select>
            )}
          </label>
          {local.enAmparo && (
            <div className="grid sm:grid-cols-2 gap-3 pl-9 -mt-1">
              <input
                value={local.amparoNumero ?? ''}
                onChange={(e) => patch('amparoNumero', e.target.value || null)}
                placeholder="Número de amparo"
                className="border border-navy-900/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40"
              />
              <input
                value={local.amparoJuzgado ?? ''}
                onChange={(e) => patch('amparoJuzgado', e.target.value || null)}
                placeholder="Juzgado / Tribunal de amparo"
                className="border border-navy-900/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40"
              />
            </div>
          )}
          <label className="flex items-center gap-3 py-2 cursor-pointer">
            <Toggle checked={local.enApelacion} onChange={(v) => patch('enApelacion', v)} />
            <Gavel size={16} className="text-emerald-600" />
            <span className="text-sm font-medium text-navy-900/80">¿Este asunto está en Apelación?</span>
          </label>
          {local.enApelacion && (
            <div className="grid sm:grid-cols-3 gap-3 pl-9 -mt-1">
              <input
                value={local.apelacionSala ?? ''}
                onChange={(e) => patch('apelacionSala', e.target.value || null)}
                placeholder="Sala"
                className="border border-navy-900/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40"
              />
              <input
                value={local.apelacionToca ?? ''}
                onChange={(e) => patch('apelacionToca', e.target.value || null)}
                placeholder="Toca"
                className="border border-navy-900/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40"
              />
              <input
                value={local.apelacionTipo ?? ''}
                onChange={(e) => patch('apelacionTipo', e.target.value || null)}
                placeholder="Tipo de apelación"
                className="border border-navy-900/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40"
              />
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wide text-navy-900/50">
              <Clock size={13} /> BITÁCORA DE ACTUACIONES
            </div>
          </div>
          <div className="flex gap-2 mb-3">
            <input
              value={nuevaActuacion}
              onChange={(e) => setNuevaActuacion(e.target.value)}
              placeholder="Describe la actuación..."
              className="flex-1 border border-navy-900/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && nuevaActuacion.trim()) {
                  onAddActuacion(nuevaActuacion.trim());
                  setNuevaActuacion('');
                }
              }}
            />
            <button
              onClick={() => {
                if (!nuevaActuacion.trim()) return;
                onAddActuacion(nuevaActuacion.trim());
                setNuevaActuacion('');
              }}
              className="flex items-center gap-1.5 bg-navy-900 text-cream px-3 py-2 rounded-lg text-sm font-medium"
            >
              <Plus size={14} /> Agregar
            </button>
          </div>
          {expediente.bitacora.length === 0 ? (
            <p className="text-sm text-navy-900/40 italic">Sin actuaciones registradas todavía.</p>
          ) : (
            <ul className="space-y-2">
              {expediente.bitacora.map((a) => (
                <li key={a.id} className="text-sm bg-slate-50 rounded-lg px-3 py-2 flex justify-between gap-3">
                  <span className="text-navy-900/80">{a.descripcion}</span>
                  <span className="text-navy-900/40 text-xs shrink-0">
                    {new Date(a.fecha).toLocaleDateString('es-MX')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {(local.creadoPor || local.actualizadoPor) && (
          <p className="text-xs text-navy-900/30">
            {local.creadoPor && <>Creado por {local.creadoPor}. </>}
            {local.actualizadoPor && <>Última actualización por {local.actualizadoPor} el {new Date(local.actualizadoEn).toLocaleString('es-MX')}.</>}
          </p>
        )}

        <div className="flex flex-wrap gap-2 pt-2 border-t border-navy-900/5">
          <button
            onClick={onConcluir}
            className="flex items-center gap-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-lg transition-colors"
          >
            <CheckCircle2 size={15} /> Concluir Expediente
          </button>
          <button
            onClick={() => {
              if (confirm('¿Eliminar este expediente de forma permanente?')) onEliminar();
            }}
            className="flex items-center gap-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors"
          >
            <Trash2 size={15} /> Eliminar Expediente
          </button>
        </div>
      </div>
    </div>
  );
}
