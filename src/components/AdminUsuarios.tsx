import { useEffect, useState } from 'react';
import { X, Plus, Trash2, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface Usuario {
  id: string;
  nombre_completo: string;
  email: string;
  rol: string;
  activo: boolean;
  creado_en: string;
}

interface ExpedienteOpcion {
  id: number;
  numero: string;
  actor: string;
  demandado: string;
}

interface Props {
  onClose: () => void;
}

export default function AdminUsuarios({ onClose }: Props) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState('abogado');
  const [creating, setCreating] = useState(false);

  const [expedientesDisponibles, setExpedientesDisponibles] = useState<ExpedienteOpcion[]>([]);
  const [expedientesSeleccionados, setExpedientesSeleccionados] = useState<number[]>([]);
  const [buscarExpediente, setBuscarExpediente] = useState('');

  const cargar = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.functions.invoke('admin-users', {
      body: { action: 'list' },
    });
    if (err) {
      setError(err.message);
    } else if (data?.error) {
      setError(data.error);
    } else {
      setUsuarios(data.usuarios ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargar();
  }, []);

  useEffect(() => {
    if (rol !== 'cliente') return;
    supabase
      .from('expedientes')
      .select('id, numero_expediente, actor, demandado')
      .eq('concluido', false)
      .order('numero_expediente')
      .then(({ data }) => {
        setExpedientesDisponibles(
          (data ?? []).map((e: { id: number; numero_expediente: string; actor: string; demandado: string }) => ({
            id: e.id,
            numero: e.numero_expediente,
            actor: e.actor,
            demandado: e.demandado,
          }))
        );
      });
  }, [rol]);

  const crear = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Correo y contraseña son obligatorios.');
      return;
    }
    if (rol === 'cliente' && expedientesSeleccionados.length === 0) {
      setError('Selecciona al menos un expediente al que este cliente podrá tener acceso.');
      return;
    }
    setCreating(true);
    setError(null);
    const { data, error: err } = await supabase.functions.invoke('admin-users', {
      body: {
        action: 'create',
        email: email.trim(),
        password,
        nombreCompleto: nombre.trim(),
        rol,
        expedienteIds: rol === 'cliente' ? expedientesSeleccionados : undefined,
      },
    });
    setCreating(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (data?.error) {
      setError(data.error);
      return;
    }
    setEmail('');
    setPassword('');
    setNombre('');
    setRol('abogado');
    setExpedientesSeleccionados([]);
    setBuscarExpediente('');
    await cargar();
  };

  const filtrados = expedientesDisponibles.filter((e) => {
    const q = buscarExpediente.trim().toLowerCase();
    if (!q) return true;
    return (
      e.numero.toLowerCase().includes(q) ||
      e.actor.toLowerCase().includes(q) ||
      e.demandado.toLowerCase().includes(q)
    );
  });

  const eliminar = async (userId: string, correo: string) => {
    if (!confirm(`¿Eliminar la cuenta de ${correo}? Esta acción no se puede deshacer.`)) return;
    const { data, error: err } = await supabase.functions.invoke('admin-users', {
      body: { action: 'delete', userId },
    });
    if (err) {
      setError(err.message);
      return;
    }
    if (data?.error) {
      setError(data.error);
      return;
    }
    await cargar();
  };

  const cambiarActivo = async (userId: string, activo: boolean) => {
    const { data, error: err } = await supabase.functions.invoke('admin-users', {
      body: { action: 'setRole', userId, activo },
    });
    if (err) {
      setError(err.message);
      return;
    }
    if (data?.error) {
      setError(data.error);
      return;
    }
    await cargar();
  };

  return (
    <div className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="bg-navy-900 text-cream px-5 py-4 flex items-center justify-between rounded-t-xl sticky top-0">
          <h3 className="font-serif text-lg flex items-center gap-2">
            <ShieldCheck size={18} /> Usuarios del sistema
          </h3>
          <button onClick={onClose} className="text-cream/60 hover:text-cream">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}

          <div className="border border-navy-900/10 rounded-lg p-4 space-y-3">
            <div className="text-[11px] font-semibold tracking-wide text-navy-900/50">CREAR NUEVO USUARIO</div>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Correo"
                type="email"
                className="border border-navy-900/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40"
              />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña temporal"
                type="text"
                className="border border-navy-900/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40"
              />
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre completo"
                className="border border-navy-900/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40"
              />
              <select
                value={rol}
                onChange={(e) => {
                  setRol(e.target.value);
                  setExpedientesSeleccionados([]);
                }}
                className="border border-navy-900/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40"
              >
                <option value="admin">Administrador</option>
                <option value="abogado">Abogado / Staff</option>
                <option value="cliente">Cliente</option>
              </select>
            </div>

            {rol === 'cliente' && (
              <div className="border border-blue-200 bg-blue-50/50 rounded-lg p-3 space-y-2">
                <div className="text-[11px] font-semibold tracking-wide text-navy-900/60">
                  EXPEDIENTES A LOS QUE TENDRÁ ACCESO DE SOLO LECTURA ({expedientesSeleccionados.length} seleccionados)
                </div>
                <input
                  value={buscarExpediente}
                  onChange={(e) => setBuscarExpediente(e.target.value)}
                  placeholder="Buscar por número, actor o demandado..."
                  className="w-full border border-navy-900/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40"
                />
                <div className="max-h-48 overflow-y-auto border border-navy-900/10 rounded-lg bg-white divide-y divide-navy-900/5">
                  {filtrados.length === 0 && (
                    <p className="text-sm text-navy-900/40 px-3 py-3">Sin coincidencias.</p>
                  )}
                  {filtrados.map((exp) => {
                    const checked = expedientesSeleccionados.includes(exp.id);
                    return (
                      <label
                        key={exp.id}
                        className="flex items-start gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-navy-900/[0.02]"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setExpedientesSeleccionados((prev) =>
                              checked ? prev.filter((id) => id !== exp.id) : [...prev, exp.id]
                            )
                          }
                          className="mt-0.5"
                        />
                        <span>
                          <span className="font-medium text-navy-900">Exp. {exp.numero}</span>{' '}
                          <span className="text-navy-900/50">
                            — {exp.actor} vs {exp.demandado}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              onClick={crear}
              disabled={creating}
              className="flex items-center gap-2 bg-navy-900 hover:bg-navy-800 disabled:opacity-60 text-cream px-4 py-2 rounded-lg text-sm font-medium"
            >
              <Plus size={15} /> {creating ? 'Creando...' : 'Crear usuario'}
            </button>
          </div>

          <div>
            <div className="text-[11px] font-semibold tracking-wide text-navy-900/50 mb-2">
              USUARIOS ({usuarios.length})
            </div>
            {loading ? (
              <p className="text-sm text-navy-900/40">Cargando...</p>
            ) : (
              <ul className="divide-y divide-navy-900/5 border border-navy-900/10 rounded-lg overflow-hidden">
                {usuarios.map((u) => (
                  <li key={u.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-navy-900 truncate">
                        {u.nombre_completo || u.email}
                      </div>
                      <div className="text-xs text-navy-900/50 truncate">
                        {u.email} · {u.rol}
                        {!u.activo ? ' · inactivo' : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => cambiarActivo(u.id, !u.activo)}
                        className="text-xs px-2 py-1 rounded-lg border border-navy-900/10 text-navy-900/70 hover:bg-navy-900/5"
                      >
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                      <button onClick={() => eliminar(u.id, u.email)} className="text-red-600 hover:text-red-700">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
