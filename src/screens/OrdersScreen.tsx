import { useEffect } from 'react';
import { Check, Package, ChefHat, Truck, Receipt, Search } from 'lucide-react';
import { useUI, formatINR, useAuthStore, useCart } from '../lib/store';
import { useOrdersHook } from '../hooks/useOrders';
import { isSupabaseConfigured } from '../lib/utils';

const STATUSES: { key: string; label: string; icon: any }[] = [
  { key: 'placed',    label: 'Placed',    icon: Check },
  { key: 'confirmed', label: 'Confirmed', icon: Package },
  { key: 'baking',    label: 'Baking',    icon: ChefHat },
  { key: 'ready',     label: 'Ready',     icon: Package },
  { key: 'out',       label: 'Out',       icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: Check },
];

export default function OrdersScreen() {
  const { orders, loading, fetchMyOrders } = useOrdersHook();
  const user = useAuthStore((s) => s.user);
  const { setTab, go } = useUI();

  useEffect(() => {
    if (isSupabaseConfigured() && user) {
      fetchMyOrders();
    }
  }, [fetchMyOrders, user]);

  return (
    <div className="flex h-full flex-col bg-cream">
      <header className="flex-shrink-0 px-5 pt-3 pb-3">
        <div className="section-eyebrow">Activity</div>
        <h1 className="mt-1 font-display text-[28px] font-bold tracking-tight text-ink">
          Your orders
        </h1>
        <p className="mt-0.5 text-[12.5px] text-ink-200">
          {orders.length} {orders.length === 1 ? 'order' : 'orders'} · tracked live
        </p>
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-32">
        {loading ? (
          <div className="flex flex-col items-center justify-center pt-16 text-center anim-fade">
            <div className="flex gap-1.5 justify-center py-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-2 w-2 animate-bounce rounded-full bg-coral" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <p className="text-[12px] text-ink-200">Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-16 text-center anim-fade">
            <div
              className="flex h-24 w-24 items-center justify-center rounded-3xl bg-coral-50 text-5xl"
              style={{ boxShadow: '0 12px 30px -18px rgba(242,94,115,.4)' }}
            >
              📦
            </div>
            <h2 className="mt-5 font-display text-[22px] font-bold tracking-tight text-ink">
              No orders yet
            </h2>
            <p className="mt-1.5 max-w-xs text-[13px] text-ink-200">
              When you place your first order, it'll show up here with live tracking.
            </p>
            <button
              onClick={() => setTab('home')}
              className="btn-primary mt-6 flex h-12 items-center gap-2 rounded-2xl px-7 text-[13px] font-bold"
            >
              <Receipt className="h-4 w-4" />
              Browse cakes
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.filter(Boolean).map((o) => {
              const currentIdx = STATUSES.findIndex((s) => s.key === o.status);
              return (
                <article
                  key={o.id}
                  className="overflow-hidden rounded-3xl bg-white anim-up"
                  style={{ boxShadow: '0 1px 2px rgba(26,19,17,.02), 0 8px 24px -16px rgba(26,19,17,.16)' }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-ink-50 px-4 py-3.5">
                    <div>
                      <div className="text-[10px] font-bold tracking-wider text-ink-200 uppercase">
                        Order #{o.id}
                      </div>
                      <div className="mt-0.5 text-[12px] font-medium text-ink-200">
                        {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <div className="font-display text-[18px] font-bold tabular text-ink">
                      {formatINR(o.total)}
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-2.5 px-4 py-3.5">
                    {o.items.slice(0, 2).map((it, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-cream">
                          <img src={it.image} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <div className="line-clamp-1 text-[12.5px] font-bold text-ink">
                            {it.name}
                          </div>
                          <div className="text-[10.5px] text-ink-200">
                            {it.size} · ×{it.quantity}
                          </div>
                        </div>
                      </div>
                    ))}
                    {o.items.length > 2 && (
                      <div className="text-center text-[11px] font-medium text-ink-200">
                        +{o.items.length - 2} more items
                      </div>
                    )}
                  </div>

                  {/* Progress */}
                  <div className="border-t border-ink-50 px-4 py-3.5">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold tracking-wider text-coral uppercase">
                        Live status
                      </span>
                      <span className="text-[12px] font-bold capitalize text-ink">
                        {STATUSES[currentIdx]?.label || 'Placed'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {STATUSES.map((s, i) => {
                        const done = i <= currentIdx;
                        return (
                          <div
                            key={s.key}
                            className={`h-1 flex-1 rounded-full transition-all ${
                              done ? 'bg-coral' : 'bg-ink-50'
                            }`}
                          />
                        );
                      })}
                    </div>
                    <div className="mt-2 flex items-center gap-0.5">
                      {STATUSES.map((s, i) => {
                        const done = i <= currentIdx;
                        return (
                          <div key={s.key} className="flex flex-1 flex-col items-center gap-1">
                            <div
                              className={`flex h-5 w-5 items-center justify-center rounded-full transition ${
                                done ? 'bg-coral text-white' : 'bg-ink-50 text-ink-200'
                              }`}
                            >
                              <s.icon className="h-3 w-3" strokeWidth={2.5} />
                            </div>
                            <span className={`text-[9px] font-semibold ${done ? 'text-ink' : 'text-ink-200'}`}>
                              {s.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => go({ name: 'tracking', orderId: o.id })}
                      className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-coral-50 text-[12px] font-bold text-coral transition active:scale-[.98]"
                    >
                      <Search className="h-4 w-4" /> Open tracking
                    </button>
                    <button
                      onClick={() => {
                        o.items.forEach((item) => useCart.getState().add({ ...item }));
                        useUI.getState().addNotification(
                          '🛒 Added to cart!',
                          `${o.items.length} item${o.items.length > 1 ? 's' : ''} from Order #${o.id} added to cart.`
                        );
                        setTimeout(() => go({ name: 'cart' }), 600);
                      }}
                      className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-ink text-[12px] font-bold text-white transition active:scale-[.98]"
                    >
                      🔄 Order Again
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}