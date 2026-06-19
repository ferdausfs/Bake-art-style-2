import { useState } from 'react'
import { useOrders } from '@/hooks/useOrders'
import { useUIStore } from '@/lib/store'
import { toBn, fmtPrice } from '@/lib/utils'
import type { Order } from '@/types'

const STATUS_STEPS: { key: Order['status']; label: string; icon: string }[] = [
  { key: 'pending', label: 'অর্ডার পেয়েছি', icon: '📋' },
  { key: 'confirmed', label: 'নিশ্চিত হয়েছে', icon: '✅' },
  { key: 'preparing', label: 'তৈরি হচ্ছে', icon: '👩‍🍳' },
  { key: 'delivering', label: 'ডেলিভারি চলছে', icon: '🚗' },
  { key: 'delivered', label: 'পৌঁছে গেছে!', icon: '🎉' },
]

const STATUS_INDEX: Record<string, number> = {
  pending: 0, confirmed: 1, preparing: 2, delivering: 3, delivered: 4,
}

export function OrderTrackingModal() {
  const { trackingOpen, setTrackingOpen } = useUIStore()
  const { orders } = useOrders()
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<Order | null | 'not-found'>(null)

  const search = () => {
    const q = query.trim().toUpperCase()
    if (!q) return
    const found = orders.find((o) => o.id.toUpperCase() === q || o.id.includes(q))
    setResult(found ?? 'not-found')
  }

  const close = () => { setTrackingOpen(false); setQuery(''); setResult(null) }

  if (!trackingOpen) return null

  const currentIdx = result && result !== 'not-found' ? (STATUS_INDEX[result.status] ?? 0) : 0

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={close} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-50 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b dark:border-slate-700 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-slate-900">
          <div>
            <h2 className="font-bold text-lg dark:text-white">📦 অর্ডার ট্র্যাক করুন</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Order ID দিয়ে খুঁজুন</p>
          </div>
          <button onClick={close} className="w-8 h-8 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800 flex items-center justify-center text-gray-500">✕</button>
        </div>

        <div className="p-5 space-y-5">
          {/* Search */}
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="যেমন: BAS-12345"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
            />
            <button onClick={search} className="btn-primary px-5 text-sm">খুঁজুন</button>
          </div>

          {/* Not found */}
          {result === 'not-found' && (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">🔍</div>
              <p className="font-bold dark:text-white mb-1">অর্ডার পাওয়া যায়নি</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">সঠিক Order ID দিন (যেমন: BAS-12345)</p>
            </div>
          )}

          {/* Found */}
          {result && result !== 'not-found' && (
            <div className="space-y-4">
              {/* Order Info */}
              <div className="bg-rose-50 dark:bg-rose-900/20 rounded-2xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">{result.id}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(result.created_at).toLocaleDateString('bn-BD')}
                  </span>
                </div>
                <p className="text-xs dark:text-white font-bold">{result.customer_name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">📅 ডেলিভারি: {result.delivery_date}</p>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-bold mt-1">{fmtPrice(result.total)}</p>
              </div>

              {/* Timeline */}
              <div className="space-y-1">
                {STATUS_STEPS.map((step, i) => {
                  const done = i <= currentIdx
                  const active = i === currentIdx
                  return (
                    <div key={step.key} className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0 transition-all ${
                        active ? 'bg-rose-500 shadow-lg shadow-rose-500/30 scale-110'
                        : done ? 'bg-green-100 dark:bg-green-900/40'
                        : 'bg-gray-100 dark:bg-slate-800'
                      }`}>
                        {done ? (active ? step.icon : '✓') : '○'}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-bold ${
                          active ? 'text-rose-600 dark:text-rose-400'
                          : done ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-400 dark:text-gray-500'
                        }`}>{step.label}</p>
                      </div>
                      {active && (
                        <span className="text-[10px] bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full font-bold">বর্তমান</span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Items */}
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">আইটেম:</p>
                <div className="space-y-1">
                  {result.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs dark:text-gray-300">
                      <span>{item.name} × {toBn(item.quantity)}</span>
                      <span className="font-bold">{fmtPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
