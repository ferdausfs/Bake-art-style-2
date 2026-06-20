import { useState } from 'react';
import {
  ArrowLeft, ArrowRight, Check, Cake, Droplet, Weight, Palette, MessageSquare, Eye,
} from 'lucide-react';
import { useUI, useCart, formatINR } from '../lib/store';
import { products } from '../lib/data';

const STEPS = [
  { id: 'design',  label: 'Design',  icon: Cake },
  { id: 'flavour', label: 'Flavour', icon: Droplet },
  { id: 'weight',  label: 'Weight',  icon: Weight },
  { id: 'message', label: 'Message', icon: MessageSquare },
  { id: 'review',  label: 'Review',  icon: Eye },
];

const SHAPES = ['Round', 'Square', 'Heart', 'Tiered'];
const FLAVOURS = ['Chocolate', 'Vanilla', 'Red Velvet', 'Butterscotch', 'Strawberry', 'Pistachio'];
const WEIGHTS = [
  { size: '0.5 kg', price: 599 },
  { size: '1 kg',   price: 899 },
  { size: '1.5 kg', price: 1199 },
  { size: '2 kg',   price: 1499 },
];
const COLOURS = [
  { name: 'Pink',  hex: '#F25E73' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Cocoa', hex: '#5C3A2E' },
  { name: 'Cream', hex: '#F4D9B0' },
  { name: 'Mint',  hex: '#A8D5BA' },
  { name: 'Lilac', hex: '#C9B2E8' },
];

export default function CustomizeScreen() {
  const { view, back, go } = useUI();
  const { add } = useCart();
  if (view.name !== 'customize') return null;
  const product = view.productId ? products.find((p) => p.id === view.productId) : products[3];
  const defaultProduct = product ?? products[3];

  const [step, setStep] = useState(0);
  const [config, setConfig] = useState({
    shape: 'Round',
    flavour: 'Chocolate',
    weight: '1 kg',
    colour: 'Pink',
    message: '',
  });

  const selectedWeight = WEIGHTS.find((w) => w.size === config.weight) ?? WEIGHTS[1];
  const price = selectedWeight.price;

  const next = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else handleFinish();
  };
  const prev = () => (step > 0 ? setStep((s) => s - 1) : back());

  const handleFinish = () => {
    add({
      productId: defaultProduct.id,
      name: `Custom ${defaultProduct.name}`,
      image: defaultProduct.image,
      size: config.weight,
      flavor: config.flavour,
      message: config.message,
      price,
      quantity: 1,
    });
    go({ name: 'cart' });
  };

  const nextLabel =
    step === 0 ? 'Continue · Flavour' :
    step === 1 ? 'Continue · Weight' :
    step === 2 ? 'Continue · Message' :
    step === 3 ? 'Continue · Review' :
    'Add to Cart';

  return (
    <div className="flex h-full flex-col bg-cream">
      {/* Top bar */}
      <header className="flex flex-shrink-0 items-center justify-between px-5 pt-3 pb-2">
        <button
          onClick={prev}
          className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition active:scale-90"
        >
          <ArrowLeft className="h-[20px] w-[20px]" strokeWidth={2} />
        </button>
        <h1 className="font-display text-[16px] font-bold tracking-tight text-ink">Customize Cake</h1>
        <div className="w-10" />
      </header>

      {/* Stepper */}
      <div className="flex-shrink-0 px-5 pb-3 pt-1">
        <div className="flex items-start justify-between">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <div key={s.id} className="flex flex-1 items-start">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-[13px] font-bold transition ${
                      active
                        ? 'border-coral bg-coral text-white shadow-[0_8px_20px_-10px_rgba(242,94,115,.6)]'
                        : done
                        ? 'border-coral bg-white text-coral'
                        : 'border-ink-50 bg-white text-ink-200'
                    }`}
                  >
                    {done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                  </div>
                  <span className={`text-[10px] font-bold ${active ? 'text-ink' : 'text-ink-200'}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="-mt-3 mx-0.5 h-0.5 flex-1 rounded-full bg-ink-50" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Scrollable */}
      <div className="no-scrollbar flex-1 overflow-y-auto pb-28">
        {/* Live preview */}
        <div className="px-5 anim-scale" key={step}>
          <div className="relative overflow-hidden rounded-[28px]" style={{ boxShadow: '0 18px 50px -28px rgba(242,94,115,.35)' }}>
            <div className="aspect-[4/4] w-full">
              <img src={defaultProduct.image} alt="" className="h-full w-full object-cover" />
            </div>
            <div
              className="absolute inset-0 mix-blend-multiply"
              style={{ background: COLOURS.find((c) => c.name === config.colour)?.hex + '33' }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="mt-6 space-y-3 px-5">
          {step === 0 && (
            <>
              <ChipGroup
                icon={Cake}
                label="Shape"
                value={config.shape}
                options={SHAPES}
                onChange={(v) => setConfig({ ...config, shape: v })}
              />
              <ChipGroup
                icon={Droplet}
                label="Flavour"
                value={config.flavour}
                options={FLAVOURS}
                onChange={(v) => setConfig({ ...config, flavour: v })}
              />
              <ColourPicker
                value={config.colour}
                onChange={(v) => setConfig({ ...config, colour: v })}
              />
            </>
          )}

          {step === 1 && (
            <ChipGroup
              icon={Weight}
              label="Weight"
              value={config.weight}
              options={WEIGHTS.map((w) => w.size)}
              onChange={(v) => setConfig({ ...config, weight: v })}
            />
          )}

          {step === 2 && (
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
              <div className="mt-3 rounded-2xl bg-blush-50 px-3.5 py-3 text-[11.5px] text-ink-300">
                💡 Keep it short and sweet for the best look.
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <h3 className="px-1 text-[13px] font-bold text-ink">Your customisations</h3>
              <Card>
                <Review label="Shape" value={config.shape} />
                <Review label="Flavour" value={config.flavour} />
                <Review label="Colour" value={config.colour} />
              </Card>
              <h3 className="px-1 pt-1 text-[13px] font-bold text-ink">Size & message</h3>
              <Card>
                <Review label="Weight" value={config.weight} />
                <Review label="Message" value={config.message || '— none —'} last />
              </Card>
            </div>
          )}

          {step === 4 && (
            <div className="overflow-hidden rounded-3xl bg-white" style={{ boxShadow: '0 1px 2px rgba(26,19,17,.02), 0 18px 50px -28px rgba(242,94,115,.25)' }}>
              <div className="bg-cream px-5 py-3.5">
                <div className="text-[10px] font-bold tracking-wider text-coral uppercase">Your cake</div>
                <div className="mt-0.5 font-display text-[20px] font-bold tracking-tight text-ink">
                  {defaultProduct.name}
                </div>
              </div>
              <div className="space-y-2.5 px-5 py-4 text-[13.5px]">
                <Review label="Shape" value={config.shape} />
                <Review label="Flavour" value={config.flavour} />
                <Review label="Weight" value={config.weight} />
                <Review label="Colour" value={config.colour} />
                <Review label="Message" value={config.message || '— none —'} last />
              </div>
              <div className="border-t border-ink-50 bg-cream px-5 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-ink-200">Total</span>
                  <span className="font-display text-[22px] font-bold tabular text-coral">
                    {formatINR(price)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="absolute right-0 bottom-0 left-0 z-30 border-t border-ink-50/80 bg-white/95 px-5 pt-3 pb-6 backdrop-blur-xl">
        <button
          onClick={next}
          className="btn-primary flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-[14px] font-bold tracking-tight"
        >
          {nextLabel}
          <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

function ChipGroup({
  icon: Icon, label, value, options, onChange,
}: {
  icon: any; label: string; value: string; options: string[]; onChange: (v: string) => void;
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
              value === o
                ? 'border-coral bg-coral text-white'
                : 'border-ink-50 bg-white text-ink'
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </section>
  );
}

function ColourPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <section className="rounded-2xl bg-white p-3.5" style={{ boxShadow: '0 1px 2px rgba(26,19,17,.02), 0 6px 18px -14px rgba(26,19,17,.16)' }}>
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-coral-50 text-coral">
          <Palette className="h-4 w-4" strokeWidth={2} />
        </div>
        <h3 className="font-display text-[14px] font-bold tracking-tight text-ink">Colour theme</h3>
        <span className="ml-auto text-[11px] font-semibold text-ink-200">{value}</span>
      </div>
      <div className="grid grid-cols-6 gap-2">
        {COLOURS.map((c) => (
          <button
            key={c.name}
            onClick={() => onChange(c.name)}
            className={`relative aspect-square overflow-hidden rounded-xl border-2 transition active:scale-95 ${
              value === c.name ? 'border-coral' : 'border-ink-50'
            }`}
            style={{ background: c.hex }}
          >
            {value === c.name && (
              <span className="absolute inset-0 flex items-center justify-center text-white">
                <Check className="h-4 w-4" strokeWidth={3} style={{ color: c.name === 'White' ? '#F25E73' : '#fff' }} />
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="overflow-hidden rounded-2xl bg-white p-3.5"
      style={{ boxShadow: '0 1px 2px rgba(26,19,17,.02), 0 6px 18px -14px rgba(26,19,17,.16)' }}
    >
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Review({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${last ? '' : 'border-b border-ink-50 pb-2'}`}>
      <span className="text-[12.5px] text-ink-200">{label}</span>
      <span className="text-[12.5px] font-bold text-ink">{value}</span>
    </div>
  );
}