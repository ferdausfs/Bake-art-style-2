import { useState, useEffect } from 'react'
import { useSettingsStore } from '@/lib/store'
import { toBn } from '@/lib/utils'

export function SpecialOffers() {
  const { settings } = useSettingsStore()
  const [timeLeft, setTimeLeft] = useState(() => {
    const now = new Date()
    const midnight = new Date(now)
    midnight.setHours(23, 59, 59, 999)
    const diff = Math.floor((midnight.getTime() - now.getTime()) / 1000)
    return { h: Math.max(0, Math.floor(diff / 3600)), m: Math.max(0, Math.floor((diff % 3600) / 60)), s: Math.max(0, diff % 60) }
  })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setTimeLeft((p) => {
      let { h, m, s } = p; s--
      if (s < 0) { s = 59; m-- }
      if (m < 0) { m = 59; h-- }
      if (h < 0) return { h: 0, m: 0, s: 0 }
      return { h, m, s }
    }), 1000)
    return () => clearInterval(t)
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(settings.promoCode).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!settings.promoEnabled) return null

  return (
    <section className="py-10 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-rose-500 via-pink-600 to-purple-600 rounded-3xl p-8 sm:p-10 text-white shadow-xl shadow-rose-500/25 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Blobs */}
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -left-5 -top-5 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />

          {/* Left: Offer info */}
          <div className="relative z-10 text-center lg:text-left">
            <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              ⚡ সীমিত সময়ের অফার
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold mt-3 mb-2">{settings.promoTitle}</h2>
            <p className="text-rose-100 text-sm mb-5">আজকের ডিলঃ {toBn(settings.promoPercent)}% ছাড় পাবেন এই কোড দিয়ে</p>
            <div className="inline-flex items-center gap-2 bg-black/20 backdrop-blur p-1.5 rounded-xl border border-white/20">
              <span className="font-mono font-bold text-lg px-4 tracking-widest text-amber-300 select-all">
                {settings.promoCode}
              </span>
              <button onClick={handleCopy}
                className="bg-white text-rose-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-rose-50 transition-colors">
                {copied ? '✓ কপি হয়েছে!' : 'কোড কপি করুন'}
              </button>
            </div>
          </div>

          {/* Right: Countdown */}
          <div className="relative z-10 flex flex-col items-center bg-black/20 backdrop-blur p-5 rounded-2xl border border-white/10 min-w-[220px] flex-shrink-0">
            <p className="text-xs font-bold text-rose-200 mb-3 uppercase tracking-wider">⏳ শেষ হতে বাকি</p>
            <div className="flex items-end gap-2">
              {[{ v: timeLeft.h, l: 'ঘণ্টা' }, { v: timeLeft.m, l: 'মিনিট' }, { v: timeLeft.s, l: 'সেকেন্ড' }].map((x, i) => (
                <div key={x.l} className="flex items-end gap-2">
                  {i > 0 && <span className="text-xl font-bold text-rose-200 mb-4">:</span>}
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-xl bg-white text-rose-600 flex items-center justify-center font-black text-xl shadow-inner">
                      {toBn(x.v).toString().padStart(2, '0')}
                    </div>
                    <span className="text-[10px] text-rose-100 mt-1 block">{x.l}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
