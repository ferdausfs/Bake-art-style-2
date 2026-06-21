import { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Edit3, Check, Download, RefreshCw, Star, Image as ImageIcon, Users, MapPin } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useOrdersHook } from '../hooks/useOrders';
import { useGallery } from '../hooks/useGallery';
import { useReviews } from '../hooks/useReviews';
import { useCustomers } from '../hooks/useCustomers';
import { useBanners } from '../hooks/useBanners';
import { useSettingsStore, useUI } from '../lib/store';
import { DEFAULT_SETTINGS } from '../lib/data';
import { formatINR, waLink } from '../lib/utils';
import type { Product, Order, Banner } from '../types';

type AdminTab = 'dashboard' | 'orders' | 'products' | 'banners' | 'gallery' | 'reviews' | 'customers' | 'zones' | 'settings';

const STATUS_LABELS: Record<string, string> = {
  placed: '🕐 Placed', confirmed: '✅ Confirmed',
  baking: '👩‍🍳 Baking', ready: '📦 Ready', out: '🚗 Out for Delivery', delivered: '🎉 Delivered',
  cancelled: '❌ Cancelled',
};

const EMPTY_PRODUCT = {
  id: '', name: '', tagline: '', description: '', price: 0, image: '',
  rating: 4.5, reviews: 0, occasion: 'birthday' as const,
  flavors: ['Chocolate', 'Vanilla', 'Strawberry'], weights: [{ size: '1 kg', price: 0 }],
  bestseller: false,
};

const EMPTY_BANNER = {
  id: '', title: '', subtitle: '', image: '', tag: 'Shop Now', color: '#FFE2E7',
  type: 'new_item' as const, promoCode: '', productId: '', noticeText: '',
};

interface Props { onClose: () => void; }

export function AdminPanel({ onClose }: Props) {
  const { settings, updateSettings } = useSettingsStore();
  const { products, saveProduct, deleteProduct, uploadProductImage } = useProducts();
  const { orders, fetchOrders, updateStatus, subscribeToNewOrders } = useOrdersHook();
  const { gallery, saveGalleryItem, deleteGalleryItem, uploadGalleryImage } = useGallery();
  const { reviews, approveReview, deleteReview } = useReviews();
  const { customers, loading: customersLoading } = useCustomers();
  const { banners, saveBanner, deleteBanner, uploadBannerImage } = useBanners();
  const { clearNewOrders } = useUI();

  const [pinInput, setPinInput] = useState('');
  const [pinOk, setPinOk] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editBanner, setEditBanner] = useState<Banner | null>(null);
  const [localSettings, setLocalSettings] = useState(settings);
  const [imgUploading, setImgUploading] = useState(false);
  const [bannerImgUploading, setBannerImgUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [newGalleryCaption, setNewGalleryCaption] = useState('');
  const [newZone, setNewZone] = useState('');
  const [orderFilter, setOrderFilter] = useState<'all' | Order['status']>('all');
  const productImgRef = useRef<HTMLInputElement>(null);
  const bannerImgRef = useRef<HTMLInputElement>(null);
  const galleryImgRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (pinOk) {
      fetchOrders();
      clearNewOrders();
      const unsub = subscribeToNewOrders();
      return unsub;
    }
  }, [pinOk]);

  useEffect(() => { setLocalSettings(settings); }, [settings]);

  // PIN screen
  if (!pinOk) {
    const tryPin = () => {
      if (pinInput === settings.adminPin) { setPinOk(true); setPinError(false); }
      else { setPinError(true); setPinInput(''); }
    };
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-cream rounded-3xl p-8 w-full max-w-xs text-center">
          <div className="text-4xl mb-3">🔐</div>
          <h2 className="font-display text-lg font-bold text-ink mb-1">Admin Panel</h2>
          <p className="text-xs text-ink/50 mb-4">Enter your PIN</p>
          <input
            type="password" maxLength={8}
            className={`w-full text-center text-2xl tracking-widest px-4 py-3 rounded-2xl border mb-1 focus:outline-none bg-white text-ink ${pinError ? 'border-red-400' : 'border-ink/10'}`}
            value={pinInput}
            onChange={(e) => { setPinInput(e.target.value); setPinError(false); }}
            onKeyDown={(e) => e.key === 'Enter' && tryPin()}
            placeholder="••••"
            autoFocus
          />
          {pinError && <p className="text-red-500 text-xs mb-2">Wrong PIN!</p>}
          <button onClick={tryPin} className="w-full py-3 rounded-2xl bg-coral text-white font-bold mt-2">Enter</button>
          <button onClick={onClose} className="mt-2 text-xs text-ink/40">Cancel</button>
        </div>
      </div>
    );
  }

  const pendingCount = orders.filter((o) => ['placed', 'confirmed', 'baking'].includes(o.status)).length;
  const totalRevenue = orders.filter((o) => o.status === 'delivered').reduce((s, o) => s + o.total, 0);
  const todayCount = orders.filter((o) => new Date(o.createdAt).toDateString() === new Date().toDateString()).length;

  const TABS: { id: AdminTab; label: string; badge?: number }[] = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'orders', label: '📋 Orders', badge: pendingCount },
    { id: 'products', label: '🧁 Products' },
    { id: 'gallery', label: '🖼️ Gallery' },
    { id: 'banners', label: '🖼️ Banners' },
    { id: 'reviews', label: '⭐ Reviews', badge: reviews.filter((r) => !r.approved).length },
    { id: 'customers', label: '👥 Customers', badge: customers.length },
    { id: 'zones', label: '📍 Zones' },
    { id: 'settings', label: '⚙️ Settings' },
  ];

  const ORDER_STATUSES: Order['status'][] = ['placed', 'confirmed', 'baking', 'ready', 'out', 'delivered', 'cancelled'];
  const filteredOrders = orderFilter === 'all' ? orders : orders.filter((o) => o.status === orderFilter);
  const topProducts = Object.entries(
    orders.reduce<Record<string, number>>((acc, o) => {
      o.items.forEach((item) => { acc[item.productId] = (acc[item.productId] ?? 0) + item.quantity; });
      return acc;
    }, {})
  )
    .map(([id, qty]) => ({ product: products.find((p) => p.id === id), qty }))
    .filter((x) => x.product)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const exportCSV = () => {
    const rows = orders.map((o) => [
      o.id, o.customer.name, o.customer.phone, o.customer.address,
      o.delivery.date, o.delivery.time,
      o.items.map((i) => `${i.name}×${i.quantity}`).join('; '),
      o.subtotal, o.deliveryFee, o.total, o.status, o.payment,
    ]);
    const csv = [['ID','Name','Phone','Address','Date','Time','Items','Subtotal','Delivery','Total','Status','Payment'], ...rows]
      .map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-cream">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-ink text-white flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎂</span>
          <span className="font-bold text-sm">Admin Panel</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchOrders} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 px-3 py-2 bg-white border-b border-ink/8 no-scrollbar flex-shrink-0">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`relative flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${tab === t.id ? 'bg-coral text-white' : 'text-ink/60 hover:bg-ink/5'}`}>
            {t.label}
            {(t.badge ?? 0) > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-black flex items-center justify-center">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">

        {/* Dashboard */}
        {tab === 'dashboard' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Revenue', value: formatINR(totalRevenue) },
                { label: 'Pending', value: pendingCount },
                { label: 'Today', value: todayCount },
                { label: 'Products', value: products.length },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-2xl p-4">
                  <p className="text-xl font-black text-coral">{s.value}</p>
                  <p className="text-xs font-bold text-ink">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl p-4">
              <p className="text-xs font-bold text-ink mb-3">Top Products</p>
              {topProducts.map(({ product, qty }) => (
                <div key={product!.id} className="flex items-center gap-2.5 py-2 border-b border-ink/5 last:border-0">
                  <img src={product!.image} alt="" className="h-10 w-10 rounded-xl object-cover bg-blush" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-ink">{product!.name}</p>
                    <p className="text-[10px] text-ink/40">{qty} sold</p>
                  </div>
                  <p className="text-xs font-black text-coral">{formatINR(product!.price * qty)}</p>
                </div>
              ))}
              {topProducts.length === 0 && <p className="text-center text-xs text-ink/30 py-4">No product sales yet</p>}
            </div>

            <div className="bg-white rounded-2xl p-4">
              <p className="text-xs font-bold text-ink mb-3">Recent Orders</p>
              {orders.slice(0, 5).map((o) => (
                <div key={o.id} className="flex justify-between items-center py-2 border-b border-ink/5 last:border-0">
                  <div>
                    <p className="text-xs font-bold text-ink">{o.customer.name}</p>
                    <p className="text-[10px] text-ink/40">#{o.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-coral">{formatINR(o.total)}</p>
                    <p className="text-[10px] text-ink/50">{STATUS_LABELS[o.status] ?? o.status}</p>
                  </div>
                </div>
              ))}
              {orders.length === 0 && <p className="text-center text-xs text-ink/30 py-4">No orders yet</p>}
            </div>
          </div>
        )}

        {/* Orders */}
        {tab === 'orders' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-ink/60">{filteredOrders.length}/{orders.length} orders</p>
              <button onClick={exportCSV} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-coral text-white text-xs font-bold">
                <Download className="w-3 h-3" /> Export CSV
              </button>
            </div>

            <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
              {(['all', ...ORDER_STATUSES] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setOrderFilter(s)}
                  className={`flex-shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold capitalize ${orderFilter === s ? 'bg-coral text-white' : 'bg-white text-ink/55'}`}
                >
                  {s === 'all' ? 'All' : s}
                </button>
              ))}
            </div>

            {filteredOrders.map((o) => (
              <div key={o.id} className="bg-white rounded-2xl p-4">
                <div className="flex justify-between items-start gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-ink truncate">{o.customer.name}</p>
                    <p className="text-[10px] font-mono text-ink/40">#{o.id} · {new Date(o.createdAt).toLocaleString('en-BD')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-coral">{formatINR(o.total)}</p>
                    <p className="text-[10px] font-bold text-ink/45 capitalize">{o.payment}</p>
                  </div>
                </div>

                <div className="rounded-xl bg-cream p-3 text-[11px] leading-relaxed text-ink/65">
                  <p><span className="font-bold text-ink">Phone:</span> {o.customer.phone || 'N/A'}</p>
                  {o.customer.email && <p><span className="font-bold text-ink">Email:</span> {o.customer.email}</p>}
                  <p><span className="font-bold text-ink">Address:</span> {o.customer.address}, {o.customer.city}</p>
                  <p><span className="font-bold text-ink">Delivery:</span> {o.delivery.date} · {o.delivery.time}</p>
                </div>

                <div className="mt-2 space-y-1.5">
                  {o.items.map((i, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate text-ink/65">{i.name} · {i.size} · {i.flavor} ×{i.quantity}</span>
                      <span className="font-bold text-ink">{formatINR(i.price * i.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3">
                  <label className="text-[10px] font-bold uppercase text-ink/40">Change order status</label>
                  <select
                    value={o.status}
                    onChange={(e) => updateStatus(o.id, e.target.value as Order['status'])}
                    className="mt-1 h-10 w-full rounded-xl border border-ink/10 bg-white px-3 text-xs font-bold text-ink focus:outline-none"
                  >
                    {ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {ORDER_STATUSES.map((s) => (
                    <button key={s}
                      onClick={() => updateStatus(o.id, s)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold ${o.status === s ? 'bg-coral text-white' : 'bg-ink/5 text-ink/45'}`}>
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>

                <div className="mt-3 flex gap-2">
                  <a
                    href={waLink(o.customer.phone || settings.whatsappNumber, `Hello ${o.customer.name}, your Bake Art Style order #${o.id} is now ${o.status}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-xl bg-green-50 py-2 text-center text-xs font-bold text-green-700"
                  >
                    WhatsApp customer
                  </a>
                  <button
                    onClick={() => navigator.clipboard?.writeText(o.id)}
                    className="rounded-xl bg-ink/5 px-3 py-2 text-xs font-bold text-ink/55"
                  >
                    Copy ID
                  </button>
                </div>
              </div>
            ))}
            {filteredOrders.length === 0 && <div className="text-center py-16 text-ink/30 text-sm">No orders yet</div>}
          </div>
        )}

        {/* Products */}
        {tab === 'products' && (
          <div className="space-y-3">
            <button onClick={() => setEditProduct({ ...EMPTY_PRODUCT, id: `p-${Date.now()}` })}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-coral text-white font-bold text-sm">
              <Plus className="w-4 h-4" /> Add Product
            </button>

            {editProduct && (
              <div className="bg-white rounded-2xl p-4 space-y-3 border-2 border-coral/30">
                <p className="font-bold text-sm text-ink">
                  {products.find((p) => p.id === editProduct.id) ? 'Edit' : 'New'} Product
                </p>
                {(['name', 'tagline', 'description'] as const).map((f) => (
                  <div key={f}>
                    <label className="text-[10px] font-bold text-ink/50 uppercase">{f}</label>
                    <input className="w-full mt-0.5 px-3 py-2 rounded-xl border border-ink/10 bg-cream text-xs text-ink focus:outline-none"
                      value={String(editProduct[f] ?? '')}
                      onChange={(e) => setEditProduct({ ...editProduct, [f]: e.target.value })} />
                  </div>
                ))}
                <div>
                  <label className="text-[10px] font-bold text-ink/50 uppercase">Price (৳)</label>
                  <input type="number" className="w-full mt-0.5 px-3 py-2 rounded-xl border border-ink/10 bg-cream text-xs text-ink focus:outline-none"
                    value={editProduct.price}
                    onChange={(e) => setEditProduct({ ...editProduct, price: +e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-ink/50 uppercase">Category</label>
                  <select className="w-full mt-0.5 px-3 py-2 rounded-xl border border-ink/10 bg-cream text-xs text-ink focus:outline-none"
                    value={editProduct.occasion}
                    onChange={(e) => setEditProduct({ ...editProduct, occasion: e.target.value as Product['occasion'] })}>
                    {['birthday', 'wedding', 'anniversary', 'cupcakes', 'gift', 'premium'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  {editProduct.image && <img src={editProduct.image} alt="" className="w-14 h-14 rounded-xl object-cover" />}
                  <div className="flex-1">
                    <input ref={productImgRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0]; if (!file) return;
                      setImgUploading(true);
                      try { const url = await uploadProductImage(file); setEditProduct({ ...editProduct, image: url }); }
                      finally { setImgUploading(false); }
                    }} />
                    <button onClick={() => productImgRef.current?.click()} disabled={imgUploading}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-ink/5 text-xs font-bold text-ink disabled:opacity-50">
                      <ImageIcon className="w-3.5 h-3.5" /> {imgUploading ? 'Uploading...' : 'Upload Image'}
                    </button>
                    <input className="mt-1 w-full px-2 py-1 rounded-lg border border-ink/10 text-[10px] text-ink focus:outline-none bg-cream"
                      placeholder="Or paste image URL"
                      value={editProduct.image.startsWith('data:') ? '' : editProduct.image}
                      onChange={(e) => setEditProduct({ ...editProduct, image: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={async () => { await saveProduct(editProduct); setEditProduct(null); }}
                    className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl bg-coral text-white font-bold text-xs">
                    <Check className="w-3.5 h-3.5" /> Save
                  </button>
                  <button onClick={() => setEditProduct(null)}
                    className="flex-1 py-2.5 rounded-xl bg-ink/5 text-ink/60 font-bold text-xs">Cancel</button>
                </div>
              </div>
            )}

            {products.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl p-3 flex gap-3 items-center">
                <img src={p.image} alt={p.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0 bg-blush" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-ink truncate">{p.name}</p>
                  <p className="text-xs font-black text-coral">{formatINR(p.price)}</p>
                  <p className="text-[10px] text-ink/40">{p.occasion}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => setEditProduct(p)} className="w-8 h-8 rounded-xl bg-ink/5 flex items-center justify-center">
                    <Edit3 className="w-3.5 h-3.5 text-ink/60" />
                  </button>
                  <button onClick={() => deleteProduct(p.id)} className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Banners */}
        {tab === 'banners' && (
          <div className="space-y-3">
            <button onClick={() => setEditBanner({ ...EMPTY_BANNER, id: `b-${Date.now()}` })}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-coral text-white font-bold text-sm">
              <Plus className="w-4 h-4" /> Add Banner
            </button>

            {editBanner && (
              <div className="bg-white rounded-2xl p-4 space-y-3 border-2 border-coral/30">
                <p className="font-bold text-sm text-ink">
                  {banners.find((b) => b.id === editBanner.id) ? 'Edit' : 'New'} Banner
                </p>
                {(['title', 'subtitle', 'tag', 'color'] as const).map((f) => (
                  <div key={f}>
                    <label className="text-[10px] font-bold text-ink/50 uppercase">{f}</label>
                    <input className="w-full mt-0.5 px-3 py-2 rounded-xl border border-ink/10 bg-cream text-xs text-ink focus:outline-none"
                      value={String(editBanner[f] ?? '')}
                      onChange={(e) => setEditBanner({ ...editBanner, [f]: e.target.value })} />
                  </div>
                ))}
                
                <div>
                  <label className="text-[10px] font-bold text-ink/50 uppercase">Type</label>
                  <select className="w-full mt-0.5 px-3 py-2 rounded-xl border border-ink/10 bg-cream text-xs text-ink focus:outline-none"
                    value={editBanner.type}
                    onChange={(e) => setEditBanner({ ...editBanner, type: e.target.value as any })}>
                    <option value="new_item">New Item</option>
                    <option value="discount">Discount</option>
                    <option value="notice">Notice</option>
                  </select>
                </div>

                {editBanner.type === 'discount' && (
                  <div>
                    <label className="text-[10px] font-bold text-ink/50 uppercase">Promo Code</label>
                    <input className="w-full mt-0.5 px-3 py-2 rounded-xl border border-ink/10 bg-cream text-xs text-ink focus:outline-none"
                      value={editBanner.promoCode ?? ''}
                      onChange={(e) => setEditBanner({ ...editBanner, promoCode: e.target.value })} />
                  </div>
                )}

                {editBanner.type === 'new_item' && (
                  <div>
                    <label className="text-[10px] font-bold text-ink/50 uppercase">Product Link</label>
                    <select className="w-full mt-0.5 px-3 py-2 rounded-xl border border-ink/10 bg-cream text-xs text-ink focus:outline-none"
                      value={editBanner.productId ?? ''}
                      onChange={(e) => setEditBanner({ ...editBanner, productId: e.target.value })}>
                      <option value="">Select product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {editBanner.type === 'notice' && (
                  <div>
                    <label className="text-[10px] font-bold text-ink/50 uppercase">Notice Text</label>
                    <textarea rows={3} className="w-full mt-0.5 p-3 rounded-xl border border-ink/10 bg-cream text-xs text-ink focus:outline-none resize-none"
                      value={editBanner.noticeText ?? ''}
                      onChange={(e) => setEditBanner({ ...editBanner, noticeText: e.target.value })} />
                  </div>
                )}

                <div className="flex items-center gap-3">
                  {editBanner.image && <img src={editBanner.image} alt="" className="w-14 h-14 rounded-xl object-cover bg-blush" />}
                  <div className="flex-1">
                    <input ref={bannerImgRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0]; if (!file) return;
                      setBannerImgUploading(true);
                      try { const url = await uploadBannerImage(file); setEditBanner({ ...editBanner, image: url }); }
                      finally { setBannerImgUploading(false); }
                    }} />
                    <button onClick={() => bannerImgRef.current?.click()} disabled={bannerImgUploading}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-ink/5 text-xs font-bold text-ink disabled:opacity-50">
                      <ImageIcon className="w-3.5 h-3.5" /> {bannerImgUploading ? 'Uploading...' : 'Upload Image'}
                    </button>
                    <input className="mt-1 w-full px-2 py-1 rounded-lg border border-ink/10 text-[10px] text-ink focus:outline-none bg-cream"
                      placeholder="Or paste image URL"
                      value={editBanner.image.startsWith('data:') ? '' : editBanner.image}
                      onChange={(e) => setEditBanner({ ...editBanner, image: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={async () => { await saveBanner(editBanner); setEditBanner(null); }}
                    className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl bg-coral text-white font-bold text-xs">
                    <Check className="w-3.5 h-3.5" /> Save
                  </button>
                  <button onClick={() => setEditBanner(null)}
                    className="flex-1 py-2.5 rounded-xl bg-ink/5 text-ink/60 font-bold text-xs">Cancel</button>
                </div>
              </div>
            )}

            {banners.map((b) => (
              <div key={b.id} className="bg-white rounded-2xl p-3 flex gap-3 items-center">
                <img src={b.image} alt={b.title} className="w-14 h-14 rounded-xl object-cover flex-shrink-0 bg-blush" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-ink truncate">{b.title}</p>
                  <p className="text-xs font-bold text-coral capitalize">{b.type}</p>
                  <p className="text-[10px] text-ink/40 truncate">{b.subtitle}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => setEditBanner(b)} className="w-8 h-8 rounded-xl bg-ink/5 flex items-center justify-center">
                    <Edit3 className="w-3.5 h-3.5 text-ink/60" />
                  </button>
                  <button onClick={() => deleteBanner(b.id)} className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Gallery */}
        {tab === 'gallery' && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-4 space-y-2">
              <p className="text-xs font-bold text-ink">Add Gallery Photo</p>
              <input className="w-full px-3 py-2 rounded-xl border border-ink/10 bg-cream text-xs focus:outline-none"
                placeholder="Caption (optional)" value={newGalleryCaption} onChange={(e) => setNewGalleryCaption(e.target.value)} />
              <input ref={galleryImgRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0]; if (!file) return;
                setGalleryUploading(true);
                try {
                  const url = await uploadGalleryImage(file);
                  await saveGalleryItem({ id: `gl-${Date.now()}`, image: url, caption: newGalleryCaption || file.name, created_at: new Date().toISOString() });
                  setNewGalleryCaption('');
                } finally { setGalleryUploading(false); }
              }} />
              <button onClick={() => galleryImgRef.current?.click()} disabled={galleryUploading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-coral text-white font-bold text-xs disabled:opacity-50">
                <ImageIcon className="w-3.5 h-3.5" /> {galleryUploading ? 'Uploading...' : 'Upload Photo'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {gallery.map((g) => (
                <div key={g.id} className="relative rounded-2xl overflow-hidden bg-blush">
                  <img src={g.image} alt={g.caption} className="w-full h-28 object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60">
                    <p className="text-[10px] text-white font-medium truncate">{g.caption}</p>
                  </div>
                  <button onClick={() => deleteGalleryItem(g.id)} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              ))}
            </div>
            {gallery.length === 0 && <div className="text-center py-12 text-ink/30 text-sm">No gallery photos yet</div>}
          </div>
        )}

        {/* Reviews */}
        {tab === 'reviews' && (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className={`bg-white rounded-2xl p-4 ${!r.approved ? 'border-2 border-orange-200' : ''}`}>
                <div className="flex justify-between items-start mb-1">
                  <p className="font-bold text-sm text-ink">{r.user_name}</p>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-ink/20'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-ink/60 mb-2">{r.comment}</p>
                {!r.approved && <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-bold">Pending</span>}
                <div className="flex gap-2 mt-2">
                  {!r.approved && (
                    <button onClick={() => approveReview(r.id, true)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-green-500 text-white text-[10px] font-bold">
                      <Check className="w-3 h-3" /> Approve
                    </button>
                  )}
                  <button onClick={() => deleteReview(r.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 text-red-400 text-[10px] font-bold">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
            {reviews.length === 0 && <div className="text-center py-16 text-ink/30 text-sm">No reviews yet</div>}
          </div>
        )}

        {/* Customers */}
        {tab === 'customers' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xl font-black text-coral">{customers.length}</p>
                <p className="text-xs font-bold text-ink">Customers</p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xl font-black text-coral">{formatINR(customers.reduce((s, c) => s + c.totalSpent, 0))}</p>
                <p className="text-xs font-bold text-ink">Total spent</p>
              </div>
            </div>
            {customersLoading && <div className="text-center py-8 text-ink/40 text-sm">Loading customers...</div>}
            {!customersLoading && customers.map((c) => {
              const customerOrders = orders
                .filter((o) =>
                  (c.phone && o.customer.phone === c.phone) ||
                  (c.email && o.customer.email === c.email) ||
                  (!c.phone && !c.email && o.customer.name === c.name)
                )
                .slice(0, 4);

              return (
                <div key={c.id} className="rounded-2xl bg-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-coral-50 text-coral">
                      {c.avatar ? <img src={c.avatar} alt="" className="h-full w-full rounded-full object-cover" /> : <Users className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">{c.name}</p>
                      <p className="truncate text-[11px] text-ink/45">{c.email || 'No email'} {c.phone ? `· ${c.phone}` : ''}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[9px] font-bold text-ink/45 uppercase">{c.source}</span>
                        <span className="rounded-full bg-coral/10 px-2 py-0.5 text-[9px] font-bold text-coral">{c.orderCount} orders</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-coral">{formatINR(c.totalSpent)}</p>
                      {c.lastOrderDate > 0 && <p className="text-[9px] text-ink/35">{new Date(c.lastOrderDate).toLocaleDateString('en-BD')}</p>}
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl bg-cream p-3">
                    <p className="mb-2 text-[10px] font-bold uppercase text-ink/40">Customer info is saved from checkout orders + logged-in profiles</p>
                    {customerOrders.length > 0 ? customerOrders.map((o) => (
                      <div key={o.id} className="flex items-center justify-between border-b border-ink/5 py-1.5 last:border-0">
                        <div>
                          <p className="text-[11px] font-bold text-ink">#{o.id}</p>
                          <p className="text-[9px] text-ink/40">{new Date(o.createdAt).toLocaleDateString('en-BD')} · {o.status}</p>
                        </div>
                        <p className="text-xs font-black text-coral">{formatINR(o.total)}</p>
                      </div>
                    )) : <p className="text-[11px] text-ink/40">No order history found</p>}
                  </div>

                  {c.phone && (
                    <a
                      href={waLink(c.phone, `Hello ${c.name}, this is Bake Art Style.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 block rounded-xl bg-green-50 py-2 text-center text-xs font-bold text-green-700"
                    >
                      WhatsApp customer
                    </a>
                  )}
                </div>
              );
            })}
            {!customersLoading && customers.length === 0 && <div className="text-center py-16 text-ink/30 text-sm">No customers yet</div>}
          </div>
        )}

        {/* Zones */}
        {tab === 'zones' && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-ink">Delivery zone gating</p>
                  <p className="text-[11px] text-ink/45">Checkout location check on/off</p>
                </div>
                <button
                  onClick={() => updateSettings({ deliveryZonesEnabled: !settings.deliveryZonesEnabled })}
                  className={`h-7 w-12 rounded-full transition-colors ${settings.deliveryZonesEnabled ? 'bg-coral' : 'bg-ink/20'}`}
                >
                  <div className={`m-1 h-5 w-5 rounded-full bg-white transition-transform ${settings.deliveryZonesEnabled ? 'translate-x-5' : ''}`} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(settings.allowedZones ?? []).map((z) => (
                  <span key={z} className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white px-3 py-1.5 text-xs font-bold text-ink">
                    <MapPin className="h-3 w-3 text-coral" /> {z}
                    <button onClick={() => updateSettings({ allowedZones: (settings.allowedZones ?? []).filter((x) => x !== z) })} className="text-ink/50">
                      <X className="h-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={newZone}
                  onChange={(e) => setNewZone(e.target.value)}
                  placeholder="Add zone..."
                  className="h-11 flex-1 rounded-xl border border-ink/10 bg-cream px-3 text-xs text-ink focus:outline-none"
                />
                <button
                  onClick={() => {
                    const zone = newZone.trim();
                    if (!zone) return;
                    if (!(settings.allowedZones ?? []).some((z) => z.toLowerCase() === zone.toLowerCase())) {
                      updateSettings({ allowedZones: [...(settings.allowedZones ?? []), zone] });
                    }
                    setNewZone('');
                  }}
                  className="rounded-xl bg-coral px-4 text-xs font-bold text-white"
                >
                  Add
                </button>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <label className="text-[10px] font-bold uppercase text-ink/50">Out-of-zone message</label>
              <textarea
                value={settings.outOfZoneMessage ?? ''}
                onChange={(e) => updateSettings({ outOfZoneMessage: e.target.value })}
                rows={3}
                className="mt-1 w-full resize-none rounded-xl border border-ink/10 bg-cream p-3 text-xs text-ink focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Settings */}
        {tab === 'settings' && (
          <div className="space-y-4">
            {[
              { label: 'Admin Email', field: 'adminEmail' as const, type: 'email' },
              { label: 'Admin PIN', field: 'adminPin' as const, type: 'password' },
              { label: 'WhatsApp Number', field: 'whatsappNumber' as const, type: 'text' },
              { label: 'bKash/Nagad Number', field: 'upiId' as const, type: 'text' },
              { label: 'Delivery Fee (৳)', field: 'deliveryFee' as const, type: 'number' },
              { label: 'Delivery Estimate', field: 'deliveryEstimate' as const, type: 'text' },
              { label: 'Promo Code', field: 'promoCode' as const, type: 'text' },
              { label: 'Promo Discount (%)', field: 'promoPercent' as const, type: 'number' },
              { label: 'Gemini API Key', field: 'geminiApiKey' as const, type: 'text' },
            ].map(({ label, field, type }) => (
              <div key={field}>
                <label className="text-[10px] font-bold text-ink/50 uppercase">{label}</label>
                <input type={type}
                  className="w-full mt-0.5 px-3 py-2.5 rounded-xl border border-ink/10 bg-white text-xs text-ink focus:outline-none focus:ring-2 focus:ring-coral/20"
                  value={String(localSettings[field] ?? '')}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    [field]: type === 'number' ? +e.target.value : e.target.value,
                  })} />
              </div>
            ))}
            <div className="flex items-center justify-between py-1">
              <label className="text-xs font-bold text-ink">Promo Enabled</label>
              <button onClick={() => setLocalSettings({ ...localSettings, promoEnabled: !localSettings.promoEnabled })}
                className={`w-10 h-6 rounded-full transition-colors ${localSettings.promoEnabled ? 'bg-coral' : 'bg-ink/20'}`}>
                <div className={`w-4 h-4 rounded-full bg-white m-1 transition-transform ${localSettings.promoEnabled ? 'translate-x-4' : ''}`} />
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => updateSettings(localSettings)}
                className="flex-1 py-3 rounded-2xl bg-coral text-white font-bold text-sm">Save</button>
              <button onClick={() => { setLocalSettings(DEFAULT_SETTINGS); updateSettings(DEFAULT_SETTINGS); }}
                className="px-4 py-3 rounded-2xl bg-ink/5 text-ink/50 font-bold text-sm">Reset</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
