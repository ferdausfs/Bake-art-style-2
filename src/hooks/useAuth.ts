import { useCallback, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';
import { ls, isSupabaseConfigured } from '../lib/utils';

export function useAuth() {
  const { user, login, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const u = session.user;
        const name = u.user_metadata?.full_name || u.email?.split('@')[0] || 'User';
        const avatar = u.user_metadata?.avatar_url || '👤';
        login({ id: u.id, name, email: u.email || '', avatar });
      }
    });
    return () => subscription.unsubscribe();
  }, [login]);

  const signUp = useCallback(async (email: string, password: string, name: string): Promise<{ needsEmailConfirmation: boolean }> => {
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (error) throw new Error(error.message);
        if (data.user) {
          await supabase.from('profiles').upsert({ id: data.user.id, name, contact: email }, { onConflict: 'id' });
          if (!data.session) {
            return { needsEmailConfirmation: true };
          } else {
            login({ id: data.user.id, name, email, avatar: '👤' });
            return { needsEmailConfirmation: false };
          }
        }
        return { needsEmailConfirmation: true };
      } else {
        const accounts = ls.get<Array<any>>('bakeart-local-accounts', []);
        const existing = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
        if (existing) {
          throw new Error('An account with this email already exists. Please sign in instead.');
        }
        const id = `local-${Date.now()}`;
        const newAcc = { id, name, email, password };
        ls.set('bakeart-local-accounts', [...accounts, newAcc]);
        login({ id, name, email, avatar: '👤' });
        return { needsEmailConfirmation: false };
      }
    } finally {
      setLoading(false);
    }
  }, [login]);

  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error('Wrong email or password.');
        if (data.user) {
          const name = data.user.user_metadata?.full_name || email.split('@')[0] || 'User';
          login({ id: data.user.id, name, email, avatar: '👤' });
        }
      } else {
        const accounts = ls.get<Array<any>>('bakeart-local-accounts', []);
        const matched = accounts.find(
          (a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password
        );
        if (!matched) {
          throw new Error('Wrong email or password.');
        }
        login({ id: matched.id, name: matched.name, email, avatar: '👤' });
      }
    } finally {
      setLoading(false);
    }
  }, [login]);

  const signInWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      throw new Error('Google login requires Supabase to be configured');
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw new Error(error.message);
  }, []);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured()) await supabase.auth.signOut();
    logout();
  }, [logout]);

  return { user, loading, signUp, signIn, signOut, signInWithGoogle };
}
