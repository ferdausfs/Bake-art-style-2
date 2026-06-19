import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'

type Step = 'input' | 'otp' | 'profile'
type Method = 'phone' | 'email'

function validateContact(val: string, method: Method): string | null {
  if (!val.trim()) return `${method === 'phone' ? 'ফোন নম্বর' : 'ইমেইল'} দিন`
  if (method === 'phone' && !/^01[3-9]\d{8}$/.test(val.replace(/\s/g, '')))
    return 'সঠিক বাংলাদেশি নম্বর দিন (যেমন: 01712345678)'
  if (method === 'email' && !/\S+@\S+\.\S+/.test(val))
    return 'সঠিক ইমেইল ঠিকানা দিন'
  return null
}

export function AuthModal() {
  const { user, signOut, signInWithGoogle } = useAuth()
  const { logout } = useAuthStore()
  const [step, setStep] = useState<Step>('input')
  const [method, setMethod] = useState<Method>('phone')
  const [contact, setContact] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const { sending, verifying, sendOTP, verifyOTP } = useAuth()
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])

  useEffect(() => { setOtp(otpDigits.join('')) }, [otpDigits])

  const resetModal = () => {
    setStep('input'); setContact(''); setOtp(''); setName('')
    setOtpDigits(['', '', '', '', '', ''])
  }

  const closeModal = () => {
    document.getElementById('auth-modal')?.classList.add('hidden')
    resetModal()
  }

  const handleSend = async () => {
    const err = validateContact(contact, method)
    if (err) { toast.error(err); return }
    try {
      await sendOTP(contact.trim(), method)
      setStep('otp')
      setTimeout(() => otpRefs.current[0]?.focus(), 150)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'কিছু সমস্যা হয়েছে')
    }
  }

  const handleDigit = (i: number, val: string) => {
    const d = val.replace(/\D/g, '').slice(-1)
    const next = [...otpDigits]; next[i] = d; setOtpDigits(next)
    if (d && i < 5) setTimeout(() => otpRefs.current[i + 1]?.focus(), 0)
  }
  const handleDigitKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[i] && i > 0) {
      const next = [...otpDigits]; next[i - 1] = ''; setOtpDigits(next)
      otpRefs.current[i - 1]?.focus()
    }
  }

  const handleVerify = async () => {
    const code = otpDigits.join('')
    if (code.length < 6) { toast.error('৬ সংখ্যার OTP দিন'); return }
    try {
      await verifyOTP(contact.trim(), code, method, '')
      setStep('profile')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'ভুল OTP')
      setOtpDigits(['', '', '', '', '', ''])
      otpRefs.current[0]?.focus()
    }
  }

  const handleProfile = async () => {
    if (!name.trim()) { toast.error('আপনার নাম দিন'); return }
    try {
      const { useAuthStore: store } = await import('@/lib/store')
      const current = store.getState().user
      if (current) store.getState().login({ ...current, name: name.trim() })
      toast.success(`স্বাগতম ${name.trim()}! 🎂`)
      closeModal()
    } catch {
      closeModal()
    }
  }

  const handleGoogle = async () => {
    try {
      await signInWithGoogle()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Google login ব্যর্থ')
    }
  }

  const STEPS_LABEL = ['ফোন/ইমেইল', 'OTP', 'প্রোফাইল'] as const
  const stepIdx = step === 'input' ? 0 : step === 'otp' ? 1 : 2

  if (user) {
    return (
      <div id="auth-modal" className="hidden fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
        <div className="relative card p-8 w-full max-w-sm text-center animate-scale-in">
          <div className="text-5xl mb-3">👤</div>
          <h2 className="font-bold text-xl dark:text-white">{user.name}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{user.email || 'ফোন দিয়ে লগইন'}</p>
          <button onClick={() => { signOut(); closeModal() }}
            className="w-full py-3 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-sm">
            লগআউট করুন
          </button>
          <button onClick={closeModal}
            className="mt-2 w-full py-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 text-xs font-medium transition-colors">
            বন্ধ করুন
          </button>
        </div>
      </div>
    )
  }

  return (
    <div id="auth-modal" className="hidden fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
      <div className="relative card w-full max-w-sm animate-scale-in overflow-hidden">
        <div className="bg-gradient-to-r from-rose-500 to-pink-600 px-6 pt-7 pb-5 text-white text-center">
          <div className="text-3xl mb-2">🎂</div>
          <h2 className="font-bold text-lg">বেক আর্ট স্টাইল</h2>
          <p className="text-rose-100 text-xs mt-1">
            {step === 'input' && 'লগইন বা নতুন অ্যাকাউন্ট'}
            {step === 'otp' && 'OTP যাচাই করুন'}
            {step === 'profile' && 'আপনার নাম সেট করুন'}
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {STEPS_LABEL.map((l, i) => (
              <div key={l} className="flex items-center gap-1">
                <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${i <= stepIdx ? 'bg-white/25 text-white' : 'bg-white/10 text-white/40'}`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${i < stepIdx ? 'bg-green-400 text-white' : i === stepIdx ? 'bg-white text-rose-600' : 'bg-white/20'}`}>
                    {i < stepIdx ? '✓' : i + 1}
                  </span>
                  {l}
                </div>
                {i < 2 && <span className="text-white/30 text-[10px]">›</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          {step === 'input' && (
            <div className="space-y-4">
              {/* Google Button */}
              <button onClick={handleGoogle}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all font-bold text-sm text-gray-700 dark:text-gray-200 shadow-sm">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google দিয়ে লগইন
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200 dark:bg-slate-600" />
                <span className="text-xs text-gray-400">অথবা</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-slate-600" />
              </div>

              <div className="flex gap-1.5 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl">
                {(['phone', 'email'] as Method[]).map((m) => (
                  <button key={m} onClick={() => { setMethod(m); setContact('') }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${method === m ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
                    {m === 'phone' ? '📱 ফোন নম্বর' : '📧 ইমেইল'}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                  {method === 'phone' ? 'মোবাইল নম্বর' : 'ইমেইল ঠিকানা'}
                </label>
                <input className="input text-sm" type={method === 'phone' ? 'tel' : 'email'}
                  placeholder={method === 'phone' ? '01712345678' : 'example@gmail.com'}
                  value={contact} onChange={(e) => setContact(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()} autoFocus />
              </div>
              <button onClick={handleSend} disabled={sending}
                className="btn-primary w-full justify-center py-3 text-sm disabled:opacity-60 disabled:cursor-not-allowed">
                {sending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    পাঠানো হচ্ছে...
                  </span>
                ) : 'OTP পাঠান →'}
              </button>
              <p className="text-center text-[10px] text-gray-400 dark:text-gray-500">
                লগইন করলে আমাদের{' '}
                <span className="text-rose-500 cursor-pointer hover:underline">Privacy Policy</span>{' '}
                মেনে নিচ্ছেন
              </p>
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-5">
              <div className="text-center">
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  {method === 'phone' ? '📱' : '📧'} <strong className="dark:text-white">{contact}</strong> এ OTP পাঠানো হয়েছে
                </p>
              </div>
              <div className="flex justify-center gap-2">
                {otpDigits.map((d, i) => (
                  <input key={i}
                    ref={(el) => { otpRefs.current[i] = el }}
                    type="text" inputMode="numeric" maxLength={1}
                    value={d} onChange={(e) => handleDigit(i, e.target.value)}
                    onKeyDown={(e) => handleDigitKey(i, e)}
                    className={`w-11 h-12 text-center text-xl font-black rounded-xl border-2 bg-gray-50 dark:bg-slate-800 dark:text-white outline-none transition-all ${d ? 'border-rose-400 bg-rose-50 dark:bg-rose-900/20' : 'border-gray-200 dark:border-slate-600'} focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20`}
                  />
                ))}
              </div>
              <button onClick={handleVerify} disabled={verifying || otp.length < 6}
                className="btn-primary w-full justify-center py-3 text-sm disabled:opacity-60">
                {verifying ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    যাচাই হচ্ছে...
                  </span>
                ) : 'যাচাই করুন ✓'}
              </button>
              <div className="flex items-center justify-between text-xs">
                <button onClick={() => { setStep('input'); setOtpDigits(['', '', '', '', '', '']) }}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                  ← পেছনে
                </button>
                <button onClick={handleSend} disabled={sending}
                  className="text-rose-500 hover:text-rose-600 font-medium disabled:opacity-50">
                  আবার পাঠান
                </button>
              </div>
            </div>
          )}

          {step === 'profile' && (
            <div className="space-y-4">
              <div className="text-center py-2">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-3xl mx-auto mb-3">✅</div>
                <p className="text-sm font-bold text-gray-800 dark:text-white">OTP যাচাই সফল!</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">এখন আপনার নাম দিন</p>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">আপনার নাম</label>
                <input className="input text-sm" type="text" placeholder="যেমন: রাহেলা বেগম"
                  value={name} onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleProfile()} autoFocus />
              </div>
              <button onClick={handleProfile}
                className="btn-primary w-full justify-center py-3 text-sm">
                🎂 শুরু করুন!
              </button>
            </div>
          )}
        </div>

        <button onClick={closeModal}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-sm font-bold transition-colors">
          ✕
        </button>
      </div>
    </div>
  )
}
