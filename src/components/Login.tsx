import { useState } from 'react';
import { Lock, Mail } from 'lucide-react';

interface Props {
  onSignIn: (email: string, password: string) => Promise<string | null>;
}

export default function Login({ onSignIn }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const err = await onSignIn(email, password);
    setLoading(false);
    if (err) setError(err);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-800 px-4 py-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-navy-400/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full border-2 border-gold-400 flex items-center justify-center bg-navy-900 shadow-xl mb-4">
            <span className="font-serif text-2xl font-bold text-gold-400">DL</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-cream uppercase tracking-wide text-center">Duprat Lira</h1>
          <p className="text-gold-300/80 text-xs font-semibold uppercase tracking-[0.3em] mt-1">Abogados</p>
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-gold-400 to-transparent mt-3" />
          <p className="text-navy-200/60 text-[11px] mt-3 font-medium tracking-wide">Control Interno Jurídico</p>
        </div>

        <form onSubmit={submit} className="bg-white rounded-xl shadow-xl p-6 space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}

          <div>
            <label className="block text-[11px] font-semibold tracking-wide text-navy-900/50 mb-1">CORREO</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-900/30" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-navy-900/10 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40"
                placeholder="tu@correo.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold tracking-wide text-navy-900/50 mb-1">CONTRASEÑA</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-900/30" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-navy-900/10 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy-900 hover:bg-navy-800 disabled:opacity-60 text-cream rounded-lg py-2.5 text-sm font-medium transition-colors"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="text-center text-xs text-navy-200/50 mt-5">
          Usa el mismo correo y contraseña de tu cuenta de Supabase / LexControl.
        </p>
        <p className="text-center text-[11px] text-navy-300/40 mt-2">
          Insurgentes Sur 300, Roma Norte, CDMX · 55 5160-1668
        </p>
      </div>
    </div>
  );
}
