import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useRolActual(email: string) {
  const [rol, setRol] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) {
      setLoading(false);
      return;
    }
    let active = true;
    supabase
      .from('usuarios')
      .select('rol')
      .eq('email', email)
      .maybeSingle()
      .then(({ data }) => {
        if (active) {
          setRol(data?.rol ?? null);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [email]);

  return { rol, isAdmin: rol === 'admin', loading };
}
