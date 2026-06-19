import { useState, useEffect } from 'react'
import { useAuthStore, useUIStore, useCartStore } from '@/lib/store'
import { useAuth } from '@/hooks/useAuth'
import { useOrders } from '@/hooks/useOrders'
import { toBn, fmtPrice } from '@/lib/utils'
import type { Order } from '@/types'
import toast from 'react-hot-toast'

const STATUS_MAP: Record<Order['status'], { label: string; color: string; icon: string }> = {
  pending:    { label: 'অপেক্ষমাণ',    color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400',  icon: '⏳' },
  confirmed:  { label: 'কনফার্ম হয়েছে', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400',    icon: '✅' },
  preparing:  { label: 'তৈরি হচ্ছে',    color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400', icon: '👩‍🍳' },
  delivering: { label: 'ডেলিভারিতে',   color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400', icon: '🚗' },
  delivered:  { label: 'ডেলিভারি হয়েছে', color: 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400', icon: '🎉' },
}

const STEPS_ORDER: Order['status'][] = ['pending', 'confirmed', 'preparing', 'delivering', 'delivered']

function OrderStatusBar({ status }: { status: Order['status'] }) {
  const idx = STEPS_ORDER.indexOf(status)
  return (
    <div className="flex items-center gap-0 mt-3 mb-1">
      {STEPS_ORDER.map((s, i) => {
        const done = i <= idx
        const active = i === idx
        return (
          <div key={s} className="flex items-center flex-1">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all ${done ? 'bg-rose-500 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-400'} ${active ? 'ring-2 ring-rose-400 ring-offset-1' : ''}`}>
              {i < idx ? '✓' : i + 1}
            </div>
            {i < 4 && <div className={`flex-1 h-0.5 ${i < idx ? 'bg-rose-400' : 'bg-gray-200 dark:bg-slate-700'}`} />}
          </div>
        )
      })}
    </div>
  )
}

function OrderCard({ order, onReorder }: { order: Order; onReorder: (o: Order) => void }) {
  const [open, setOpen] = useState(false)
  const st = STATUS_MAP[order.status]

  return (
    <div className="card overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">#{order.id.slice(-8).toUpperCase()}</p>
            <p className="font-bold text-sm dark:text-white mt-0.5">{order.items.map((i) => i.name).join(', ').slice(0, 45)}{order.items.map((i) => i.name).join(', ').length > 45 ? '...' : ''}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">📅 {order.delivery_date} • {order.delivery_time}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-black text-base text-rose-600 dark:text-rose-400">{fmtPrice(order.total)}</p>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${st.color}`}>
              {st.icon} {st.label}
            </span>
          </div>
        </div>

        <OrderStatusBar status={order.status} />

        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50 dark:border-slate-700">
          <button onClick={() => setOpen(!open)} className="text-[11px] text-gray-500 dark:text-gray-400 hover:text-rose-500 font-medium transition-colors">
            {open ? '▲ কম দেখুন' : '▼ বিস্তারিত'}
          </button>
          <button onClick={() => onReorder(order)}
            className="text-[11px] px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-100 transition-colors">
            🔄 আবার অর্ডার
          </button>
        </div>

        {open && (
          <div className="mt-3 pt-3 border-t border-gray-50 dark:border-slate-700 space-y-2 animate-fade-in-up">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                <span>{item.name} × {toBn(item.quantity)}{item.cake_message ? ` (${item.cake_message})` : ''}</span>
                <span className="font-bold">{fmtPrice(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-gray-50 dark:border-slate-700 space-y-1 text-[11px]">
              <div className="flex justify-between text-gray-500 dark:text-gray-400"><span>সাবটোটাল</span><span>{fmtPrice(order.subtotal)}</span></div>
              {order.discount > 0 && <div className="flex justify-between text-green-600 dark:text-green-400"><span>ছাড় ({order.promo_code})</span><span>-{fmtPrice(order.discount)}</span></div>}
              <div className="flex justify-between text-gray-500 dark:text-gray-400"><span>ডেলিভারি</span><span>{fmtPrice(order.delivery_fee)}</span></div>
              <div className="flex justify-between font-black text-gray-900 dark:text-white"><span>মোট</span><span className="text-rose-600 dark:text-rose-400">{fmtPrice(order.total)}</span></div>
            </div>
            <div className="text-[10px] text-gray-400 dark:text-gray-500 pt-1">
              📍 {order.customer_address} • 💳 {order.payment_method === 'cod' ? 'ক্যাশ অন ডেলিভারি' : order.payment_method === 'bkash' ? 'বিকাশ' : 'নগদ'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function CustomerDashboard() {
  const { user } = useAuthStore()
  const { signOut } = useAuth()
  const { orders, loading, fetchOrders } = useOrders()
  const { setCheckoutOpen } = useUIStore()
  const addItem = useCartStore((s) => s.addItem)
  const products = useCartStore((s) => s.items) // just for context
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'wishlist'>('orders')

  // Trigger from navbar
  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('open-customer-dashboard', handler)
    return () => window.removeEventListener('open-customer-dashboard', handler)
  }, [])

  useEffect(() => {
    if (open && user) fetchOrders()
  }, [open, user])

  const myOrders = orders.filter((o) => !o.user_id || o.user_id === user?.id)

  const handleReorder = (order: Order) => {
    order.items.forEach((item) => {
      // Add back to cart
      addItem({
        id: item.product_id, name: item.name, price: item.price,
        category: 'birthday', rating: 5, reviews: 0, weight: '',
        image: '', description: '', approved: true, badges: [],
      } as any, item.quantity, item.cake_message)
    })
    toast.success('আগের অর্ডারের আইটেম কার্টে যোগ হয়েছে! 🛒')
    setOpen(false)
    setCheckoutOpen(true)
  }

  if (!user || !open) return null

  const totalSpent = myOrders.reduce((s, o) => s + o.total, 0)
  const pendingCount = myOrders.filter((o) => o.status === 'pending' || o.status === 'confirmed' || o.status === 'preparing').length

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="fixed inset-y-0 right-0 z-[60] w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-slide-right overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500 to-pink-600 px-5 pt-10 pb-5 text-white flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-2xl">👤</div>
              <div>
                <h2 className="font-bold text-base">{user.name}</h2>
                <p className="text-rose-100 text-xs">{user.email || 'ফোন দিয়ে লগইন'}</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-sm font-bold transition-colors">✕</button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { v: toBn(myOrders.length), l: 'মোট অর্ডার' },
              { v: toBn(pendingCount), l: 'চলমান' },
              { v: fmtPrice(totalSpent), l: 'মোট খরচ' },
            ].map((s) => (
              <div key={s.l} className="bg-white/15 backdrop-blur rounded-xl p-3 text-center border border-white/10">
                <p className="font-black text-base">{s.v}</p>
                <p className="text-rose-100 text-[10px] mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b dark:border-slate-800 flex-shrink-0 bg-white dark:bg-slate-900">
          {([
            { id: 'orders', label: `📋 অর্ডার (${toBn(myOrders.length)})` },
            { id: 'profile', label: '👤 প্রোফাইল' },
          ] as const).map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex-1 py-3 text-xs font-bold transition-colors ${activeTab === t.id ? 'border-b-2 border-rose-500 text-rose-600 dark:text-rose-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4">
          {/* Orders tab */}
          {activeTab === 'orders' && (
            <div className="space-y-3">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
                </div>
              ) : myOrders.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-5xl mb-3">🎂</p>
                  <p className="font-bold text-gray-800 dark:text-white">এখনো কোনো অর্ডার নেই</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-5">আপনার প্রথম কেক অর্ডার করুন!</p>
                  <button onClick={() => { setOpen(false); document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' }) }}
                    className="btn-primary text-sm">🧁 মেন্যু দেখুন</button>
                </div>
              ) : (
                myOrders.map((o) => <OrderCard key={o.id} order={o} onReorder={handleReorder} />)
              )}
            </div>
          )}

          {/* Profile tab */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="card p-5 space-y-3">
                <h3 className="font-bold text-sm dark:text-white">ব্যক্তিগত তথ্য</h3>
                <div className="space-y-2">
                  {[{ l: 'নাম', v: user.name }, { l: 'যোগাযোগ', v: user.email || 'ফোন নম্বর' }].map((f) => (
                    <div key={f.l} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-slate-700 last:border-0">
                      <span className="text-[11px] text-gray-400 dark:text-gray-500 w-20 flex-shrink-0">{f.l}</span>
                      <span className="text-sm font-medium dark:text-white">{f.v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-5">
                <h3 className="font-bold text-sm dark:text-white mb-3">অর্ডারের তথ্য</h3>
                <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                  <div className="flex justify-between"><span>মোট অর্ডার</span><span className="font-bold dark:text-white">{toBn(myOrders.length)}টি</span></div>
                  <div className="flex justify-between"><span>সম্পূর্ণ ডেলিভারি</span><span className="font-bold text-green-600">{toBn(myOrders.filter((o) => o.status === 'delivered').length)}টি</span></div>
                  <div className="flex justify-between"><span>মোট খরচ</span><span className="font-bold text-rose-600 dark:text-rose-400">{fmtPrice(totalSpent)}</span></div>
                </div>
              </div>

              <button onClick={() => { signOut(); setOpen(false) }}
                className="w-full py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                লগআউট করুন
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
