import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const validateEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export function AuthSheet({ open, onClose, onSuccess }: Props) {
  const { user, loading, signUp, signIn, signOut, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const reset = () => {
    setMode('signin');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setShowPassword(false);
    setNeedsConfirmation(false);
    setToast(null);
  };

  useEffect(() => { if (!open) reset(); }, [open]);

  if (!open) return null;

  // Logged-in view
  if (user) {
    return (
      <>
        <div className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm" onClick={onClose} />
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] z-[61] bg-[var(--color-cream)] rounded-t-3xl p-6 shadow-2xl">
          <div className="w-10 h-1 bg-[var(--color-ink)]/10 rounded-full mx-auto mb-5" />
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-[var(--color-coral)]/10 flex items-center justify-center text-3xl mx-auto mb-3">
              {user.avatar || '👤'}
            </div>
            <p className="font-bold text-[var(--color-ink)] text-lg">{user.name}</p>
            {user.email && <p className="text-sm text-[var(--color-ink)]/50">{user.email}</p>}
          </div>
          <button onClick={() => { signOut(); onClose(); }}
            className="w-full py-3 rounded-2xl bg-red-50 text-red-600 font-bold text-sm mb-2">
            Sign Out
          </button>
          <button onClick={onClose}
            className="w-full py-2.5 text-[var(--color-ink)]/50 text-sm font-medium">
            Close
          </button>
        </div>
      </>
    );
  }

  const handleSignIn = async () => {
    if (!email.trim() || !validateEmail(email)) {
      showToast('Please enter a valid email.', 'err');
      return;
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'err');
      return;
    }
    try {
      await signIn(email.trim(), password);
      showToast('Signed in successfully!', 'ok');
      onSuccess?.();
      onClose();
    } catch (e: any) {
      showToast(e.message || 'Wrong email or password.', 'err');
    }
  };

  const handleSignUp = async () => {
    if (!name.trim()) {
      showToast('Please enter your name.', 'err');
      return;
    }
    if (!email.trim() || !validateEmail(email)) {
      showToast('Please enter a valid email.', 'err');
      return;
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'err');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'err');
      return;
    }
    try {
      const res = await signUp(email.trim(), password, name.trim());
      if (res.needsEmailConfirmation) {
        setNeedsConfirmation(true);
      } else {
        showToast('Account created successfully!', 'ok');
        onSuccess?.();
        onClose();
      }
    } catch (e: any) {
      showToast(e.message || 'Failed to create account.', 'err');
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Google login failed', 'err');
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm" onClick={onClose} />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] z-[61] bg-[var(--color-cream)] rounded-t-3xl shadow-2xl">
        {/* Handle */}
        <div className="w-10 h-1 bg-[var(--color-ink)]/10 rounded-full mx-auto mt-3" />

        {/* Header */}
        <div className="px-6 pt-4 pb-3 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-[var(--color-ink)] text-lg">
              {needsConfirmation ? 'Check Your Email' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </h2>
            <p className="text-xs text-[var(--color-ink)]/50 mt-0.5">
              {needsConfirmation
                ? `Verification link sent to ${email}`
                : mode === 'signin'
                ? 'Sign in to access your orders and settings'
                : 'Create an account to start ordering delicious cakes'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[var(--color-ink)]/5 flex items-center justify-center">
            <X className="w-4 h-4 text-[var(--color-ink)]/60" />
          </button>
        </div>

        <div className="px-6 pb-8 space-y-4">
          {/* Toast */}
          {toast && (
            <div className={`px-4 py-2.5 rounded-xl text-sm font-medium ${toast.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {toast.msg}
            </div>
          )}

          {needsConfirmation ? (
            <div className="text-center py-4 space-y-4">
              <div className="text-5xl">📩</div>
              <p className="text-sm text-[var(--color-ink)]/70 font-medium">
                We have sent a verification link to <span className="font-bold text-[var(--color-ink)]">{email}</span>. Please click the link to confirm your account before signing in.
              </p>
              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl bg-[var(--color-coral)] text-white font-bold text-sm"
              >
                Got it
              </button>
            </div>
          ) : (
            <>
              {/* Mode toggle */}
              <div className="flex gap-1 p-1 bg-[var(--color-ink)]/5 rounded-xl">
                {([
                  { id: 'signin', label: 'Sign In' },
                  { id: 'signup', label: 'Create Account' }
                ] as const).map((m) => (
                  <button key={m.id} onClick={() => { setMode(m.id); setToast(null); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${mode === m.id ? 'bg-white text-[var(--color-coral)] shadow-sm' : 'text-[var(--color-ink)]/50'}`}>
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Form fields */}
              {mode === 'signup' && (
                <input
                  className="w-full px-4 py-3 rounded-2xl border border-[var(--color-ink)]/10 bg-white text-[var(--color-ink)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-coral)]/30"
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
                />
              )}

              <input
                className="w-full px-4 py-3 rounded-2xl border border-[var(--color-ink)]/10 bg-white text-[var(--color-ink)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-coral)]/30"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (mode === 'signin' ? handleSignIn() : handleSignUp())}
              />

              <div className="relative">
                <input
                  className="w-full px-4 py-3 pr-10 rounded-2xl border border-[var(--color-ink)]/10 bg-white text-[var(--color-ink)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-coral)]/30"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password (min 6 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (mode === 'signin' ? handleSignIn() : handleSignUp())}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-ink)]/40 hover:text-[var(--color-ink)]/60"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {mode === 'signup' && (
                <input
                  className="w-full px-4 py-3 rounded-2xl border border-[var(--color-ink)]/10 bg-white text-[var(--color-ink)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-coral)]/30"
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
                />
              )}

              <button onClick={mode === 'signin' ? handleSignIn : handleSignUp} disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[var(--color-coral)] text-white font-bold text-sm disabled:opacity-60">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? (mode === 'signin' ? 'Signing In...' : 'Creating Account...') : (mode === 'signin' ? 'Sign In' : 'Create Account')}
              </button>

              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-[var(--color-ink)]/8" />
                <span className="text-xs text-[var(--color-ink)]/40">or</span>
                <div className="flex-1 h-px bg-[var(--color-ink)]/8" />
              </div>

              {/* Google */}
              <button onClick={handleGoogle}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border border-[var(--color-ink)]/10 bg-white font-bold text-sm text-[var(--color-ink)]">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
