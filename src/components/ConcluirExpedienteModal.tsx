import { useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import type { Materia, MotivoConclusion } from '../types';
import { MOTIVOS_CONCLUSION, ETIQUETAS_MOTIVO } from '../types';

export interface DatosConclusion {
  motivoConclusion: MotivoConclusion;
  motivoNota?: string | null;
  montoConciliacion?: number | null;
}

interface Props {
  materia: Materia;
  onConfirm: (datos: DatosConclusion) => void;
  onClose: () => void;
}

export default function ConcluirExpedienteModal({ materia, onConfirm, onClose }: Props) {
  const esConciliacion = materia === 'Conciliaciones Laborales';

  const [concilio, setConcilio] = useState(true);
  const [monto, setMonto] = useState('');
  const [motivoNoConcilio, setMotivoNoConcilio] = useState<'Juicio' | 'Abandono' | 'Otro'>('Juicio');

  const [motivoGeneral, setMotivoGeneral] = useState<MotivoConclusion>('Favorable');
  const [nota, setNota] = useState('');

  const confirmar = () => {
    if (esConciliacion) {
      if (concilio) {
        onConfirm({ motivoConclusion: 'Convenio', montoConciliacion: monto ? Number(monto) : null });
      } else {
        onConfirm({
          motivoConclusion: motivoNoConcilio,
          motivoNota: motivoNoConcilio === 'Otro' ? nota.trim() || null : null,
        });
      }
      return;
    }
    onConfirm({
      motivoConclusion: motivoGeneral,
      motivoNota: motivoGeneral === 'Otro' ? nota.trim() || null : null,
    });
  };

  return (
    <div className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
        <div className="bg-navy-900 text-cream px-5 py-4 flex items-center justify-between rounded-t-xl">
          <h3 className="font-serif text-lg flex items-center gap-2">
            <CheckCircle2 size={18} /> Concluir expediente
          </h3>
          <button onClick={onClose} className="text-cream/60 hover:text-cream">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {esConciliacion ? (
            <>
              <div>
                <label className="block text-[11px] font-semibold tracking-wide text-navy-900/50 mb-1">¿SE CONCILIÓ?</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConcilio(true)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      concilio ? 'bg-emerald-600 text-white border-emerald-600' : 'border-navy-900/10 text-navy-900/70'
                    }`}
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => setConcilio(false)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      !concilio ? 'bg-navy-900 text-cream border-navy-900' : 'border-navy-900/10 text-navy-900/70'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {concilio ? (
                <div>
                  <label className="block text-[11px] font-semibold tracking-wide text-navy-900/50 mb-1">
                    MONTO CONCILIADO ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-navy-900/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold tracking-wide text-navy-900/50 mb-1">
                      ¿POR QUÉ NO SE CONCILIÓ?
                    </label>
                    <select
                      value={motivoNoConcilio}
                      onChange={(e) => setMotivoNoConcilio(e.target.value as 'Juicio' | 'Abandono' | 'Otro')}
                      className="w-full border border-navy-900/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40"
                    >
                      <option value="Juicio">Se fue a juicio</option>
                      <option value="Abandono">Cliente abandonó el proceso</option>
                      <option value="Otro">Otro motivo</option>
                    </select>
                  </div>
                  {motivoNoConcilio === 'Otro' && (
                    <input
                      value={nota}
                      onChange={(e) => setNota(e.target.value)}
                      placeholder="Especifica el motivo..."
                      className="w-full border border-navy-900/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40"
                    />
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <div>
                <label className="block text-[11px] font-semibold tracking-wide text-navy-900/50 mb-1">
                  MOTIVO DE CONCLUSIÓN
                </label>
                <select
                  value={motivoGeneral}
                  onChange={(e) => setMotivoGeneral(e.target.value as MotivoConclusion)}
                  className="w-full border border-navy-900/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40"
                >
                  {MOTIVOS_CONCLUSION.filter((m) => m !== 'Juicio').map((m) => (
                    <option key={m} value={m}>{ETIQUETAS_MOTIVO[m]}</option>
                  ))}
                </select>
              </div>
              {motivoGeneral === 'Otro' && (
                <input
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  placeholder="Especifica el motivo..."
                  className="w-full border border-navy-900/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40"
                />
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 px-5 py-4 border-t border-navy-900/5">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-navy-900/60 hover:text-navy-900">
            Cancelar
          </button>
          <button
            onClick={confirmar}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium"
          >
            Confirmar conclusión
          </button>
        </div>
      </div>
    </div>
  );
}
