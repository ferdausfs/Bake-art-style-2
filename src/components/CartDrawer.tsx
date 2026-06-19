import { useCartStore, useUIStore, useSettingsStore } from '@/lib/store'
import { toBn, fmtPrice } from '@/lib/utils'

export function CartDrawer() {
  const { items, removeItem, updateQty, clearCart, total } = useCartStore()
  const { cartOpen, setCartOpen, setCheckoutOpen, promoDiscount } = useUIStore()
  const deliveryFee = useSettingsStore((s) => s.settings.deliveryFee)

  const subtotal = total()
  const discount = Math.round(subtotal * promoDiscount / 100)
  const grandTotal = subtotal - discount + deliveryFee

  if (!cartOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={() => setCartOpen(false)} />

      <div className="fixed right-0 top-0 h-full w-full max-w-sm z-50 bg-white dark:bg-slate-900 shadow-2xl animate-slide-right flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-slate-800 bg-gradient-to-r from-rose-500 to-pink-600 text-white">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛒</span>
            <h2 className="font-bold text-base">আমার কার্ট</h2>
            {items.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-white/20 text-[10px] font-black flex items-center justify-center">{toBn(items.length)}</span>
            )}
          </div>
          <div className="flex gap-2 items-center">
            {items.length > 0 && (
              <button onClick={() => { if (confirm('কার্ট খালি করবেন?')) clearCart() }}
                className="px-2.5 py-1 text-[11px] font-bold bg-white/15 hover:bg-white/25 rounded-lg transition-colors">
                🗑️ খালি করুন
              </button>
            )}
            <button onClick={() => setCartOpen(false)}
              className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors font-bold">
              ✕
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {items.length === 0 ? (
            <div className="text-center py-24 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-4xl mb-4">🛒</div>
              <p className="font-bold text-gray-500 dark:text-gray-400 text-sm mb-1">কার্ট খালি আছে</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">কেক বেছে নিন এবং কার্টে যোগ করুন</p>
              <button onClick={() => setCartOpen(false)} className="btn-primary text-sm">
                🧁 কেক দেখুন
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="card p-3 flex gap-3 hover:shadow-md transition-shadow">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-rose-50 dark:bg-slate-800 flex-shrink-0">
                  <img src={item.image} alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🎂</text></svg>' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm dark:text-white line-clamp-1">{item.name}</p>
                  {item.cake_message && (
                    <p className="text-[10px] text-violet-500 dark:text-violet-400 italic truncate">✍️ "{item.cake_message}"</p>
                  )}
                  <p className="text-xs font-black text-rose-600 dark:text-rose-400 mt-0.5">{fmtPrice(item.price)}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <button onClick={() => updateQty(item.id, item.quantity - 1)}
                      className="w-6 h-6 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-sm font-bold dark:text-white hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors leading-none">−</button>
                    <span className="text-sm font-bold dark:text-white w-5 text-center">{toBn(item.quantity)}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)}
                      className="w-6 h-6 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-sm font-bold dark:text-white hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors leading-none">+</button>
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-auto">{fmtPrice(item.price * item.quantity)}</span>
                    <button onClick={() => removeItem(item.id)}
                      className="w-6 h-6 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-colors text-red-400 hover:text-red-500 text-xs">🗑</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t dark:border-slate-800 p-4 space-y-2 bg-white dark:bg-slate-900">
            <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-4 space-y-2 mb-3">
              <div className="flex justify-between text-sm dark:text-gray-300">
                <span>সাবটোটাল</span><span className="font-medium">{fmtPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>ছাড় ({toBn(promoDiscount)}%)</span><span>−{fmtPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm dark:text-gray-300">
                <span>ডেলিভারি</span><span className="font-medium">{fmtPrice(deliveryFee)}</span>
              </div>
              <div className="flex justify-between font-black text-base dark:text-white border-t dark:border-slate-700 pt-2 mt-1">
                <span>সর্বমোট</span>
                <span className="text-rose-600 dark:text-rose-400">{fmtPrice(grandTotal)}</span>
              </div>
            </div>
            <button onClick={() => { setCartOpen(false); setCheckoutOpen(true) }}
              className="btn-primary w-full justify-center py-3 btn-shine text-base">
              চেকআউট করুন →
            </button>
          </div>
        )}
      </div>
    </>
  )
}
