import { useCallback, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { ls } from '@/lib/utils'
import toast from 'react-hot-toast'

const DEMO_OTP = '123456'

const isConfigured = () =>
  !!(
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co'
  )

interface PendingOTP { contact: string; otp: string; expires: number }
const setPendingOTP = (contact: string) => {
  const record: PendingOTP = { contact, otp: DEMO_OTP, expires: Date.now() + 5 * 60 * 1000 }
  ls.set('bake-pending-otp', record)
  return DEMO_OTP
}
const verifyPendingOTP = (contact: string, otp: string): boolean => {
  const record = ls.get<PendingOTP | null>('bake-pending-otp', null)
  if (!record) return false
  if (record.contact !== contact) return false
  if (Date.now() > record.expires) return false
  if (record.otp !== otp) return false
  ls.set('bake-pending-otp', null)
  return true
}

export function useAuth() {
  const { user, login, logout } = useAuthStore()
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    if (!isConfigured()) return
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const u = session.user
        const name = u.user_metadata?.full_name || u.email?.split('@')[0] || 'User'
        const avatar = u.user_metadata?.avatar_url || '👤'
        login({ id: u.id, name, email: u.email || '', avatar })
        toast.success(`স্বাগতম ${name}! 🎂`)
      }
    })
    return () => subscription.unsubscribe()
  }, [login])

  const sendOTP = useCallback(async (contact: string, method: 'phone' | 'email'): Promise<void> => {
    setSending(true)
    try {
      if (isConfigured()) {
        if (method === 'phone') {
          const phone = contact.startsWith('+') ? contact : `+880${contact.replace(/^0/, '')}`
          const { error } = await supabase.auth.signInWithOtp({ phone })
          if (error) throw new Error(error.message)
        } else {
          const { error } = await supabase.auth.signInWithOtp({
            email: contact,
            options: { shouldCreateUser: true },
          })
          if (error) throw new Error(error.message)
        }
        toast.success(`OTP পাঠানো হয়েছে ${method === 'phone' ? contact : 'ইমেইলে'}!`)
      } else {
        setPendingOTP(contact)
        toast.success(`Demo মোড — OTP: ${DEMO_OTP}`, { duration: 6000 })
      }
    } finally {
      setSending(false)
    }
  }, [])

  const verifyOTP = useCallback(async (
    contact: string,
    otp: string,
    method: 'phone' | 'email',
    name: string
  ): Promise<void> => {
    setVerifying(true)
    try {
      if (isConfigured()) {
        let userId: string
        let userEmail = ''

        if (method === 'phone') {
          const phone = contact.startsWith('+') ? contact : `+880${contact.replace(/^0/, '')}`
          const { data, error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' })
          if (error) throw new Error('ভুল OTP! আবার চেষ্টা করুন')
          userId = data.user!.id
        } else {
          const { data, error } = await supabase.auth.verifyOtp({ email: contact, token: otp, type: 'email' })
          if (error) throw new Error('ভুল OTP! আবার চেষ্টা করুন')
          userId = data.user!.id
          userEmail = contact
        }

        if (name) {
          await supabase.from('profiles').upsert({ id: userId, name, contact }, { onConflict: 'id' })
        }

        const { data: profile } = await supabase.from('profiles').select('name').eq('id', userId).single()
        const finalName = profile?.name || name || contact.split('@')[0]

        login({ id: userId, name: finalName, email: userEmail, avatar: '👤' })
        toast.success(`স্বাগতম ${finalName}! 🎂`)
      } else {
        if (!verifyPendingOTP(contact, otp)) throw new Error(`ভুল OTP! Demo তে ${DEMO_OTP} দিন`)
        if (!name.trim()) throw new Error('নাম দিন')

        const users = ls.get<Array<{ id: string; name: string; contact: string }>>('bake-local-users', [])
        const existing = users.find((u) => u.contact === contact)
        const userId = existing?.id || `local-${Date.now()}`
        const finalName = name || existing?.name || contact

        if (!existing) {
          ls.set('bake-local-users', [...users, { id: userId, name: finalName, contact }])
        }

        login({ id: userId, name: finalName, email: contact.includes('@') ? contact : '', avatar: '👤' })
        toast.success(`স্বাগতম ${finalName}! 🎂`)
      }
    } finally {
      setVerifying(false)
    }
  }, [login])

  const isAdmin = useCallback(async (): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser()
    return user?.app_metadata?.role === 'admin'
  }, [])

  const signInWithGoogle = useCallback(async () => {
    if (!isConfigured()) {
      toast.error('Google login এর জন্য Supabase দরকার')
      return
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    if (error) toast.error(error.message)
  }, [])

  const signOut = useCallback(async () => {
    if (isConfigured()) await supabase.auth.signOut()
    logout()
    toast.success('লগআউট সফল')
  }, [logout])

  return { user, sending, verifying, sendOTP, verifyOTP, signOut, signInWithGoogle, isAdmin }
}
