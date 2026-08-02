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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full border-2 border-gold-400 flex items-center justify-center text-gold-500 font-serif font-bold text-xl mb-3">
            DL
          </div>
          <div className="font-serif text-2xl tracking-wide text-navy-900">DUPRAT LIRA</div>
          <div className="text-[11px] tracking-[0.2em] text-navy-900/50 mt-1">ABOGADOS · CONTROL INTERNO</div>
        </div>

        <form onSubmit={submit} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
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

        <p className="text-center text-xs text-navy-900/40 mt-5">
          Usa el mismo correo y contraseña de tu cuenta de Supabase / LexControl.
        </p>
      </div>
    </div>
  );
}
