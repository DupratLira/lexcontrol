import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

const LOGIN_AT_KEY = 'lexcontrol_login_at';
const SESSION_MAX_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

function sesionExpirada(): boolean {
  const raw = localStorage.getItem(LOGIN_AT_KEY);
  if (!raw) return false; // sesion previa a este cambio: le damos un periodo de gracia
  const loginAt = Number(raw);
  if (!Number.isFinite(loginAt)) return false;
  return Date.now() - loginAt > SESSION_MAX_MS;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const aplicarSesion = (nueva: Session | null) => {
      if (nueva && sesionExpirada()) {
        localStorage.removeItem(LOGIN_AT_KEY);
        supabase.auth.signOut();
        setSession(null);
        return;
      }
      if (nueva && !localStorage.getItem(LOGIN_AT_KEY)) {
        localStorage.setItem(LOGIN_AT_KEY, Date.now().toString());
      }
      setSession(nueva);
    };

    supabase.auth.getSession().then(({ data }) => {
      aplicarSesion(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      aplicarSesion(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.session) {
      localStorage.setItem(LOGIN_AT_KEY, Date.now().toString());
    }
    return error;
  };

  const signOut = () => {
    localStorage.removeItem(LOGIN_AT_KEY);
    return supabase.auth.signOut();
  };

  return { session, loading, signIn, signOut, email: session?.user?.email ?? null };
}
