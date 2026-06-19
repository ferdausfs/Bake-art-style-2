import { useState, useEffect, useRef } from 'react'
import { useProducts } from '@/hooks/useProducts'
import { useOrders } from '@/hooks/useOrders'
import { useGallery } from '@/hooks/useGallery'
import { useReviews } from '@/hooks/useReviews'
import { useUIStore, useSettingsStore } from '@/lib/store'
import { DEFAULT_SETTINGS } from '@/lib/data'
import { toBn, fmtPrice, waLink, exportOrdersCSV, fileToBase64 } from '@/lib/utils'
import type { Product, Order, Coupon, GalleryItem } from '@/types'
import toast from 'react-hot-toast'
import { DeliveryZoneSettings } from '@/components/admin/DeliveryZoneSettings'
import { OrderLocationMap } from '@/components/admin/OrderLocationMap'

type Tab = 'dashboard' | 'orders' | 'products' | 'gallery' | 'reviews' | 'customers' | 'location' | 'settings'

const EMPTY_PRODUCT: Omit<Product, 'id'> = {
  name: '', category: 'birthday', price: 0, rating: 4.5, reviews: 0,
  tag: '', weight: '১ কেজি', image: '', description: '', approved: true, badges: [],
}

const STATUS_LABELS: Record<string, string> = {
  pending: '⏳ পেন্ডিং', confirmed: '✅ কনফার্ম',
  preparing: '👩‍🍳 প্রস্তুতি', delivering: '🚗 ডেলিভারি', delivered: '🎉 সম্পন্ন',
}

// ── Customers Tab ─────────────────────────────────────────
function CustomersTab({ orders }: { orders: Order[] }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const customerMap = orders.reduce<Record<string, { name: string; phone: string; orderCount: number; totalSpent: number; lastOrder: string; orders: Order[] }>>((map, o) => {
    const key = o.customer_phone
    if (!map[key]) map[key] = { name: o.customer_name, phone: key, orderCount: 0, totalSpent: 0, lastOrder: o.created_at, orders: [] }
    map[key].orderCount++; map[key].totalSpent += o.total; map[key].orders.push(o)
    if (o.created_at > map[key].lastOrder) map[key].lastOrder = o.created_at
    return map
  }, {})
  const customers = Object.values(customerMap)
    .filter((c) => !search || c.name.includes(search) || c.phone.includes(search))
    .sort((a, b) => b.totalSpent - a.totalSpent)
  const sel = selected ? customerMap[selected] : null
  return (
    <div className="flex gap-4">
      <div className={`flex flex-col gap-2 flex-1 min-w-0 ${sel ? 'hidden sm:flex' : ''}`}>
        <div className="flex items-center gap-2 mb-1">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="নাম বা ফোন..." className="input flex-1 text-xs" />
          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{toBn(customers.length)} জন</span>
        </div>
        {customers.length === 0 ? <div className="py-10 text-center text-gray-400 text-sm">কোনো কাস্টমার নেই</div>
          : customers.map((c) => (
            <button key={c.phone} onClick={() => setSelected(c.phone)}
              className={`w-full text-left p-3 rounded-xl border transition-all ${selected === c.phone ? 'border-rose-400 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-700' : 'card hover:border-rose-200 dark:hover:border-slate-600'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-bold text-xs dark:text-white truncate">{c.name}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">📞 {c.phone}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-black text-rose-600 dark:text-rose-400">{fmtPrice(c.totalSpent)}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">{toBn(c.orderCount)}টি অর্ডার</p>
                </div>
              </div>
            </button>
          ))}
      </div>
      {sel && (
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <button onClick={() => setSelected(null)} className="sm:hidden text-xs font-bold text-rose-600">← ফিরে যান</button>
            <h3 className="font-bold text-sm dark:text-white">{sel.name}</h3>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[{ l: 'অর্ডার', v: toBn(sel.orderCount) }, { l: 'মোট', v: fmtPrice(sel.totalSpent) }, { l: 'শেষ অর্ডার', v: new Date(sel.lastOrder).toLocaleDateString('bn-BD') }]
              .map((s) => <div key={s.l} className="card p-2.5 text-center"><p className="font-black text-xs text-rose-600 dark:text-rose-400">{s.v}</p><p className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">{s.l}</p></div>)}
          </div>
          <div className="space-y-2 max-h-[55vh] overflow-y-auto no-scrollbar">
            {sel.orders.sort((a, b) => b.created_at.localeCompare(a.created_at)).map((o) => (
              <div key={o.id} className="card p-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-mono text-gray-400">#{o.id}</p>
                    <p className="text-xs dark:text-white truncate">{o.items.map((i) => i.name).join(', ')}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">📅 {o.delivery_date}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-black text-rose-600 dark:text-rose-400">{fmtPrice(o.total)}</p>
                    <p className="text-[9px] text-gray-400 dark:text-gray-500">{STATUS_LABELS[o.status] ?? o.status}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function AdminPanel() {
  const { adminOpen, setAdminOpen, newOrderCount, clearNewOrders } = useUIStore()
  const { settings, updateSettings } = useSettingsStore()
  const { products, saveProduct, deleteProduct, uploadProductImage } = useProducts()
  const { orders, fetchOrders, updateStatus, subscribeToNewOrders } = useOrders()
  const { gallery, saveGalleryItem, deleteGalleryItem, uploadGalleryImage } = useGallery()
  const { reviews, approveReview, deleteReview } = useReviews()

  const [pinInput, setPinInput] = useState('')
  const [pinOk, setPinOk] = useState(false)
  const [tab, setTab] = useState<Tab>('dashboard')
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [localSettings, setLocalSettings] = useState(settings)
  const [imgUploading, setImgUploading] = useState(false)
  const [galleryUploading, setGalleryUploading] = useState(false)
  const [newGalleryCaption, setNewGalleryCaption] = useState('')
  const productImgRef = useRef<HTMLInputElement>(null)
  const galleryImgRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (adminOpen && pinOk) {
      fetchOrders()
      clearNewOrders()
      const unsub = subscribeToNewOrders()
      return unsub
    }
  }, [adminOpen, pinOk])

  useEffect(() => { setLocalSettings(settings) }, [settings])

  if (!adminOpen) return null

  // PIN gate
  if (!pinOk) {
    return (
      <>
        <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={() => setAdminOpen(false)} />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="card p-8 w-full max-w-xs text-center animate-scale-in">
            <div className="text-4xl mb-4">🔐</div>
            <h2 className="font-bold text-lg dark:text-white mb-1">অ্যাডমিন প্যানেল</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">PIN দিন</p>
            <input type="password" maxLength={8} className="input text-center text-2xl tracking-widest mb-4"
              value={pinInput} onChange={(e) => setPinInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { if (pinInput === settings.adminPin) setPinOk(true); else { toast.error('ভুল PIN!'); setPinInput('') } } }}
              placeholder="••••" autoFocus />
            <button onClick={() => { if (pinInput === settings.adminPin) setPinOk(true); else { toast.error('ভুল PIN!'); setPinInput('') } }}
              className="btn-primary w-full">প্রবেশ করুন</button>
          </div>
        </div>
      </>
    )
  }

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: 'dashboard', label: '📊 ড্যাশবোর্ড' },
    { id: 'orders', label: `📋 অর্ডার`, badge: orders.length },
    { id: 'products', label: '🧁 প্রোডাক্ট' },
    { id: 'gallery', label: '🖼️ গ্যালারি' },
    { id: 'reviews', label: '⭐ রিভিউ', badge: reviews.filter((r) => !r.approved).length },
    { id: 'customers', label: '👥 কাস্টমার' },
    { id: 'location', label: '📍 লোকেশন' },
    { id: 'settings', label: '⚙️ সেটিংস' },
  ]

  // Revenue stats
  const totalRevenue = orders.filter((o) => o.status === 'delivered').reduce((s, o) => s + o.total, 0)
  const pendingOrders = orders.filter((o) => o.status === 'pending').length
  const todayOrders = orders.filter((o) => new Date(o.created_at).toDateString() === new Date().toDateString()).length

  // Daily chart data (last 7 days)
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const ds = d.toDateString()
    const count = orders.filter((o) => new Date(o.created_at).toDateString() === ds).length
    const revenue = orders.filter((o) => new Date(o.created_at).toDateString() === ds).reduce((s, o) => s + o.total, 0)
    return { day: d.toLocaleDateString('bn-BD', { weekday: 'short' }), count, revenue }
  })
  const maxCount = Math.max(...last7.map((d) => d.count), 1)

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editProduct) return
    const file = e.target.files?.[0]
    if (!file) return
    setImgUploading(true)
    try {
      const url = await uploadProductImage(file)
      setEditProduct({ ...editProduct, image: url })
      toast.success('ছবি আপলোড হয়েছে!')
    } catch { toast.error('আপলোড ব্যর্থ!') }
    finally { setImgUploading(false) }
  }

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setGalleryUploading(true)
    try {
      const url = await uploadGalleryImage(file)
      const item: GalleryItem = {
        id: `gl-${Date.now()}`,
        image: url,
        caption: newGalleryCaption || file.name.replace(/\.[^.]+$/, ''),
        created_at: new Date().toISOString(),
      }
      await saveGalleryItem(item)
      setNewGalleryCaption('')
      toast.success('গ্যালারিতে যোগ হয়েছে!')
    } catch { toast.error('আপলোড ব্যর্থ!') }
    finally { setGalleryUploading(false) }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={() => { setAdminOpen(false); setPinOk(false); setPinInput('') }} />
      <div className="fixed inset-0 sm:inset-4 z-50 bg-white dark:bg-slate-900 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-slate-700 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-slate-900">
          <div>
            <h2 className="font-bold text-lg dark:text-white">🛠️ অ্যাডমিন প্যানেল</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">বেক আর্ট স্টাইল</p>
          </div>
          <div className="flex items-center gap-2">
            {newOrderCount > 0 && (
              <span className="px-2 py-0.5 bg-rose-500 text-white text-xs font-black rounded-full animate-pulse">
                🔔 {toBn(newOrderCount)} নতুন
              </span>
            )}
            <button onClick={() => { setAdminOpen(false); setPinOk(false); setPinInput('') }}
              className="w-9 h-9 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800 flex items-center justify-center text-gray-500 dark:text-gray-400">✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-3 border-b dark:border-slate-700 overflow-x-auto scrollbar-hide">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`relative px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${tab === t.id ? 'bg-rose-500 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'}`}>
              {t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-gray-900 text-[9px] font-black rounded-full flex items-center justify-center">{toBn(t.badge)}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">

          {/* Dashboard */}
          {tab === 'dashboard' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'প্রোডাক্ট', value: toBn(products.length), icon: '🧁', color: 'from-rose-500 to-pink-600' },
                  { label: 'আজকের অর্ডার', value: toBn(todayOrders), icon: '📅', color: 'from-blue-500 to-cyan-600' },
                  { label: 'পেন্ডিং', value: toBn(pendingOrders), icon: '⏳', color: 'from-amber-500 to-orange-600' },
                  { label: 'মোট আয়', value: fmtPrice(totalRevenue), icon: '💰', color: 'from-green-500 to-emerald-600' },
                ].map((s, i) => (
                  <div key={i} className="card p-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-xl mb-2`}>{s.icon}</div>
                    <p className="text-xl font-black dark:text-white">{s.value}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* 7-day chart */}
              <div className="card p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm dark:text-white">গত ৭ দিনের অর্ডার</h3>
                  <button onClick={() => exportOrdersCSV(orders)}
                    className="text-xs px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold rounded-xl hover:bg-green-200 transition-colors">
                    📥 CSV Export
                  </button>
                </div>
                <div className="flex items-end gap-2 h-24">
                  {last7.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] text-gray-500 dark:text-gray-400">{toBn(d.count)}</span>
                      <div
                        className="w-full bg-gradient-to-t from-rose-500 to-pink-400 rounded-t-lg transition-all duration-500 min-h-[4px]"
                        style={{ height: `${(d.count / maxCount) * 72}px` }}
                      />
                      <span className="text-[9px] text-gray-400 dark:text-gray-500 truncate w-full text-center">{d.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={() => setTab('products')} className="btn-primary text-sm">➕ প্রোডাক্ট যোগ</button>
                <button onClick={() => setTab('orders')} className="btn-ghost">📋 অর্ডার দেখুন</button>
                <button onClick={() => setTab('gallery')} className="btn-ghost">🖼️ গ্যালারি</button>
                <button onClick={() => setTab('settings')} className="btn-ghost">⚙️ সেটিংস</button>
              </div>
            </div>
          )}

          {/* Orders */}
          {tab === 'orders' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">{toBn(orders.length)}টি অর্ডার</p>
                <button onClick={() => exportOrdersCSV(orders)} className="text-xs px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold rounded-xl hover:bg-green-200 transition-colors">📥 CSV</button>
              </div>
              {orders.length === 0 ? (
                <div className="text-center py-16"><p className="text-4xl mb-3">📋</p><p className="text-gray-400 dark:text-gray-500 text-sm">এখনো কোনো অর্ডার নেই</p></div>
              ) : orders.map((o) => (
                <div key={o.id} className="card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono font-bold text-xs bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded">{o.id}</span>
                    <select value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value as Order['status'])}
                      className="text-xs border dark:border-slate-600 rounded-lg px-2 py-1 dark:bg-slate-800 dark:text-white">
                      {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs mb-2">
                    <div><span className="text-gray-400">নাম: </span><span className="font-bold dark:text-white">{o.customer_name}</span></div>
                    <div><span className="text-gray-400">ফোন: </span><span className="font-bold dark:text-white">{o.customer_phone}</span></div>
                    <div className="col-span-2"><span className="text-gray-400">ঠিকানা: </span><span className="font-bold dark:text-white">{o.customer_address}</span></div>
                    <div><span className="text-gray-400">ডেলিভারি: </span><span className="font-bold dark:text-white">{o.delivery_date}</span></div>
                    <div><span className="text-gray-400">পেমেন্ট: </span><span className="font-bold dark:text-white">{o.payment_method}</span></div>
                    <div className="col-span-2"><span className="text-gray-400">মোট: </span><span className="font-bold text-rose-600">{fmtPrice(o.total)}</span></div>
                  </div>
                  {o.payment_screenshot && (
                    <div className="mb-2">
                      <p className="text-[10px] text-gray-400 mb-1">📸 পেমেন্ট স্ক্রিনশট:</p>
                      <img src={o.payment_screenshot} alt="payment" className="w-full max-h-32 object-contain rounded-xl border dark:border-slate-600 cursor-pointer"
                        onClick={() => window.open(o.payment_screenshot, '_blank')} />
                    </div>
                  )}
                  <a href={waLink(settings.whatsappNumber, `অর্ডার ${o.id} সম্পর্কে জানতে চাই।`)}
                    target="_blank" rel="noopener"
                    className="flex items-center justify-center gap-2 w-full py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-bold rounded-xl hover:bg-green-100 transition-colors">
                    💬 WhatsApp ফলো-আপ
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* Products */}
          {tab === 'products' && (
            <div className="space-y-4">
              <button onClick={() => setEditProduct({ ...EMPTY_PRODUCT, id: `p-${Date.now()}` } as Product)}
                className="btn-primary w-full">➕ নতুন প্রোডাক্ট</button>
              {editProduct && (
                <div className="card p-4 space-y-3 border-rose-200 dark:border-rose-800">
                  <h3 className="font-bold dark:text-white text-sm">
                    {editProduct.id.startsWith('p-') && !products.find((p) => p.id === editProduct.id) ? '➕ নতুন প্রোডাক্ট' : '✏️ সম্পাদনা'}
                  </h3>

                  {/* Image upload */}
                  <div>
                    <input ref={productImgRef} type="file" accept="image/*" className="hidden" onChange={handleProductImageUpload} />
                    {editProduct.image ? (
                      <div className="relative mb-2">
                        <img src={editProduct.image} alt="preview" className="w-full h-32 object-cover rounded-xl" />
                        <button onClick={() => setEditProduct({ ...editProduct, image: '' })}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">✕</button>
                      </div>
                    ) : null}
                    <div className="flex gap-2">
                      <button onClick={() => productImgRef.current?.click()} disabled={imgUploading}
                        className="flex-1 py-2 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl text-xs text-gray-500 dark:text-gray-400 hover:border-rose-300 hover:text-rose-500 transition-colors">
                        {imgUploading ? '⏳ আপলোড হচ্ছে...' : '📸 ছবি আপলোড করুন'}
                      </button>
                    </div>
                    <input className="input mt-2" placeholder="অথবা ছবির URL দিন"
                      value={editProduct.image} onChange={(e) => setEditProduct({ ...editProduct, image: e.target.value })} />
                  </div>

                  {(['name', 'price', 'weight', 'description'] as const).map((field) => (
                    <input key={field} className="input"
                      placeholder={field === 'name' ? 'নাম *' : field === 'price' ? 'মূল্য (৳) *' : field === 'weight' ? 'ওজন' : 'বিবরণ'}
                      type={field === 'price' ? 'number' : 'text'}
                      value={(editProduct as unknown as Record<string, unknown>)[field] as string}
                      onChange={(e) => setEditProduct({ ...editProduct, [field]: field === 'price' ? +e.target.value : e.target.value })} />
                  ))}
                  <input className="input" placeholder="ট্যাগ (যেমন: বেস্টসেলার)"
                    value={editProduct.tag ?? ''}
                    onChange={(e) => setEditProduct({ ...editProduct, tag: e.target.value })} />
                  <select className="input" value={editProduct.category}
                    onChange={(e) => setEditProduct({ ...editProduct, category: e.target.value as Product['category'] })}>
                    {[['birthday', 'জন্মদিন'], ['wedding', 'বিবাহ'], ['custom', 'কাস্টম'], ['seasonal', 'সিজনাল']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <label className="flex items-center gap-2 text-sm dark:text-gray-300">
                    <input type="checkbox" checked={editProduct.approved}
                      onChange={(e) => setEditProduct({ ...editProduct, approved: e.target.checked })} />
                    অ্যাপ্রুভড (সবাই দেখতে পাবে)
                  </label>
                  <div className="flex gap-2">
                    <button onClick={() => { saveProduct(editProduct); setEditProduct(null); toast.success('প্রোডাক্ট সেভ হয়েছে! 🎂') }}
                      className="btn-primary flex-1 text-sm">💾 সেভ</button>
                    <button onClick={() => setEditProduct(null)} className="btn-ghost flex-1 text-sm">বাতিল</button>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                {products.map((p) => (
                  <div key={p.id} className="card p-3 flex items-center gap-3">
                    <img src={p.image} alt={p.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm dark:text-white truncate">{p.name}</p>
                      <p className="text-xs text-rose-600">{fmtPrice(p.price)} • {p.approved ? '✅' : '❌'}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditProduct(p)} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-lg hover:bg-blue-100 transition-colors">✏️</button>
                      <button onClick={() => { if (confirm('মুছবেন?')) deleteProduct(p.id) }} className="px-2 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-lg hover:bg-red-100 transition-colors">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gallery */}
          {tab === 'gallery' && (
            <div className="space-y-4">
              <div className="card p-4 space-y-3">
                <h3 className="font-bold text-sm dark:text-white">➕ নতুন ছবি যোগ করুন</h3>
                <input className="input" placeholder="ক্যাপশন (যেমন: চকোলেট কেক — বার্থডে)"
                  value={newGalleryCaption} onChange={(e) => setNewGalleryCaption(e.target.value)} />
                <input ref={galleryImgRef} type="file" accept="image/*" className="hidden" onChange={handleGalleryUpload} />
                <button onClick={() => galleryImgRef.current?.click()} disabled={galleryUploading}
                  className="w-full py-3 border-2 border-dashed border-rose-300 dark:border-rose-700 rounded-xl text-sm text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                  {galleryUploading ? '⏳ আপলোড হচ্ছে...' : '📸 গ্যালারিতে ছবি যোগ করুন'}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {gallery.map((item) => (
                  <div key={item.id} className="relative rounded-2xl overflow-hidden group">
                    <img src={item.image} alt={item.caption} className="w-full aspect-square object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                      <p className="text-white text-xs font-bold text-center">{item.caption}</p>
                      <button onClick={() => { if (confirm('মুছবেন?')) deleteGalleryItem(item.id) }}
                        className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg font-bold">🗑️ মুছুন</button>
                    </div>
                  </div>
                ))}
                {gallery.length === 0 && (
                  <div className="col-span-3 text-center py-10 text-gray-400 dark:text-gray-500">
                    <p className="text-4xl mb-2">🖼️</p>
                    <p className="text-sm">গ্যালারি খালি। ছবি যোগ করুন!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reviews */}
          {tab === 'reviews' && (
            <div className="space-y-3">
              {reviews.length === 0 ? (
                <div className="text-center py-16"><p className="text-4xl mb-3">⭐</p><p className="text-gray-400 dark:text-gray-500 text-sm">কোনো রিভিউ নেই</p></div>
              ) : reviews.map((r) => (
                <div key={r.id} className={`card p-4 ${!r.approved ? 'border-amber-200 dark:border-amber-800' : ''}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-bold text-sm dark:text-white">{r.user_name}</p>
                      <div className="flex gap-0.5 text-amber-400 text-xs">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                    </div>
                    <div className="flex gap-1 items-center">
                      {!r.approved && <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold">অনুমোদন বাকি</span>}
                      {!r.approved && <button onClick={() => approveReview(r.id, true)} className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-lg hover:bg-green-200 transition-colors font-bold">✅ অনুমোদন</button>}
                      <button onClick={() => { if (confirm('মুছবেন?')) deleteReview(r.id) }} className="px-2 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-lg hover:bg-red-100 transition-colors">🗑️</button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">{r.comment}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{new Date(r.created_at).toLocaleDateString('bn-BD')}</p>
                </div>
              ))}
            </div>
          )}

          {/* Customers */}
          {tab === 'customers' && <CustomersTab orders={orders} />}

          {/* Location */}
          {tab === 'location' && (
            <div className="space-y-8">
              <OrderLocationMap />
              <div>
                <h3 className="font-bold text-sm dark:text-white border-b dark:border-slate-700 pb-2 mb-4">ডেলিভারি জোন সেটিংস</h3>
                <DeliveryZoneSettings />
              </div>
            </div>
          )}

          {/* Settings */}
          {tab === 'settings' && (
            <div className="space-y-5 max-w-sm">
              <div className="space-y-3">
                <h3 className="font-bold text-sm dark:text-white border-b dark:border-slate-700 pb-2">সাধারণ সেটিংস</h3>
                {[
                  { key: 'adminPin', label: 'Admin PIN', type: 'password' },
                  { key: 'adminEmail', label: 'Admin ইমেইল', type: 'email' },
                  { key: 'whatsappNumber', label: 'WhatsApp নম্বর', type: 'text' },
                  { key: 'bkashNumber', label: 'বিকাশ নম্বর', type: 'text' },
                  { key: 'nagadNumber', label: 'নগদ নম্বর', type: 'text' },
                  { key: 'geminiApiKey', label: 'Gemini API Key', type: 'password' },
                  { key: 'deliveryFee', label: 'ডেলিভারি ফি (৳)', type: 'number' },
                  { key: 'deliveryEstimate', label: 'ডেলিভারি সময়', type: 'text' },
                ].map(({ key, label, type }) => (
                  <div key={key}>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{label}</label>
                    <input type={type} className="input"
                      value={(localSettings as unknown as Record<string, unknown>)[key] as string}
                      onChange={(e) => setLocalSettings({ ...localSettings, [key]: type === 'number' ? +e.target.value : e.target.value })} />
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-sm dark:text-white border-b dark:border-slate-700 pb-2">প্রোমো সেটিংস</h3>
                {[
                  { key: 'promoCode', label: 'প্রোমো কোড', type: 'text' },
                  { key: 'promoPercent', label: 'ছাড় %', type: 'number' },
                  { key: 'promoTitle', label: 'ব্যানার শিরোনাম', type: 'text' },
                ].map(({ key, label, type }) => (
                  <div key={key}>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{label}</label>
                    <input type={type} className="input"
                      value={(localSettings as unknown as Record<string, unknown>)[key] as string}
                      onChange={(e) => setLocalSettings({ ...localSettings, [key]: type === 'number' ? +e.target.value : e.target.value })} />
                  </div>
                ))}
                <label className="flex items-center gap-2 text-sm dark:text-gray-300">
                  <input type="checkbox" checked={localSettings.promoEnabled}
                    onChange={(e) => setLocalSettings({ ...localSettings, promoEnabled: e.target.checked })} />
                  প্রোমো কোড চালু
                </label>
              </div>

              <div className="flex gap-2">
                <button onClick={() => { updateSettings(localSettings); toast.success('সেটিংস সেভ হয়েছে! ✅') }}
                  className="btn-primary flex-1">💾 সেভ করুন</button>
                <button onClick={() => { setLocalSettings(DEFAULT_SETTINGS); updateSettings(DEFAULT_SETTINGS); toast.success('রিসেট হয়েছে') }}
                  className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold rounded-xl text-xs">🔄 রিসেট</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
