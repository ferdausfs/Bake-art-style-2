import { useState } from 'react';
import { ArrowLeft, Plus, Minus, Trash2, Tag, ShoppingBag, Truck, Shield } from 'lucide-react';
import {
  useCart,
  useUI,
  formatINR,
  cartSubtotal,
  standardDeliveryFee,
  useSettingsStore,
} from '../lib/store';

export default function CartScreen() {
  const { items, setQty, remove } = useCart();
  const { back, go, promoDiscount, applyPromo, clearPromo } = useUI();
  const [code, setCode] = useState('');
  const [promoError, setPromoError] = useState('');

  const { settings } = useSettingsStore();
  const currentDeliveryFee = settings.deliveryFee !== undefined ? settings.deliveryFee : standardDeliveryFee;
  const currentFreeThreshold = settings.freeDeliveryThreshold !== undefined ? settings.freeDeliveryThreshold : 999;

  const subtotal = cartSubtotal(items);
  const isFreeDelivery = subtotal >= currentFreeThreshold;
  const delivery = items.length === 0 ? 0 : (isFreeDelivery ? 0 : currentDeliveryFee);
  const discountAmount = promoDiscount > 0 ? (subtotal * promoDiscount) / 100 : 0;
  const total = subtotal + delivery - discountAmount;
  const remaining = currentFreeThreshold - subtotal;
  const progress = Math.min((subtotal / currentFreeThreshold) * 100, 100);

  const handleAdd = () => {
    go({ name: 'checkout' });
  };

  if (items.length === 0) {
    return (
      <div className="flex h-full flex-col bg-cream">
        <header className="flex flex-shrink-0 items-center justify-between px-5 pt-3 pb-3">
          <button
            onClick={back}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink transition active:scale-90"
            style={{ boxShadow: '0 1px 2px rgba(26,19,17,.03), 0 6px 16px -10px rgba(26,19,17,.2)' }}
          >
            <ArrowLeft className="h-[20px] w-[20px]" strokeWidth={2} />
          </button>
          <h1 className="font-display text-[16px] font-bold tracking-tight text-ink">My Cart</h1>
          <div className="w-10" />
        </header>

        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <div className="text-5xl">🛒</div>
          <h2 className="mt-4 font-display text-[20px] font-bold text-ink">Your cart is empty</h2>
          <p className="mt-1 text-[12px] text-ink-200">Add delicious cakes from shop to start order.</p>
          <button onClick={back} className="btn-primary mt-5 h-12 rounded-2xl px-6 text-[13px] font-bold">
            Browse cakes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-cream">
      <header className="flex flex-shrink-0 items-center justify-between px-5 pt-3 pb-3">
        <button
          onClick={back}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink transition active:scale-90"
          style={{ boxShadow: '0 1px 2px rgba(26,19,17,.03), 0 6px 16px -10px rgba(26,19,17,.2)' }}
        >
          <ArrowLeft className="h-[20px] w-[20px]" strokeWidth={2} />
        </button>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-[16px] font-bold tracking-tight text-ink">My Cart</h1>
          <span className="rounded-full bg-coral-50 px-2 py-0.5 text-[11px] font-bold text-coral">
            {items.length}
          </span>
        </div>
        <div className="w-10" />
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-44 pt-1">
        {/* Free delivery nudge */}
        {remaining > 0 ? (
          <div className="mb-4 rounded-2xl bg-white p-3.5" style={{ boxShadow: '0 1px 2px rgba(26,19,17,.02), 0 8px 24px -16px rgba(26,19,17,.16)' }}>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-coral-50 text-coral">
                <Truck className="h-4 w-4" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <div className="text-[12.5px] font-bold text-ink">
                  Add {formatINR(remaining)} more for free delivery
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink-50">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-coral-400 to-coral"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4 flex items-center gap-2.5 rounded-2xl bg-emerald-50 px-3.5 py-3 text-emerald-700">
            <Shield className="h-4 w-4" />
            <span className="text-[12.5px] font-bold">You unlocked free delivery 🎉</span>
          </div>
        )}

        {/* Items */}
        <div className="space-y-3">
          {items.map((item, idx) => (
            <article
              key={idx}
              className="flex gap-3 rounded-2xl bg-white p-3 anim-up"
              style={{ boxShadow: '0 1px 2px rgba(26,19,17,.02), 0 8px 24px -16px rgba(26,19,17,.16)' }}
            >
              <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-cream">
                <img src={item.image} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="line-clamp-1 text-[12.5px] font-bold text-ink">
                  {item.name}
                </div>
                <div className="text-[10.5px] text-ink-200">
                  {item.size} · ×{item.quantity}
                </div>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button
                  onClick={() => remove(idx)}
                  className="text-ink-100 transition hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="flex items-center rounded-full border border-ink-50 bg-white p-0.5">
                  <button
                    onClick={() => setQty(idx, item.quantity - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-ink-200 transition hover:bg-cream"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-7 text-center text-[12.5px] font-bold tabular text-ink">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => setQty(idx, item.quantity + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-ink-200 transition hover:bg-cream"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Promo */}
        <div className="mt-4">
          <div className="flex items-center gap-2.5 rounded-2xl border border-dashed border-coral-300 bg-coral-50/30 px-3.5 py-3">
            <Tag className="h-4 w-4 text-coral" />
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setPromoError('');
              }}
              placeholder="Promo code"
              className="flex-1 bg-transparent text-[13px] font-medium outline-none placeholder:text-ink-200"
            />
            <button
              onClick={() => {
                if (!settings.promoEnabled) {
                  setPromoError('No active promo right now');
                  clearPromo();
                  return;
                }
                if (code.trim().toUpperCase() === settings.promoCode.trim().toUpperCase()) {
                  applyPromo(settings.promoPercent);
                  setPromoError('');
                } else {
                  setPromoError('Invalid promo code');
                  clearPromo();
                }
              }}
              className="text-[11.5px] font-bold uppercase tracking-wider text-coral"
            >
              Apply
            </button>
          </div>
          {promoError && (
            <p className="mt-1.5 px-3.5 text-red-500 text-[11px] font-semibold">{promoError}</p>
          )}
          {promoDiscount > 0 && !promoError && (
            <p className="mt-1.5 px-3.5 text-emerald-600 text-[11px] font-semibold">
              Promo code "{settings.promoCode}" applied! ({settings.promoPercent}% discount)
            </p>
          )}
        </div>

        {/* Bill */}
        <section
          className="mt-4 overflow-hidden rounded-2xl bg-white"
          style={{ boxShadow: '0 1px 2px rgba(26,19,17,.02), 0 8px 24px -16px rgba(26,19,17,.16)' }}
        >
          <div className="px-4 pt-4 pb-2">
            <div className="text-[10px] font-bold tracking-wider text-ink-200 uppercase">
              Bill details
            </div>
          </div>
          <div className="space-y-2.5 px-4 py-3 text-[13px]">
            <Row label={`Subtotal (${items.length} items)`} value={formatINR(subtotal)} />
            <Row
              label="Delivery"
              value={delivery === 0 ? 'FREE' : formatINR(delivery)}
              positive={delivery === 0}
            />
            {promoDiscount > 0 && (
              <Row
                label="Promo discount"
                value={'-' + formatINR(discountAmount)}
                positive
              />
            )}
            <div className="h-px bg-ink-50" />
            <div className="flex items-center justify-between pt-1">
              <span className="font-display text-[15px] font-bold tracking-tight text-ink">
                Total
              </span>
              <span className="font-display text-[18px] font-bold tabular text-ink">
                {formatINR(total)}
              </span>
            </div>
          </div>
        </section>

        {/* Trust */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-ink-200">
          <Shield className="h-3.5 w-3.5" />
          Secure 256-bit SSL checkout
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="absolute right-0 bottom-0 left-0 z-30 border-t border-ink-50/80 bg-white/95 px-5 pt-3 pb-6 backdrop-blur-xl">
        <button
          onClick={handleAdd}
          className="btn-primary flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-[14px] font-bold tracking-tight"
        >
          <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={2.2} />
          Checkout · {formatINR(total)}
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-200">{label}</span>
      <span className={`tabular font-bold ${positive ? 'text-emerald-600' : 'text-ink'}`}>
        {value}
      </span>
    </div>
  );
}
