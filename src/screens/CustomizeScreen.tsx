import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Droplet, Weight, Plus } from 'lucide-react';
import { useUI, useCart, useSettingsStore, formatINR } from '../lib/store';
import { useProducts } from '../hooks/useProducts';

const STEPS = [
  { id: 'flavour', label: 'Flavour' },
  { id: 'weight', label: 'Weight' },
  { id: 'addons', label: 'Add-ons' },
  { id: 'message', label: 'Message' },
  { id: 'review', label: 'Review' },
];

const FLAVOURS = ['Chocolate', 'Vanilla', 'Red Velvet', 'Butterscotch', 'Strawberry', 'Pistachio'];

const DEFAULT_FLAVOUR_IMAGES: Record<string, string> = {
  Chocolate: '/cakes/chocolate-truffle.png',
  Vanilla: '/cakes/logo-cake.png',
  'Red Velvet': '/cakes/red-velvet.png',
  Butterscotch: '/cakes/butterscotch.png',
  Strawberry: '/cakes/strawberry-pink.png',
  Pistachio: '/cakes/logo-cake.png',
};

const WEIGHTS = [
  { size: '0.5 kg', price: 599 },
  { size: '1 kg', price: 899 },
  { size: '1.5 kg', price: 1199 },
  { size: '2 kg', price: 1499 },
];

const ADDONS = [
  { id: 'candles', label: 'Candles', price: 50, emoji: '🕯️' },
  { id: 'topper', label: 'Cake topper', price: 120, emoji: '✨' },
  { id: 'photo', label: 'Photo print', price: 180, emoji: '🖼️' },
  { id: 'flowers', label: 'Fresh flowers', price: 150, emoji: '🌸' },
  { id: 'choco', label: 'Extra chocolate', price: 100, emoji: '🍫' },
  { id: 'box', label: 'Premium box', price: 80, emoji: '🎁' },
];

export default function CustomizeScreen() {
  const { view, back, go } = useUI();
  const { add } = useCart();
  const { settings } = useSettingsStore();
  const { products } = useProducts();

  if (view.name !== 'customize') return null;

  const product = view.productId ? products.find((p) => p.id === view.productId) : products[3];
  const defaultProduct = product ?? products[3] ?? { id: 'p4', name: 'Custom Cake', image: '/cakes/logo-cake.png', flavors: FLAVOURS };

  const flavorImages = {
    ...DEFAULT_FLAVOUR_IMAGES,
    ...(settings.customFlavorImages ?? {}),
  };

  const [step, setStep] = useState(0);
  const [config, setConfig] = useState({
    flavour: defaultProduct.flavors?.[0] || 'Chocolate',
    weight: '1 kg',
    addons: [] as string[],
    message: '',
  });
  const [customWeight, setCustomWeight] = useState('1');

  const selectedWeight = WEIGHTS.find((w) => w.size === config.weight) ?? WEIGHTS[1];
  const selectedAddons = ADDONS.filter((a) => config.addons.includes(a.id));
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  // removed duplicate

  // If product has weight-based pricing, compute dynamically
  const weightPrice = product?.pricePerUnit && customWeight && +customWeight > 0
    ? +customWeight * product.pricePerUnit
    : selectedWeight.price;
  const total = weightPrice + addonsTotal;
  const previewImage = flavorImages[config.flavour] || defaultProduct.image;

  const toggleAddon = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      addons: prev.addons.includes(id)
        ? prev.addons.filter((x) => x !== id)
        : [...prev.addons, id],
    }));
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }


    const finalSize = product?.pricePerUnit
      ? `${customWeight} ${product?.priceUnit ?? 'kg'}`
      : config.weight;

    add({
      productId: defaultProduct.id,
      name: `Custom ${config.flavour} Cake`,
      image: previewImage,
      size: finalSize,
      flavor: config.flavour,
      topping: selectedAddons.map((a) => a.label).join(', ') || undefined,
      message: config.message,
      price: total,
      quantity: 1,
    });

    go({ name: 'cart' });
  };

  const prev = () => {
    if (step > 0) setStep((s) => s - 1);
    else back();
  };

  const nextLabel =
    step === 0 ? 'Continue · Weight' :
    step === 1 ? 'Continue · Add-ons' :
    step === 2 ? 'Continue · Message' :
    step === 3 ? 'Continue · Review' :
    'Add to Cart';

  return (
    <div className="flex h-full flex-col bg-cream">
      <header className="flex flex-shrink-0 items-center justify-between px-5 pt-3 pb-2">
        <button onClick={prev} className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition active:scale-90">
          <ArrowLeft className="h-[20px] w-[20px]" strokeWidth={2} />
        </button>
        <h1 className="font-display text-[16px] font-bold tracking-tight text-ink">Customize Cake</h1>
        <div className="w-10" />
      </header>

      <div className="flex-shrink-0 px-5 pb-3 pt-1">
        <div className="flex items-start justify-between">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <div key={s.id} className="flex flex-1 items-start">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-[13px] font-bold transition ${active ? 'border-coral bg-coral text-white' : done ? 'border-coral bg-white text-coral' : 'border-ink-50 bg-white text-ink-200'}`}>
                    {done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                  </div>
                  <span className={`text-[10px] font-bold ${active ? 'text-ink' : 'text-ink-200'}`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className="-mt-3 mx-0.5 h-0.5 flex-1 rounded-full bg-ink-50" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto pb-28">
        <div className="px-5 anim-scale" key={`${step}-${config.flavour}`}>
          <div className="relative overflow-hidden rounded-[28px] bg-white" style={{ boxShadow: '0 18px 50px -28px rgba(242,94,115,.35)' }}>
            <div className="aspect-square w-full">
              <img src={previewImage} alt={config.flavour} className="h-full w-full object-cover" />
            </div>
            <div className="absolute right-3 bottom-3 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-bold text-coral backdrop-blur">
              {config.flavour} · {config.weight}
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3 px-5">
          {step === 0 && (
            <FlavorPicker
              value={config.flavour}
              images={flavorImages}
              onChange={(v) => setConfig({ ...config, flavour: v })}
            />
          )}

          {step === 1 && (
            product?.pricePerUnit ? (
              <div className="rounded-2xl bg-white p-3.5" style={{ boxShadow: '0 1px 2px rgba(26,19,17,.02), 0 6px 18px -14px rgba(26,19,17,.16)' }}>
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-coral-50 text-coral">
                    <Weight className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <h3 className="font-display text-[14px] font-bold tracking-tight text-ink">Weight</h3>
                  <span className="ml-auto text-[11px] font-semibold text-ink-200">{product?.priceUnit ?? 'kg'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0.25"
                    step="0.25"
                    placeholder={`Enter weight in ${product?.priceUnit ?? 'kg'}`}
                    className="flex-1 px-3 py-2.5 rounded-xl border-2 border-ink/10 bg-cream text-sm font-bold text-ink focus:border-coral focus:outline-none"
                    value={customWeight}
                    onChange={(e) => setCustomWeight(e.target.value)}
                  />
                  <span className="text-sm font-bold text-ink/50">{product?.priceUnit ?? 'kg'}</span>
                </div>
                {customWeight && +customWeight > 0 && (
                  <div className="mt-2 rounded-xl bg-coral/8 px-3 py-2 flex items-center justify-between">
                    <span className="text-[11px] text-ink/60">{customWeight} {product?.priceUnit ?? 'kg'} × ৳{product?.pricePerUnit}</span>
                    <span className="font-display text-base font-bold text-coral">৳{(+customWeight * (product?.pricePerUnit ?? 0)).toLocaleString()}</span>
                  </div>
                )}
              </div>
            ) : (
              <ChipGroup
                icon={Weight}
                label="Weight"
                value={config.weight}
                options={WEIGHTS.map((w) => w.size)}
                onChange={(v) => setConfig({ ...config, weight: v })}
              />
            )
          )}

          {step === 2 && <AddonsPicker selected={config.addons} onToggle={toggleAddon} />}

          {step === 3 && (
            <div>
              <h3 className="px-1 text-[13px] font-bold text-ink">Write a sweet message</h3>
              <div className="mt-2 overflow-hidden rounded-2xl bg-white p-3.5" style={{ boxShadow: '0 1px 2px rgba(26,19,17,.02), 0 8px 24px -16px rgba(26,19,17,.18)' }}>
                <textarea
                  maxLength={40}
                  rows={3}
                  value={config.message}
                  onChange={(e) => setConfig({ ...config, message: e.target.value })}
                  placeholder="Happy Birthday, Aanya! 🎉"
                  className="w-full resize-none rounded-xl bg-cream px-3 py-2.5 text-[14px] outline-none placeholder:text-ink-100 focus:bg-blush-50"
                />
                <div className="mt-2 flex items-center justify-between text-[11px] text-ink-200">
                  <span>Piped on top of the cake</span>
                  <span className="tabular">{config.message.length}/40</span>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="overflow-hidden rounded-3xl bg-white" style={{ boxShadow: '0 1px 2px rgba(26,19,17,.02), 0 18px 50px -28px rgba(242,94,115,.25)' }}>
              <div className="bg-cream px-5 py-3.5">
                <div className="text-[10px] font-bold tracking-wider text-coral uppercase">Your cake</div>
                <div className="mt-0.5 font-display text-[20px] font-bold tracking-tight text-ink">Custom {config.flavour} Cake</div>
              </div>
              <div className="space-y-2.5 px-5 py-4 text-[13.5px]">
                <Review label="Flavour" value={config.flavour} />
                <Review label="Weight" value={config.weight} />

                <Review label="Weight" value={product?.pricePerUnit ? `${customWeight} ${product?.priceUnit ?? 'kg'}` : config.weight} />
                <Review label="Add-ons" value={selectedAddons.map((a) => a.label).join(', ') || '— none —'} />
                <Review label="Message" value={config.message || '— none —'} last />
              </div>
              <div className="border-t border-ink-50 bg-cream px-5 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-ink-200">Total</span>
                  <span className="font-display text-[22px] font-bold tabular text-coral">{formatINR(total)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="absolute right-0 bottom-0 left-0 z-30 border-t border-ink-50/80 bg-white/95 px-5 pt-3 pb-6 backdrop-blur-xl">
        <button onClick={next} className="btn-primary flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-[14px] font-bold tracking-tight">
          {nextLabel}
          <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

function FlavorPicker({
  value,
  images,
  onChange,
}: {
  value: string;
  images: Record<string, string>;
  onChange: (v: string) => void;
}) {
  return (
    <section className="rounded-2xl bg-white p-3.5" style={{ boxShadow: '0 1px 2px rgba(26,19,17,.02), 0 6px 18px -14px rgba(26,19,17,.16)' }}>
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-coral-50 text-coral">
          <Droplet className="h-4 w-4" strokeWidth={2} />
        </div>
        <h3 className="font-display text-[14px] font-bold tracking-tight text-ink">Choose flavour</h3>
        <span className="ml-auto text-[11px] font-semibold text-ink-200">{value}</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {FLAVOURS.map((flavour) => (
          <button
            key={flavour}
            onClick={() => onChange(flavour)}
            className={`overflow-hidden rounded-2xl border-2 bg-white text-left transition active:scale-[.98] ${value === flavour ? 'border-coral' : 'border-ink-50'}`}
          >
            <div className="aspect-[4/3] bg-cream">
              <img src={images[flavour]} alt={flavour} className="h-full w-full object-cover" />
            </div>
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[12px] font-bold text-ink">{flavour}</span>
              {value === flavour && <Check className="h-4 w-4 text-coral" strokeWidth={3} />}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function AddonsPicker({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <section className="rounded-2xl bg-white p-3.5" style={{ boxShadow: '0 1px 2px rgba(26,19,17,.02), 0 6px 18px -14px rgba(26,19,17,.16)' }}>
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-coral-50 text-coral">
          <Plus className="h-4 w-4" strokeWidth={2} />
        </div>
        <h3 className="font-display text-[14px] font-bold tracking-tight text-ink">Add-ons</h3>
        <span className="ml-auto text-[11px] font-semibold text-ink-200">{selected.length} selected</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {ADDONS.map((addon) => {
          const active = selected.includes(addon.id);
          return (
            <button
              key={addon.id}
              onClick={() => onToggle(addon.id)}
              className={`rounded-2xl border-2 p-3 text-left transition active:scale-[.98] ${active ? 'border-coral bg-coral-50/60' : 'border-ink-50 bg-white'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xl">{addon.emoji}</span>
                {active && <Check className="h-4 w-4 text-coral" strokeWidth={3} />}
              </div>
              <div className="mt-2 text-[12px] font-bold text-ink">{addon.label}</div>
              <div className="text-[11px] font-bold text-coral">+{formatINR(addon.price)}</div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ChipGroup({
  icon: Icon,
  label,
  value,
  options,
  onChange,
}: {
  icon: typeof Weight;
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <section className="rounded-2xl bg-white p-3.5" style={{ boxShadow: '0 1px 2px rgba(26,19,17,.02), 0 6px 18px -14px rgba(26,19,17,.16)' }}>
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-coral-50 text-coral">
          <Icon className="h-4 w-4" strokeWidth={2} />
        </div>
        <h3 className="font-display text-[14px] font-bold tracking-tight text-ink">{label}</h3>
        <span className="ml-auto text-[11px] font-semibold text-ink-200">{value}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={`flex h-9 items-center justify-center rounded-full border-2 px-3.5 text-[12.5px] font-semibold transition active:scale-95 ${
              value === o ? 'border-coral bg-coral text-white' : 'border-ink-50 bg-white text-ink'
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </section>
  );
}

function Review({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 ${last ? '' : 'border-b border-ink-50 pb-2'}`}>
      <span className="text-[12.5px] text-ink-200">{label}</span>
      <span className="text-right text-[12.5px] font-bold text-ink">{value}</span>
    </div>
  );
}