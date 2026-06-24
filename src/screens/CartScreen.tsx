import { useState } from 'react';
import { ArrowLeft, Plus, Minus, Trash2, Tag, ShoppingBag, Sparkles, Truck, Shield, ShoppingCart, Star } from 'lucide-react';
import {
  useCart,
  useUI,
  useLoyalty,
  formatINR,
  cartSubtotal,
  standardDeliveryFee,
  useSettingsStore,
} from '../lib/store';

export default function CartScreen() {
  const { items, setQty, remove } = useCart();
  const { back, go, promoDiscount, applyPromo, clearPromo, setPendingLoyaltyRedeem } = useUI();
  const { points } = useLoyalty();
  const [code, setCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [loyaltyRedeemed, setLoyaltyRedeemed] = useState(0); // points redeemed this session

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
        <Header title="My cart" onBack={back} />
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <div
            className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white text-ink-200"
            style={{ boxShadow: '0 1px 2px rgba(26,19,17,.03), 0 12px 30px -18px rgba(26,19,17,.14)' }}
          >
            <ShoppingCart size={44} strokeWidth={1.5} />
          </div>
          <h2 className="mt-5 font-display text-[22px] font-bold tracking-tight text-ink">
            Your cart is empty
          </h2>
          <p className="mt-1.5 text-[13px] text-ink-200">
            Add some delicious cakes to get started.
          </p>
          <button
            onClick={back}
            className="btn-primary mt-6 flex h-12 items-center gap-2 rounded-2xl px-7 text-[13px] font-bold"
          >
            <Sparkles className="h-4 w-4" /> Browse cakes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-cream">
      <Header title="My cart" onBack={back} badge={`${items.length}`} />

      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-44 pt-1">
        {/* Free delivery nudge */}
        {remaining > 0 ? (
          <div className="mb-4 rounded-2xl bg-white p-3.5" style={{ boxShadow: '0 1px 2px rgba(26,19,17,.02), 0 8px 24px -16px rgba(26,19,17,.16)' }}>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-50 text-ink-200">
                <Truck className="h-4 w-4" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <div className="text-[12.5px] font-bold text-ink">
                  Add {formatINR(remaining)} more for free delivery
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink-50">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-ink-200 to-ink-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4 flex items-center gap-2.5 rounded-2xl bg-emerald-50 px-3.5 py-3 text-emerald-700">
            <Shield className="h-4 w-4" />
            <span className="text-[12.5px] font-bold">You unlocked free delivery</span>
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
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="line-clamp-1 text-[14px] font-bold text-ink">{item.name}</h4>
                    <div className="mt-0.5 text-[11px] text-ink-200">
                      {item.size} · {item.flavor}
                    </div>
                    {item.message && (
                      <div className="mt-0.5 line-clamp-1 text-[10.5px] italic text-coral">
                        "{item.message}"
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => remove(idx)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-ink-200 transition active:bg-rose-50 active:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-1">
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
                  <span className="font-display text-[15px] font-bold tabular text-ink">
                    {formatINR(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Loyalty Points Redemption */}
        {points >= 1000 && (
          <div className="mx-4 mt-4 rounded-2xl overflow-hidden border border-amber-200 bg-amber-50">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" strokeWidth={2} />
                <div>
                  <div className="text-[12px] font-bold text-amber-800">
                    You have {points.toLocaleString()} points
                  </div>
                  <div className="text-[10px] text-amber-600">
                    Redeem 1000 pts = ৳50 off
                  </div>
                </div>
              </div>
              {loyaltyRedeemed === 0 ? (
                <button
                  onClick={() => {
                    // Calculate max redeemable (multiples of 1000, capped so discount ≤ subtotal)
                    const maxByPoints = Math.floor(points / 1000);
                    const maxBySubtotal = Math.floor(subtotal / 50);
                    const setsToRedeem = Math.max(1, Math.min(maxByPoints, maxBySubtotal));
                    const ptsToRedeem = setsToRedeem * 1000;
                    const discountTaka = setsToRedeem * 50;
                    // Apply as percentage of subtotal (applyPromo takes percentage)
                    const pct = subtotal > 0 ? Math.min(99, Math.round((discountTaka / subtotal) * 100)) : 0;
                    applyPromo(pct);
                    setPendingLoyaltyRedeem(ptsToRedeem);
                    setLoyaltyRedeemed(ptsToRedeem);
                  }}
                  className="rounded-xl bg-amber-500 px-3 py-1.5 text-[11px] font-bold text-white active:scale-95 transition"
                >
                  Redeem
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-emerald-700">
                    -{loyaltyRedeemed / 1000 * 50}৳ applied!
                  </span>
                  <button
                    onClick={() => {
                      clearPromo();
                      setPendingLoyaltyRedeem(0);
                      setLoyaltyRedeemed(0);
                    }}
                    className="text-[10px] text-ink/40 underline"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Promo */}
        <div className="mt-4">
          <div className="flex items-center gap-2.5 rounded-2xl border border-dashed border-ink-100 bg-white px-3.5 py-3">
            <Tag className="h-4 w-4 text-ink-200" />
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
              className="text-[11.5px] font-bold uppercase tracking-wider text-ink hover:text-coral"
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
            {loyaltyRedeemed > 0 && (
              <Row
                label={`Points (${loyaltyRedeemed.toLocaleString()} pts)`}
                value={'-' + formatINR(Math.round(loyaltyRedeemed / 1000 * 50))}
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

function Header({ title, onBack, badge }: { title: string; onBack: () => void; badge?: string }) {
  return (
    <header className="flex flex-shrink-0 items-center justify-between px-5 pt-3 pb-3">
      <button
        onClick={onBack}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink transition active:scale-90"
        style={{ boxShadow: '0 1px 2px rgba(26,19,17,.03), 0 6px 16px -10px rgba(26,19,17,.2)' }}
      >
        <ArrowLeft className="h-[20px] w-[20px]" strokeWidth={2} />
      </button>
      <div className="flex items-center gap-2">
        <h1 className="font-display text-[16px] font-bold tracking-tight text-ink">{title}</h1>
        {badge && (
          <span className="rounded-full bg-ink-50 px-2 py-0.5 text-[11px] font-bold text-ink-200">
            {badge}
          </span>
        )}
      </div>
      <div className="w-10" />
    </header>
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
