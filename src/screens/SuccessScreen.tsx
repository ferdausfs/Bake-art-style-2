import { Check, Home, Receipt, Wallet, Cake, Sparkles, Heart, Truck, PartyPopper } from 'lucide-react';
import { useUI, useWallet } from '../lib/store';

export default function SuccessScreen() {
  const { view, setTab, go } = useUI();
  const { balance } = useWallet();
  const orderId = view.name === 'success' ? view.orderId : '';

  const timelineIcons: { Icon: typeof Cake; }[] = [
    { Icon: Cake },
    { Icon: Sparkles },
    { Icon: Heart },
    { Icon: Truck },
    { Icon: PartyPopper },
  ];

  return (
    <div className="mesh-warm relative flex h-full flex-col items-center justify-between overflow-hidden px-7 pt-12 pb-10">
      <svg
        className="absolute -top-16 -left-16 h-80 w-80 text-blush-200"
        viewBox="0 0 200 200"
        fill="currentColor"
      >
        <path d="M40,-60C50,-50,55,-35,60,-20C65,-5,70,10,65,25C60,40,45,55,28,62C11,69,-8,68,-25,60C-42,52,-57,37,-65,18C-73,-1,-74,-24,-65,-42C-56,-60,-37,-73,-18,-72C1,-71,18,-56,30,-46Z" transform="translate(100 100)" />
      </svg>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center">
        <div className="relative mb-6">
          <span className="absolute inset-0 rounded-full bg-coral/30 blur-2xl anim-heartbeat" />
          <span className="absolute inset-0 rounded-full anim-ring" />
          <div
            className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-coral-400 to-coral-600 text-white anim-pop"
            style={{ boxShadow: '0 18px 40px -12px rgba(242,94,115,.5)' }}
          >
            <Check className="h-12 w-12" strokeWidth={2.5} />
          </div>
        </div>

        <h1 className="font-display text-[36px] font-bold leading-tight tracking-tight text-ink anim-rise delay-1">
          Order placed!
        </h1>
        <p className="mt-3 max-w-[280px] text-[14px] leading-relaxed text-ink-200 anim-rise delay-2">
          Your cake from Bake Art Style is being prepared with love and will reach you fresh.
        </p>

        <div
          className="mt-6 rounded-2xl bg-white px-5 py-3 anim-rise delay-3"
          style={{ boxShadow: '0 1px 2px rgba(26,19,17,.02), 0 12px 30px -16px rgba(26,19,17,.18)' }}
        >
          <div className="text-[10px] font-bold tracking-wider text-ink-200 uppercase">Order ID</div>
          <div className="font-display text-[18px] font-bold tabular text-coral">#{orderId}</div>
        </div>

        {/* Wallet earn info */}
        <div className="mt-3 rounded-2xl bg-coral-50 border border-coral/20 px-4 py-2.5 anim-rise delay-4 flex items-center gap-2">
          <Wallet className="h-5 w-5 text-coral" strokeWidth={2} />
          <div>
            <div className="text-[12px] font-bold text-coral-800">Wallet reward pending!</div>
            <div className="text-[11px] text-coral-600">Wallet balance: ৳{balance.toLocaleString()}</div>
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-6 flex items-center gap-3 anim-rise delay-4 text-ink-200">
          {timelineIcons.map((t, i) => (
            <t.Icon key={i} className="h-4 w-4" strokeWidth={1.75} />
          ))}
        </div>
      </div>

      <div className="relative z-10 w-full max-w-sm space-y-2.5 anim-up delay-5">
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <div className="h-2 w-2 rounded-full bg-coral animate-ping" />
          <span className="text-[11px] font-semibold text-coral">Live tracking available</span>
        </div>
        <button
          onClick={() => go({ name: 'tracking', orderId })}
          className="btn-primary flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-[14px] font-bold tracking-tight"
        >
          <Receipt className="h-[18px] w-[18px]" />
          Track my order
        </button>
        <button
          onClick={() => setTab('home')}
          className="btn-secondary flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-[14px] font-bold tracking-tight"
        >
          <Home className="h-[18px] w-[18px]" />
          Continue shopping
        </button>
      </div>
    </div>
  );
}
