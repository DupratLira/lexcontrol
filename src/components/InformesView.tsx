import { useEffect, useMemo, useState } from 'react';
import { X, FileText, FolderOpen, Save, Download, Trash2, Wand2, ChevronDown, ChevronUp, Lock, Check, Plus } from 'lucide-react';
import {
  useClientes,
  useInformesCliente,
  type ExpedienteInforme,
  type Informe,
  type NivelRiesgo,
  type TipoInforme,
  type EstadoInforme,
  type Honorario,
} from '../hooks/useInformes';
import { construirBorrador, generarInformePdf, fmtFecha, fmtMonto, ETIQUETA_RIESGO } from '../utils/informes';

interface Props {
  userEmail: string;
  onClose: () => void;
}

const COLOR_RIESGO: Record<string, string> = {
  bajo: 'bg-emerald-100 text-emerald-800',
  medio: 'bg-amber-100 text-amber-800',
  alto: 'bg-orange-100 text-orange-800',
  critico: 'bg-red-100 text-red-800',
};

const hoy = () => new Date().toISOString().slice(0, 10);

function diasPara(fecha: string | null): number | null {
  if (!fecha) return null;
  const d = new Date(fecha + 'T00:00:00').getTime() - new Date(hoy() + 'T00:00:00').getTime();
  return Math.round(d / 86400000);
}

function TarjetaExpediente({
  e,
  onGuardar,
  onVisibilidad,
}: {
  e: ExpedienteInforme;
  onVisibilidad: (actuacionId: string, visible: boolean) => void;
  onGuardar: (d: { resumenCliente: string | null; estrategiaInterna: string | null; nivelRiesgo: NivelRiesgo | null; montoRiesgo: number | null }) => Promise<void>;
}) {
  const [abierto, setAbierto] = useState(false);
  const [resumen, setResumen] = useState(e.resumenCliente ?? '');
  const [estrategia, setEstrategia] = useState(e.estrategiaInterna ?? '');
  const [riesgo, setRiesgo] = useState<NivelRiesgo | ''>(e.nivelRiesgo ?? '');
  const [monto, setMonto] = useState(e.montoRiesgo != null ? String(e.montoRiesgo) : '');
  const [guardando, setGuardando] = useState(false);
  const dias = diasPara(e.fechaLimite);
  const contraparte = e.posicionCliente === 'actor' || e.posicionCliente === 'quejoso' ? e.demandado : e.actor;

  const guardar = async () => {
    setGuardando(true);
    try {
      await onGuardar({
        resumenCliente: resumen.trim() || null,
        estrategiaInterna: estrategia.trim() || null,
        nivelRiesgo: riesgo || null,
        montoRiesgo: monto.trim() ? Number(monto.replace(/[$,\s]/g, '')) : null,
      });
    } catch (err) {
      alert('Error al guardar: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className={`border rounded-lg p-3 ${e.concluido ? 'bg-slate-50 border-navy-900/5 opacity-70' : 'bg-white border-navy-900/10'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-navy-900 truncate">{contraparte || '—'}</div>
          <div className="text-xs text-navy-900/60 truncate">
            Exp. {e.numero} · {e.juzgado}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {e.nivelRiesgo && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${COLOR_RIESGO[e.nivelRiesgo]}`}>
              {ETIQUETA_RIESGO[e.nivelRiesgo]}
            </span>
          )}
          {e.concluido && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">Concluido</span>}
        </div>
      </div>
      <div className="mt-2 text-xs text-navy-900/80 line-clamp-3">{e.estatus || 'Sin estatus registrado'}</div>
      {e.proximo && <div className="mt-1 text-xs text-navy-900/60 line-clamp-2"><b>Próximo:</b> {e.proximo}</div>}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
        {e.fechaLimite && (
          <span className={`px-2 py-0.5 rounded ${dias != null && dias <= 3 ? 'bg-red-100 text-red-800' : 'bg-navy-900/5 text-navy-900/70'}`}>
            Fecha: {fmtFecha(e.fechaLimite)}
            {dias != null && dias >= 0 ? ` (${dias === 0 ? 'hoy' : dias + ' d'})` : dias != null ? ' (vencida)' : ''}
          </span>
        )}
        {e.audienciaFecha && (
          <span className="px-2 py-0.5 rounded bg-navy-900/5 text-navy-900/70">
            Audiencia: {fmtFecha(e.audienciaFecha)} {e.audienciaHora?.slice(0, 5)}
          </span>
        )}
        {e.montoRiesgo != null && <span className="px-2 py-0.5 rounded bg-navy-900/5 text-navy-900/70">{fmtMonto(e.montoRiesgo)}</span>}
        {e.carpetaDriveUrl && (
          <a href={e.carpetaDriveUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-navy-700 hover:underline">
            <FolderOpen size={12} /> Drive
          </a>
        )}
        <button onClick={() => setAbierto(!abierto)} className="ml-auto flex items-center gap-1 text-navy-900/60 hover:text-navy-900">
          {abierto ? <ChevronUp size={13} /> : <ChevronDown size={13} />} Datos del informe
        </button>
      </div>
      {abierto && (
        <div className="mt-3 space-y-2 border-t border-navy-900/10 pt-3">
          <label className="block text-[11px] font-semibold text-navy-900/60">
            Resumen para el cliente (lenguaje claro)
            <textarea value={resumen} onChange={(ev) => setResumen(ev.target.value)} rows={2} className="mt-1 w-full border border-navy-900/15 rounded-md px-2 py-1.5 text-xs font-normal" />
          </label>
          <div className="bg-amber-50/60 border border-amber-200 rounded-md p-2 space-y-2">
            <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-800"><Lock size={11} /> SOLO INTERNO — nunca visible al cliente</div>
            <textarea value={estrategia} onChange={(ev) => setEstrategia(ev.target.value)} rows={2} placeholder="Estrategia interna" className="w-full border border-navy-900/15 rounded-md px-2 py-1.5 text-xs" />
            <div className="flex gap-2">
              <select value={riesgo} onChange={(ev) => setRiesgo(ev.target.value as NivelRiesgo | '')} className="border border-navy-900/15 rounded-md px-2 py-1 text-xs">
                <option value="">Riesgo —</option>
                {(['bajo', 'medio', 'alto', 'critico'] as NivelRiesgo[]).map((r) => (
                  <option key={r} value={r}>{ETIQUETA_RIESGO[r]}</option>
                ))}
              </select>
              <input value={monto} onChange={(ev) => setMonto(ev.target.value)} placeholder="Monto en riesgo" className="flex-1 border border-navy-900/15 rounded-md px-2 py-1 text-xs" />
            </div>
          </div>
          <button onClick={guardar} disabled={guardando} className="flex items-center gap-1.5 bg-navy-900 text-cream text-xs px-3 py-1.5 rounded-md disabled:opacity-50">
            <Save size={12} /> {guardando ? 'Guardando...' : 'Guardar'}
          </button>
          {e.actuaciones.length > 0 && (
            <div className="pt-2">
              <div className="text-[11px] font-semibold text-navy-900/60 mb-1">Bitácora — marca lo que puede ver el cliente</div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {e.actuaciones.map((a) => (
                  <label key={a.id} className="flex items-start gap-2 text-[11px] text-navy-900/80">
                    <input type="checkbox" checked={a.visibleCliente} onChange={(ev) => onVisibilidad(a.id, ev.target.checked)} className="mt-0.5" />
                    <span><b>{fmtFecha(a.fecha)}</b> {a.descripcion}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PanelHonorarios({
  honorarios,
  expedientes,
  clienteId,
  onGuardar,
  onEliminar,
}: {
  honorarios: Honorario[];
  expedientes: ExpedienteInforme[];
  clienteId: number;
  onGuardar: (h: Omit<Honorario, 'id'> & { id?: number }) => Promise<void>;
  onEliminar: (id: number) => Promise<void>;
}) {
  const [nuevo, setNuevo] = useState({ expedienteId: '', concepto: '', monto: '', evento: '', pagado: '' });
  const pactado = honorarios.reduce((s, h) => s + h.monto, 0);
  const cobrado = honorarios.filter((h) => h.fechaPago).reduce((s, h) => s + h.monto, 0);
  const nombreExp = (id: number | null) => {
    const e = expedientes.find((x) => x.id === id);
    if (!e) return 'General';
    const cp = e.posicionCliente === 'actor' || e.posicionCliente === 'quejoso' ? e.demandado : e.actor;
    return `${cp} · ${e.numero}`;
  };
  const err = (e: unknown) => alert('Error: ' + (e instanceof Error ? e.message : String(e)));
  const agregar = () => {
    if (!nuevo.concepto.trim() || !nuevo.monto.trim()) return;
    onGuardar({
      clienteId,
      expedienteId: nuevo.expedienteId ? Number(nuevo.expedienteId) : null,
      concepto: nuevo.concepto.trim(),
      monto: Number(nuevo.monto.replace(/[$,\s]/g, '')),
      fechaPago: nuevo.pagado || null,
      evento: nuevo.evento.trim() || null,
      notas: null,
    })
      .then(() => setNuevo({ expedienteId: '', concepto: '', monto: '', evento: '', pagado: '' }))
      .catch(err);
  };
  return (
    <div className="bg-white rounded-lg p-3 shadow-sm">
      <div className="flex items-center gap-1 text-[11px] font-semibold tracking-wide text-navy-900/50 mb-2">
        <Lock size={10} /> HONORARIOS
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div><div className="text-[10px] text-navy-900/50">Pactado</div><div className="text-sm font-semibold">{fmtMonto(pactado) || '$0.00'}</div></div>
        <div><div className="text-[10px] text-navy-900/50">Cobrado</div><div className="text-sm font-semibold text-emerald-700">{fmtMonto(cobrado) || '$0.00'}</div></div>
        <div><div className="text-[10px] text-navy-900/50">Por cobrar</div><div className="text-sm font-semibold text-amber-700">{fmtMonto(pactado - cobrado) || '$0.00'}</div></div>
      </div>
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {honorarios.map((h) => (
          <div key={h.id} className="flex items-center gap-2 text-[11px] border-b border-navy-900/5 py-1">
            <div className="flex-1 min-w-0">
              <div className="truncate text-navy-900"><b>{h.concepto}</b> · {fmtMonto(h.monto)}</div>
              <div className="truncate text-navy-900/50">{nombreExp(h.expedienteId)}{h.evento ? ' · ' + h.evento : ''}</div>
            </div>
            {h.fechaPago ? (
              <span className="text-emerald-700 whitespace-nowrap">Pagado {fmtFecha(h.fechaPago)}</span>
            ) : (
              <button
                onClick={() => {
                  const f = prompt('Fecha de pago (AAAA-MM-DD)', new Date().toISOString().slice(0, 10));
                  if (f) onGuardar({ ...h, fechaPago: f }).catch(err);
                }}
                className="flex items-center gap-1 text-amber-700 hover:underline whitespace-nowrap"
              >
                <Check size={11} /> Marcar pagado
              </button>
            )}
            <button onClick={() => confirm('¿Eliminar este concepto?') && onEliminar(h.id).catch(err)} className="text-navy-900/30 hover:text-red-600">
              <Trash2 size={11} />
            </button>
          </div>
        ))}
        {honorarios.length === 0 && <div className="text-xs text-navy-900/40">Sin honorarios registrados.</div>}
      </div>
      <div className="mt-3 border-t border-navy-900/10 pt-2 space-y-1.5">
        <select value={nuevo.expedienteId} onChange={(e) => setNuevo({ ...nuevo, expedienteId: e.target.value })} className="w-full border border-navy-900/15 rounded px-2 py-1 text-[11px]">
          <option value="">General (sin expediente)</option>
          {expedientes.map((e) => (
            <option key={e.id} value={e.id}>{nombreExp(e.id)}</option>
          ))}
        </select>
        <div className="flex gap-1.5">
          <input value={nuevo.concepto} onChange={(e) => setNuevo({ ...nuevo, concepto: e.target.value })} placeholder="Concepto" className="flex-1 border border-navy-900/15 rounded px-2 py-1 text-[11px]" />
          <input value={nuevo.monto} onChange={(e) => setNuevo({ ...nuevo, monto: e.target.value })} placeholder="Monto" className="w-24 border border-navy-900/15 rounded px-2 py-1 text-[11px]" />
        </div>
        <div className="flex gap-1.5">
          <input value={nuevo.evento} onChange={(e) => setNuevo({ ...nuevo, evento: e.target.value })} placeholder="Se cobra en (audiencia, sentencia…)" className="flex-1 border border-navy-900/15 rounded px-2 py-1 text-[11px]" />
          <input type="date" value={nuevo.pagado} onChange={(e) => setNuevo({ ...nuevo, pagado: e.target.value })} title="Fecha de pago (vacío = pendiente)" className="w-32 border border-navy-900/15 rounded px-1 py-1 text-[11px]" />
        </div>
        <button onClick={agregar} className="flex items-center gap-1 bg-navy-900 text-cream text-[11px] px-3 py-1.5 rounded-md">
          <Plus size={11} /> Agregar
        </button>
      </div>
    </div>
  );
}

export default function InformesView({ userEmail, onClose }: Props) {
  const { clientes, error: errClientes } = useClientes();
  const [clienteId, setClienteId] = useState<number | null>(null);
  const { expedientes, informes, honorarios, guardarHonorario, eliminarHonorario, loading, error, guardarDatosExpediente, guardarInforme, eliminarInforme, cambiarVisibilidadActuacion } = useInformesCliente(clienteId, userEmail);

  const [incluirEstadoCuenta, setIncluirEstadoCuenta] = useState(false);
  const [editando, setEditando] = useState<(Partial<Informe> & { tipo: TipoInforme }) | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!clienteId && clientes.length === 1) setClienteId(clientes[0].id);
  }, [clientes, clienteId]);

  const cliente = clientes.find((c) => c.id === clienteId) ?? null;
  const activos = expedientes.filter((e) => !e.concluido);
  const exposicion = useMemo(() => activos.reduce((s, e) => s + (e.montoRiesgo ?? 0), 0), [activos]);
  const proximos = useMemo(
    () =>
      activos
        .flatMap((e) => [
          e.fechaLimite ? { fecha: e.fechaLimite, txt: `${e.numero}: ${e.proximo || 'Fecha límite'}` } : null,
          e.audienciaFecha ? { fecha: e.audienciaFecha, txt: `${e.numero}: Audiencia ${e.audienciaHora?.slice(0, 5) ?? ''}` } : null,
        ])
        .filter((x): x is { fecha: string; txt: string } => !!x && x.fecha >= hoy())
        .sort((a, b) => a.fecha.localeCompare(b.fecha))
        .slice(0, 6),
    [activos]
  );

  const ultimoInformeCliente = informes.find((i) => i.tipo === 'cliente' && i.estado === 'enviado');

  const nuevo = (tipo: TipoInforme) => {
    if (!cliente) return;
    const desde = ultimoInformeCliente?.periodoFin ?? null;
    const hasta = hoy();
    setEditando({
      tipo,
      clienteId: cliente.id,
      periodoInicio: desde,
      periodoFin: hasta,
      titulo: `${tipo === 'cliente' ? 'Informe de asuntos' : 'Informe interno'} — ${cliente.nombre} — ${fmtFecha(hasta)}`,
      contenido: construirBorrador(tipo, cliente, expedientes, desde, hasta, honorarios, incluirEstadoCuenta),
      estado: 'borrador',
    });
  };

  const regenerar = () => {
    if (!cliente || !editando) return;
    if (editando.contenido && !confirm('Se reemplazará el texto actual por un borrador nuevo. ¿Continuar?')) return;
    setEditando({ ...editando, contenido: construirBorrador(editando.tipo, cliente, expedientes, editando.periodoInicio ?? null, editando.periodoFin ?? null, honorarios, incluirEstadoCuenta) });
  };

  const guardar = async (estado: EstadoInforme) => {
    if (!editando || !cliente) return;
    setGuardando(true);
    try {
      const id = await guardarInforme(
        {
          id: editando.id,
          clienteId: cliente.id,
          tipo: editando.tipo,
          periodoInicio: editando.periodoInicio ?? null,
          periodoFin: editando.periodoFin ?? null,
          titulo: editando.titulo ?? 'Informe',
          contenido: editando.contenido ?? '',
          estado,
        },
        activos.map((e) => e.id)
      );
      setEditando({ ...editando, id, estado });
    } catch (err) {
      alert('Error al guardar: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setGuardando(false);
    }
  };

  const descargarPdf = () => {
    if (!editando) return;
    const nombre = (editando.titulo ?? 'informe').replace(/[^\w\s-áéíóúñÁÉÍÓÚÑ]/g, '').replace(/\s+/g, '_');
    generarInformePdf(editando.titulo ?? '', editando.contenido ?? '').save(`${nombre}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-cream rounded-xl w-full max-w-6xl max-h-[92vh] overflow-y-auto shadow-xl">
        <div className="bg-navy-900 text-cream px-5 py-4 flex items-center justify-between rounded-t-xl sticky top-0 z-10">
          <h3 className="font-serif text-lg flex items-center gap-2">
            <FileText size={18} /> Informes clientes
          </h3>
          <div className="flex items-center gap-3">
            <select
              value={clienteId ?? ''}
              onChange={(ev) => {
                setClienteId(ev.target.value ? Number(ev.target.value) : null);
                setEditando(null);
              }}
              className="bg-navy-800 border border-navy-700 rounded-md text-sm px-3 py-1.5 text-cream"
            >
              <option value="">Selecciona un cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            <button onClick={onClose} className="text-cream/60 hover:text-cream">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-5">
          {(errClientes || error) && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{errClientes || error}</div>}
          {!cliente ? (
            <div className="text-center text-sm text-navy-900/50 py-16">
              {clientes.length ? 'Selecciona un cliente para ver su tablero.' : 'Aún no hay clientes dados de alta en la tabla de clientes.'}
            </div>
          ) : loading && !expedientes.length ? (
            <div className="text-center text-sm text-navy-900/50 py-16">Cargando...</div>
          ) : (
            <div className="grid lg:grid-cols-[1fr_380px] gap-5">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="text-[11px] text-navy-900/50">Asuntos activos</div>
                    <div className="text-2xl font-semibold text-navy-900">{activos.length}</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="text-[11px] text-navy-900/50 flex items-center gap-1"><Lock size={10} /> Monto en riesgo</div>
                    <div className="text-lg font-semibold text-navy-900">{fmtMonto(exposicion) || '$0.00'}</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="text-[11px] text-navy-900/50">Último informe enviado</div>
                    <div className="text-sm font-semibold text-navy-900">{ultimoInformeCliente ? fmtFecha(ultimoInformeCliente.periodoFin) : 'Ninguno'}</div>
                  </div>
                </div>
                {proximos.length > 0 && (
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="text-[11px] font-semibold tracking-wide text-navy-900/50 mb-1">PRÓXIMOS</div>
                    {proximos.map((p, i) => (
                      <div key={i} className="text-xs text-navy-900/80 py-0.5">
                        <b>{fmtFecha(p.fecha)}</b> — {p.txt}
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid md:grid-cols-2 gap-3">
                  {expedientes.map((e) => (
                    <TarjetaExpediente key={e.id + (e.resumenCliente ?? '') + (e.estrategiaInterna ?? '')} e={e}
                      onGuardar={(d) => guardarDatosExpediente(e.id, d)}
                      onVisibilidad={(id, v) => cambiarVisibilidadActuacion(id, v).catch((err) => alert('Error: ' + err.message))}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white rounded-lg p-3 shadow-sm space-y-2">
                  <div className="text-[11px] font-semibold tracking-wide text-navy-900/50">NUEVO INFORME</div>
                  <div className="flex gap-2">
                    <button onClick={() => nuevo('cliente')} className="flex-1 bg-navy-900 text-cream text-xs px-3 py-2 rounded-md">Al cliente</button>
                    <button onClick={() => nuevo('interno')} className="flex-1 bg-navy-800/10 text-navy-900 text-xs px-3 py-2 rounded-md border border-navy-900/15">Interno / estrategia</button>
                  </div>
                  <label className="flex items-center gap-2 text-[11px] text-navy-900/70">
                    <input type="checkbox" checked={incluirEstadoCuenta} onChange={(e) => setIncluirEstadoCuenta(e.target.checked)} />
                    Incluir estado de cuenta de honorarios en el informe al cliente
                  </label>
                  <div className="text-[10px] text-navy-900/50">
                    El borrador toma el estado de cada expediente y las actuaciones desde el último informe enviado. El informe al cliente solo incluye actuaciones visibles al cliente y nunca la estrategia ni los riesgos.
                  </div>
                </div>

                {editando && (
                  <div className="bg-white rounded-lg p-3 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-semibold tracking-wide text-navy-900/50">
                        {editando.tipo === 'cliente' ? 'INFORME AL CLIENTE' : 'INFORME INTERNO'} · {editando.estado?.toUpperCase()}
                      </div>
                      <button onClick={() => setEditando(null)} className="text-navy-900/40 hover:text-navy-900"><X size={14} /></button>
                    </div>
                    <input
                      value={editando.titulo ?? ''}
                      onChange={(ev) => setEditando({ ...editando, titulo: ev.target.value })}
                      className="w-full border border-navy-900/15 rounded-md px-2 py-1.5 text-xs font-semibold"
                    />
                    <div className="flex gap-2 text-[11px] items-center">
                      Del
                      <input type="date" value={editando.periodoInicio ?? ''} onChange={(ev) => setEditando({ ...editando, periodoInicio: ev.target.value || null })} className="border border-navy-900/15 rounded px-1 py-0.5" />
                      al
                      <input type="date" value={editando.periodoFin ?? ''} onChange={(ev) => setEditando({ ...editando, periodoFin: ev.target.value || null })} className="border border-navy-900/15 rounded px-1 py-0.5" />
                      <button onClick={regenerar} title="Regenerar borrador" className="ml-auto flex items-center gap-1 text-navy-700 hover:underline">
                        <Wand2 size={12} /> Regenerar
                      </button>
                    </div>
                    <textarea
                      value={editando.contenido ?? ''}
                      onChange={(ev) => setEditando({ ...editando, contenido: ev.target.value })}
                      rows={18}
                      className="w-full border border-navy-900/15 rounded-md px-2 py-1.5 text-xs font-mono leading-relaxed"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => guardar('borrador')} disabled={guardando} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md border border-navy-900/15">
                        <Save size={12} /> Borrador
                      </button>
                      <button onClick={() => guardar('revisado')} disabled={guardando} className="text-xs px-3 py-1.5 rounded-md border border-navy-900/15">Revisado</button>
                      <button
                        onClick={() => confirm('¿Marcar como enviado al cliente? El periodo del siguiente informe empezará en la fecha final de este.') && guardar('enviado')}
                        disabled={guardando || editando.tipo !== 'cliente'}
                        className="text-xs px-3 py-1.5 rounded-md bg-gold-500 text-navy-900 font-semibold disabled:opacity-40"
                      >
                        Marcar enviado
                      </button>
                      <button onClick={descargarPdf} className="ml-auto flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-navy-900 text-cream">
                        <Download size={12} /> PDF
                      </button>
                    </div>
                  </div>
                )}

                <PanelHonorarios
                  honorarios={honorarios}
                  expedientes={expedientes}
                  clienteId={cliente.id}
                  onGuardar={guardarHonorario}
                  onEliminar={eliminarHonorario}
                />

                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="text-[11px] font-semibold tracking-wide text-navy-900/50 mb-2">HISTORIAL</div>
                  {informes.length === 0 ? (
                    <div className="text-xs text-navy-900/40">Sin informes todavía.</div>
                  ) : (
                    informes.map((i) => (
                      <div key={i.id} className="flex items-center gap-2 py-1.5 border-b border-navy-900/5 last:border-0">
                        <button onClick={() => setEditando({ ...i })} className="flex-1 text-left text-xs text-navy-900 hover:underline truncate">
                          {i.titulo}
                        </button>
                        <span className="text-[10px] text-navy-900/50">{i.tipo === 'cliente' ? 'Cliente' : 'Interno'} · {i.estado}</span>
                        <button
                          onClick={() => confirm('¿Eliminar este informe?') && eliminarInforme(i.id).catch((e) => alert(e.message))}
                          className="text-navy-900/30 hover:text-red-600"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
