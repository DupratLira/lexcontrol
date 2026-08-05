import { useState } from 'react';
import { X } from 'lucide-react';
import type { Expediente, Materia } from '../types';
import { MATERIAS } from '../types';
import Toggle from './Toggle';

interface Props {
  onClose: () => void;
  onCreate: (data: Partial<Expediente>) => void;
}

export default function NewExpedienteModal({ onClose, onCreate }: Props) {
  const [materia, setMateria] = useState<Materia>('Civil');
  const [juzgado, setJuzgado] = useState('');
  const [numero, setNumero] = useState('');
  const [tipoJuicio, setTipoJuicio] = useState('');
  const [actor, setActor] = useState('');
  const [demandado, setDemandado] = useState('');
  const [cliente, setCliente] = useState('Despacho');
  const [fechaLimite, setFechaLimite] = useState('');
  const [escritoPendiente, setEscritoPendiente] = useState(false);
  const [error, setError] = useState('');

  const submit = () => {
    if (!numero.trim()) {
      setError('El número de expediente es obligatorio.');
      return;
    }
    onCreate({
      materia,
      juzgado,
      numero,
      tipoJuicio,
      actor,
      demandado,
      cliente,
      situacionActual: '',
      proximoARealizar: '',
      fechaLimite: fechaLimite || null,
      escritoPendiente,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin shadow-xl">
        <div className="bg-navy-900 text-cream px-5 py-4 flex items-center justify-between rounded-t-xl sticky top-0">
          <h3 className="font-serif text-lg">Nuevo Expediente</h3>
          <button onClick={onClose} className="text-cream/60 hover:text-cream">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold tracking-wide text-navy-900/50 mb-1">MATERIA</label>
              <select
                value={materia}
                onChange={(e) => setMateria(e.target.value as Materia)}
                className="w-full border border-navy-900/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40"
              >
                {MATERIAS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold tracking-wide text-navy-900/50 mb-1">JUZGADO</label>
              <input
                value={juzgado}
                onChange={(e) => setJuzgado(e.target.value)}
                className="w-full border border-navy-900/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold tracking-wide text-navy-900/50 mb-1">NO. EXPEDIENTE *</label>
              <input
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                className="w-full border border-navy-900/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold tracking-wide text-navy-900/50 mb-1">TIPO DE JUICIO</label>
              <input
                value={tipoJuicio}
                onChange={(e) => setTipoJuicio(e.target.value)}
                className="w-full border border-navy-900/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold tracking-wide text-navy-900/50 mb-1">ACTOR</label>
              <input
                value={actor}
                onChange={(e) => setActor(e.target.value)}
                className="w-full border border-navy-900/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold tracking-wide text-navy-900/50 mb-1">DEMANDADO</label>
              <input
                value={demandado}
                onChange={(e) => setDemandado(e.target.value)}
                className="w-full border border-navy-900/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold tracking-wide text-navy-900/50 mb-1">CLIENTE</label>
            <input
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              className="w-full border border-navy-900/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold tracking-wide text-navy-900/50 mb-1">FECHA LÍMITE (PRÓXIMO PASO)</label>
            <input
              type="date"
              value={fechaLimite}
              onChange={(e) => setFechaLimite(e.target.value)}
              className="w-full border border-navy-900/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40"
            />
          </div>

          <div className="divide-y divide-navy-900/5 border-t border-navy-900/5">
            <label className="flex items-center gap-3 py-3 cursor-pointer">
              <Toggle checked={escritoPendiente} onChange={setEscritoPendiente} />
              <span className="text-sm text-navy-900/80">¿Hay escrito próximo por realizar?</span>
            </label>
          </div>
          <p className="text-xs text-navy-900/40 italic">
            Los amparos, apelaciones y audiencias se agregan después, desde el detalle del expediente.
          </p>
        </div>

        <div className="flex justify-end gap-3 px-5 py-4 border-t border-navy-900/5 sticky bottom-0 bg-white rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-navy-900/60 hover:text-navy-900">
            Cancelar
          </button>
          <button
            onClick={submit}
            className="px-5 py-2 bg-navy-900 hover:bg-navy-800 text-cream rounded-lg text-sm font-medium"
          >
            Crear Expediente
          </button>
        </div>
      </div>
    </div>
  );
}
