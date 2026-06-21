import { useState } from 'react';
import { ArrowLeft, Heart, Star, ShoppingBag, Check, Share2, Truck, Sparkles, Shield } from 'lucide-react';
import { useUI, useCart, useUser, formatINR } from '../lib/store';
import { useProducts } from '../hooks/useProducts';

const ADDONS = [
  { id: 'candles', name: 'Birthday candles', price: 20 },
  { id: 'message', name: 'Custom message', price: 50 },
  { id: 'card', name: 'Greeting card', price: 30 },
  { id: 'knife', name: 'Cake knife set', price: 80 },
];

export default function ProductScreen() {
  const { view, back, go } = useUI();
  const { add } = useCart();
  const { wishlist, toggleWish } = useUser();
  const { products } = useProducts();

  if (view.name !== 'product') return null;
  const product = products.find((p) => p.id === view.productId);
  if (!product) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-cream px-6 text-center">
        <div className="text-5xl">🎂</div>
        <h2 className="mt-4 font-display text-[20px] font-bold text-ink">Cake not found</h2>
        <p className="mt-1 text-[12px] text-ink-200">This item may have been removed.</p>
        <button onClick={back} className="btn-primary mt-5 h-12 rounded-2xl px-6 text-[13px] font-bold">
          Go back
        </button>
      </div>
    );
  }

  const [size, setSize] = useState(product.weights[1]?.size ?? product.weights[0]?.size);
  const [addons, setAddons] = useState<Record<string, boolean>>({});
  const wished = wishlist.includes(product.id);

  const selectedWeight = product.weights.find((w) => w.size === size);
  const base = product.price + (selectedWeight?.price ?? 0);
  const addonsCost = ADDONS.reduce((s, a) => s + (addons[a.id] ? a.price : 0), 0);
  const total = base + addonsCost;
  const selectedAddons = ADDONS.filter((a) => addons[a.id]).map((a) => a.name);

  const handleAdd = () => {
    add({
      productId: product.id,
      name: product.name,
      image: product.image,
      size,
      flavor: product.flavors[0],
      topping: selectedAddons.length ? selectedAddons.join(', ') : undefined,
      price: total,
      quantity: 1,
    });
    go({ name: 'cart' });
  };

  return (
    <div className="relative flex h-full flex-col bg-blush-50">
      {/* Image header */}
      <div className="relative h-[420px] flex-shrink-0 overflow-hidden rounded-b-[28px] bg-blush-100">
        <img src={product.image} alt={product.name} className="absolute inset-0 h-full w-full object-cover" />

        {/* Soft top fade for control legibility */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-blush-100/85 to-transparent" />

        {/* Floating controls */}
        <button
          onClick={back}
          className="absolute top-5 left-5 flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink transition active:scale-90"
          style={{ boxShadow: '0 8px 22px -10px rgba(26,19,17,.35)' }}
          aria-label="Back"
        >
          <ArrowLeft className="h-[20px] w-[20px]" strokeWidth={2.2} />
        </button>
        <div className="absolute top-5 right-5 flex gap-2.5">
          <button
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink transition active:scale-90"
            style={{ boxShadow: '0 8px 22px -10px rgba(26,19,17,.35)' }}
            aria-label="Share"
          >
            <Share2 className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
          <button
            onClick={() => toggleWish(product.id)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink transition active:scale-90"
            style={{ boxShadow: '0 8px 22px -10px rgba(26,19,17,.35)' }}
            aria-label="Wishlist"
          >
            <Heart
              className={`h-[19px] w-[19px] ${wished ? 'fill-coral text-coral' : ''}`}
              strokeWidth={2}
            />
          </button>
        </div>

        {/* Pagination dots */}
        <div className="absolute right-0 bottom-5 left-0 flex justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === 0 ? 'w-5 bg-coral' : 'w-1.5 bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Sheet */}
      <div className="relative flex-1 overflow-y-auto bg-white">
        <div className="px-5 pt-6 pb-28">
          {/* Title row */}
          <div className="flex items-start justify-between gap-3">
            <h1 className="flex-1 font-display text-[26px] font-bold leading-[1.1] tracking-tight text-ink">
              {product.name}
            </h1>
          </div>

          {/* Rating + meta */}
          <div className="mt-2 flex items-center gap-2 text-[12.5px]">
            <div className="flex items-center gap-0.5 text-gold">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${i < Math.round(product.rating) ? 'fill-current' : 'opacity-30'}`}
                  strokeWidth={0}
                />
              ))}
            </div>
            <span className="font-bold text-ink">{product.rating}</span>
            <span className="text-ink-200">({product.reviews.toLocaleString()} reviews)</span>
          </div>

          {/* Price */}
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-display text-[34px] font-bold leading-none text-coral tabular">
              {formatINR(base)}
            </span>
            {product.oldPrice && (
              <span className="text-[14px] text-ink-200 line-through">
                {formatINR(product.oldPrice)}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="mt-4 text-[13.5px] leading-relaxed text-ink-200">{product.description}</p>

          {/* Trust row */}
          <div className="mt-5 flex items-center justify-between rounded-2xl bg-cream px-4 py-3">
            <Trust icon={Truck} label="Free delivery" />
            <span className="h-5 w-px bg-ink-50" />
            <Trust icon={Sparkles} label="Freshly baked" />
            <span className="h-5 w-px bg-ink-50" />
            <Trust icon={Shield} label="Secure pay" />
          </div>

          {/* Size selector */}
          <section className="mt-7">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-[15px] font-bold tracking-tight text-ink">Select size</h3>
              <span className="text-[11px] text-ink-200">Serves 8-12</span>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {product.weights.map((w) => {
                const fullPrice = product.price + w.price;
                const active = size === w.size;
                return (
                  <button
                    key={w.size}
                    onClick={() => setSize(w.size)}
                    className={`flex min-h-[64px] flex-col items-center justify-center rounded-2xl border-2 bg-white transition active:scale-95 ${
                      active
                        ? 'border-coral bg-coral-50 text-coral'
                        : 'border-ink-50 text-ink'
                    }`}
                  >
                    <span className="text-[13px] font-bold">{w.size}</span>
                    <span className="mt-0.5 text-[11px] font-semibold tabular opacity-70">
                      {formatINR(fullPrice)}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Add-ons */}
          <section className="mt-7">
            <h3 className="font-display text-[15px] font-bold tracking-tight text-ink">Add-ons</h3>
            <div className="mt-3 space-y-1.5">
              {ADDONS.map((a) => {
                const active = !!addons[a.id];
                return (
                  <button
                    key={a.id}
                    onClick={() => setAddons((s) => ({ ...s, [a.id]: !s[a.id] }))}
                    className={`flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left transition active:scale-[.99] ${
                      active ? 'ring-2 ring-coral/40 bg-coral-50' : ''
                    }`}
                    style={{ boxShadow: '0 1px 2px rgba(26,19,17,.02), 0 4px 16px -10px rgba(26,19,17,.18)' }}
                  >
                    <div
                      className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg border-2 transition ${
                        active ? 'border-coral bg-coral' : 'border-ink-50 bg-white'
                      }`}
                    >
                      {active && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                    </div>
                    <span className="flex-1 text-[14px] font-bold text-ink">{a.name}</span>
                    <span className="text-[13.5px] font-extrabold text-ink tabular">
                      {formatINR(a.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Customise CTA */}
          <button
            onClick={() => go({ name: 'customize', productId: product.id })}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-coral-300 bg-coral-50/40 py-3.5 text-[13.5px] font-bold text-coral transition active:scale-[.98]"
          >
            <Sparkles className="h-4 w-4" />
            Fully customize this cake
          </button>
        </div>
      </div>

      {/* Sticky bottom CTA */}
      <div className="absolute right-0 bottom-0 left-0 z-30 border-t border-ink-50/80 bg-white/95 px-5 pt-3 pb-6 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div>
            <div className="text-[10px] font-bold tracking-wider text-ink-200 uppercase">
              Total
            </div>
            <div className="font-display text-[22px] font-bold text-coral tabular">
              {formatINR(total)}
            </div>
          </div>
          <button
            onClick={handleAdd}
            className="btn-primary ml-auto flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl text-[14px] font-bold tracking-tight"
          >
            <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={2.2} />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

function Trust({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-medium text-ink-200">
      <Icon className="h-3.5 w-3.5 text-coral" strokeWidth={2} />
      {label}
    </div>
  );
}