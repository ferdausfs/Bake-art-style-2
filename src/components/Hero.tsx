import { useState, useEffect, useRef, useCallback } from 'react'
import { useUIStore, useSettingsStore } from '@/lib/store'
import { useProducts } from '@/hooks/useProducts'
import { toBn, waLink } from '@/lib/utils'

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.135.561 4.135 1.535 5.872L.057 23.116a.75.75 0 0 0 .916.938l5.453-1.434A11.935 11.935 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.722 9.722 0 0 1-4.95-1.352l-.355-.21-3.677.967.984-3.597-.23-.37A9.712 9.712 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
    </svg>
  )
}

export function Hero() {
  const { setAdminOpen, setTrackingOpen } = useUIStore()
  const settings = useSettingsStore((s) => s.settings)
  const { products } = useProducts()
  const [activeBest, setActiveBest] = useState(0)
  const [tapCount, setTapCount] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const featuredProducts = products.filter((p) => p.approved && p.tag).slice(0, 4)
  const activeProduct = featuredProducts[activeBest % Math.max(1, featuredProducts.length)] ?? products[0]

  useEffect(() => {
    if (featuredProducts.length < 2) return
    const id = setInterval(() => setActiveBest((i) => (i + 1) % featuredProducts.length), 3800)
    return () => clearInterval(id)
  }, [featuredProducts.length])

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const handleBadgeTap = useCallback(() => {
    const next = tapCount + 1
    setTapCount(next)
    if (next >= 7) { setAdminOpen(true); setTapCount(0); return }
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setTapCount(0), 4000)
  }, [tapCount, setAdminOpen])

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center pt-20 pb-16 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-rose-950 bg-[length:200%_200%] animate-gradient-shift" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-rose-300/25 dark:bg-rose-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-300/20 dark:bg-purple-900/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 left-8 sm:left-16 text-3xl sm:text-4xl animate-float opacity-60 select-none pointer-events-none">🎂</div>
      <div className="absolute top-1/3 right-10 sm:right-20 text-3xl sm:text-4xl animate-float-delay opacity-60 select-none pointer-events-none">🧁</div>
      <div className="absolute bottom-1/4 left-12 sm:left-24 text-2xl animate-float-delay opacity-50 select-none pointer-events-none">✨</div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <button onClick={handleBadgeTap}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-rose-100 dark:border-slate-700 shadow-md shadow-rose-500/10 mb-6 cursor-default select-none active:scale-95 transition-transform hover:shadow-lg hover:shadow-rose-500/15">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400">হোমমেড কেক, ডেলিভারি সার্ভিস</span>
              {tapCount >= 3 && <span className="ml-1 text-[9px] text-rose-300 dark:text-rose-700">{toBn(tapCount)}/৭</span>}
            </button>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
              বেক <span className="bg-gradient-to-r from-rose-500 via-pink-600 to-purple-600 bg-clip-text text-transparent">আর্ট</span> স্টাইল
            </h1>
            <p className="text-2xl sm:text-3xl font-script text-purple-700 dark:text-purple-300 mt-2 font-bold tracking-wide">Bake Art Style</p>

            <div className="flex items-center justify-center lg:justify-start gap-3 my-5">
              <span className="h-px w-12 bg-rose-200 dark:bg-rose-800" />
              <span className="text-lg text-rose-300">❦</span>
              <span className="h-px w-12 bg-rose-200 dark:bg-rose-800" />
            </div>

            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto lg:mx-0 leading-relaxed mb-8">
              "হোমমেড কেক, ডেলিভারি সার্ভিস, অর্ডার করতে ইনবক্স করুন" — কুমিল্লার হাট বলি বাড়িতে অবস্থিত আমাদের বেকারিতে পাবেন ১০০% তাজা ও খাঁটি হোমমেড কেক!
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <a href="#menu"
                className="group px-6 sm:px-8 py-3 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/40 hover:-translate-y-0.5 transition-all btn-shine inline-flex items-center gap-2">
                <span>🧁</span> মেন্যু দেখুন
              </a>
              <a href={waLink(settings.whatsappNumber, 'আমি কেক অর্ডার করতে চাই। দয়া করে মেন্যু পাঠান।')}
                target="_blank" rel="noopener"
                className="group px-6 sm:px-8 py-3 rounded-full bg-white dark:bg-slate-800 text-green-600 dark:text-green-400 font-bold shadow-lg shadow-green-500/10 hover:shadow-xl hover:shadow-green-500/20 border border-green-100 dark:border-slate-700 transition-all inline-flex items-center gap-2 hover:-translate-y-0.5">
                <WhatsAppIcon className="w-5 h-5" /> WhatsApp এ অর্ডার
              </a>
              <button onClick={() => setTrackingOpen(true)}
                className="px-5 py-3 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 font-bold border border-purple-100 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all inline-flex items-center gap-2 text-sm">
                📦 অর্ডার ট্র্যাক
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 sm:gap-6 mt-12 pt-8 border-t border-rose-100/80 dark:border-slate-700/50">
              {[{v:'১৩৫+',l:'ফলোয়ার্স'},{v:'৭৭+',l:'পোস্ট'},{v:'১০০%',l:'হোমমেড'},{v:'২৪/৭',l:'অর্ডার'}].map((s) => (
                <div key={s.l} className="text-center stat-glow rounded-xl p-2">
                  <h4 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{s.v}</h4>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Best-seller spotlight */}
          <div className="relative flex flex-col items-center justify-center">
            <div className="relative w-72 sm:w-96 lg:w-full max-w-md aspect-square rounded-full p-3 best-seller-ring shadow-2xl shadow-rose-500/20">
              <div className="absolute inset-3 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-inner bg-rose-50 dark:bg-slate-800">
                {activeProduct && (
                  <img key={activeProduct.id} src={activeProduct.image} alt={activeProduct.name}
                    className="w-full h-full object-cover best-seller-photo" />
                )}
              </div>
            </div>
            {activeProduct && (
              <div className="mt-5 w-full max-w-md text-center px-3">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 text-[11px] font-bold">🔥 বেস্ট সেলিং</span>
                <h3 className="mt-3 text-lg sm:text-xl font-bold text-gray-900 dark:text-white line-clamp-1">{activeProduct.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{activeProduct.weight} • {toBn(activeProduct.price)} ৳ • ★ {toBn(activeProduct.rating)}</p>
                {featuredProducts.length > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    {featuredProducts.map((p, i) => (
                      <button key={p.id} onClick={() => setActiveBest(i)}
                        className={`relative h-2 rounded-full overflow-hidden transition-all ${i === activeBest % featuredProducts.length ? 'w-9 bg-rose-200 dark:bg-rose-900' : 'w-2 bg-rose-200/70 dark:bg-slate-700 hover:bg-rose-300'}`}>
                        {i === activeBest % featuredProducts.length && (
                          <span className="absolute inset-y-0 left-0 bg-rose-500 best-progress rounded-full" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 wave-divider">
        <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" className="fill-white dark:fill-slate-900" />
        </svg>
      </div>
    </section>
  )
}
