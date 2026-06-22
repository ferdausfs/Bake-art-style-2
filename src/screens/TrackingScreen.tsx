import { useEffect, useState } from 'react';
import { ArrowLeft, Package, Search } from 'lucide-react';
import { useUI, formatINR, useAuthStore } from '../lib/store';
import { useOrdersHook } from '../hooks/useOrders';
import { isSupabaseConfigured } from '../lib/utils';
import OrderTimeline from '../components/OrderTimeline';
import type { Order } from '../types';

export default function TrackingScreen() {
  const { view, back, setTab } = useUI();
  const initial = view.name === 'tracking' ? view.orderId ?? '' : '';
  const [query, setQuery] = useState(initial);
  const [match, setMatch] = useState<Order | null>(null);
  const { orders, loading, fetchMyOrders } = useOrdersHook();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (isSupabaseConfigured() && user) {
      fetchMyOrders();
    }
  }, [fetchMyOrders, user]);

  useEffect(() => {
    if (!query.trim()) {
      setMatch(null);
      return;
    }

    const q = query.toLowerCase().replace(/^#/, '').trim();
    const found = orders.find((o) => o && o.id.toLowerCase() === q);
    setMatch(found ?? null);
  }, [query, orders]);

  return (
    <div className="flex h-full flex-col bg-cream">
      <header className="flex flex-shrink-0 items-center justify-between px-5 pt-3 pb-3">
        <button
          onClick={back}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink active:scale-90"
          style={{ boxShadow: '0 1px 2px rgba(26,19,17,.03), 0 6px 16px -10px rgba(26,19,17,.2)' }}
        >
          <ArrowLeft className="h-[20px] w-[20px]" strokeWidth={2} />
        </button>
        <h1 className="font-display text-[16px] font-bold tracking-tight text-ink">Order tracking</h1>
        <div className="w-10" />
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-20 pt-1">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-4 h-[18px] w-[18px] -translate-y-1/2 text-ink-100" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter order ID, e.g. BAS123456"
            className="h-12 w-full rounded-2xl border border-ink-50 bg-white pr-4 pl-11 text-[14px] text-ink outline-none focus:border-coral focus:ring-4 focus:ring-coral/10"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center pt-16 text-center anim-fade">
            <div className="flex gap-1.5 justify-center py-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-2 w-2 animate-bounce rounded-full bg-coral" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <p className="text-[12px] text-ink-200">Syncing orders...</p>
          </div>
        ) : match ? (
          <article
            className="mt-4 overflow-hidden rounded-3xl bg-white"
            style={{ boxShadow: '0 1px 2px rgba(26,19,17,.02), 0 8px 24px -16px rgba(26,19,17,.16)' }}
          >
            <div className="flex items-center justify-between border-b border-ink-50 px-4 py-3.5">
              <div>
                <div className="text-[10px] font-bold tracking-wider text-ink-200 uppercase">
                  Order #{match.id}
                </div>
                <div className="mt-0.5 text-[12px] font-medium text-ink-200">
                  {new Date(match.createdAt).toLocaleString('en-BD')}
                </div>
              </div>
              <div className="font-display text-[18px] font-bold tabular text-ink">
                {formatINR(match.total)}
              </div>
            </div>

            <div className="space-y-2.5 px-4 py-3.5">
              {match.items.slice(0, 3).map((it, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-cream">
                    <img src={it.image} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="line-clamp-1 text-[12.5px] font-bold text-ink">{it.name}</div>
                    <div className="text-[10.5px] text-ink-200">{it.size} · ×{it.quantity}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-ink-50 px-4 py-3.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider text-coral uppercase">Live status</span>
                <span className="text-[12px] font-bold capitalize text-ink">{match.status}</span>
              </div>
              <OrderTimeline status={match.status} />
            </div>
          </article>
        ) : query.trim() ? (
          <div className="mt-8 text-center">
            <div className="text-5xl">🔎</div>
            <p className="mt-2 text-[14px] font-medium text-ink-300">Order not found</p>
            <p className="text-[12px] text-ink-200">Please check the order ID and try again.</p>
          </div>
        ) : (
          <div className="mt-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-coral-50">
              <Package className="h-10 w-10 text-coral" strokeWidth={1.8} />
            </div>
            <p className="mt-3 text-[13px] text-ink-200">
              Enter an order ID to see live status. You can also open tracking from your Orders page.
            </p>
            <button onClick={() => setTab('orders')} className="btn-primary mt-5 h-11 rounded-2xl px-5 text-[13px] font-bold">
              My orders
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
