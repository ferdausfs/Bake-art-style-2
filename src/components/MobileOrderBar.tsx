import { useCartStore, useUIStore } from '@/lib/store'
import { toBn, fmtPrice } from '@/lib/utils'
import { useSettingsStore } from '@/lib/store'

export function MobileOrderBar() {
  const count = useCartStore((s) => s.count())
  const subtotal = useCartStore((s) => s.total())
  const { promoDiscount, setCartOpen, setCheckoutOpen } = useUIStore()
  const deliveryFee = useSettingsStore((s) => s.settings.deliveryFee)

  const discount = Math.round(subtotal * promoDiscount / 100)
  const total = subtotal - discount + deliveryFee

  return (
    <div className={`md:hidden fixed inset-x-0 bottom-0 z-40 transition-all duration-500 ${count > 0 ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.25rem)' }}>
      <div className="mx-3 mb-3 rounded-2xl bg-gradient-to-r from-gray-900/95 to-slate-900/95 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-rose-500/10 px-4 py-3 flex items-center justify-between gap-3">
        {/* Cart button */}
        <button onClick={() => setCartOpen(true)} className="flex items-center gap-2.5 min-w-0 text-white hover:opacity-80 transition-opacity">
          <span className="w-8 h-8 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center shadow-lg shadow-rose-500/30">
            {toBn(count)}
          </span>
          <div>
            <p className="text-[10px] text-gray-400">কার্ট দেখুন</p>
            <p className="text-xs font-bold">{toBn(count)} আইটেম</p>
          </div>
        </button>

        {/* Total */}
        <div className="text-center">
          <p className="text-[10px] text-gray-400">মোট</p>
          <p className="text-base font-bold text-rose-400">{fmtPrice(total)}</p>
        </div>

        {/* Checkout */}
        <button onClick={() => setCheckoutOpen(true)}
          className="px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xs font-bold shadow-lg shadow-rose-500/25 hover:scale-105 transition-all active:scale-95 whitespace-nowrap">
          চেকআউট
        </button>
      </div>
    </div>
  )
}
