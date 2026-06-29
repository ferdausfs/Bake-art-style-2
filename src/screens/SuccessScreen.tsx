import { useState, useEffect } from 'react';
import { Check, Home, Receipt, Wallet, Cake, Sparkles, Heart, Truck, PartyPopper, Clock, Copy } from 'lucide-react';
import { useUI, useWallet, useOrders, useSettingsStore } from '../lib/store';
import { safeArray } from '../lib/utils';

export default function SuccessScreen() {
  const { view, setTab, go } = useUI();
  const { balance } = useWallet();
  const orderId = view.name === 'success' ? view.orderId : '';
  const { settings } = useSettingsStore();
  const { orders } = useOrders();
  const order = orders.find(o => o.id === orderId);
  const itemCount = safeArray(order?.items).reduce((s: number, i: any) => s + (i.quantity ?? 1), 0);

  const timelineIcons: { Icon: typeof Cake; }[] = [
    { Icon: Cake },
    { Icon: Sparkles },
    { Icon: Heart },
    { Icon: Truck },
    { Icon: PartyPopper },
  ];

  const [showConfetti, setShowConfetti] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Screen mount হলে 300ms পর confetti fire করো
    const t = setTimeout(() => setShowConfetti(true), 300);
    return () => clearTimeout(t);
  }, []);

  const copyOrderId = () => {
    const id = orderId ?? order?.id ?? '';
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="mesh-warm relative flex h-full flex-col items-center justify-between overflow-hidden px-7 pt-12 pb-10">
      {/* Confetti */}
      {showConfetti && (
        <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden" aria-hidden="true">
          {Array.from({ length: 18 }).map((_, i) => (
            <span
              key={i}
              className="absolute block h-2 w-2 rounded-sm anim-confetti"
              style={{
                left: `${5 + (i * 5.5) % 90}%`,
                top: '-10px',
                background: ['#E8526A','#C8944A','#FFE4E9','#1baf7a','#3B6D11','#E8526A','#C8944A'][i % 7],
                animationDelay: `${(i * 0.12)}s`,
                animationDuration: `${1.8 + (i % 4) * 0.3}s`,
              }}
            />
          ))}
        </div>
      )}

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
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono text-[13px] font-bold text-ink">
              #{orderId ?? order?.id}
            </span>
            <button
              onClick={copyOrderId}
              className="flex items-center gap-1 rounded-lg bg-ink-50 px-2 py-1 text-[11px] font-medium text-ink-200 transition active:scale-95"
              aria-label="Copy order ID"
            >
              {copied
                ? <><Check className="h-3 w-3 text-green-500" /> Copied!</>
                : <><Copy className="h-3 w-3" /> Copy</>
              }
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 anim-rise delay-4"
          style={{ boxShadow: '0 1px 2px rgba(26,19,17,.02), 0 12px 30px -16px rgba(26,19,17,.18)' }}>
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-coral/10">
            <Clock className="h-5 w-5 text-coral" strokeWidth={2} />
          </div>
          <div className="text-left">
            <p className="text-[11px] font-medium text-ink/50">আনুমানিক ডেলিভারি</p>
            <p className="text-[13px] font-bold text-ink">
              {settings?.deliveryEstimate ?? '45-60 মিনিট'}
            </p>
          </div>
          <div className="ml-auto h-2 w-2 rounded-full bg-green-400 animate-pulse" />
        </div>

        {/* Wallet earn info */}
        <div className="mt-3 rounded-2xl bg-coral-50 border border-coral/20 px-4 py-2.5 anim-rise delay-4 flex items-center gap-2">
          <Wallet className="h-5 w-5 text-coral" strokeWidth={2} />
          <div className="text-left">
            <div className="text-[12px] font-bold text-coral-800">Wallet reward pending!</div>
            <div className="text-[11px] text-coral-600">Wallet balance: ৳{balance.toLocaleString()}</div>
          </div>
        </div>

        {order && (
          <div className="mt-3 rounded-2xl bg-white px-4 py-3 anim-rise delay-5 w-full max-w-[300px] text-left"
            style={{ boxShadow: '0 1px 2px rgba(26,19,17,.02), 0 8px 24px -16px rgba(26,19,17,.18)' }}>
            <p className="text-[10px] font-bold tracking-wider text-ink-200 uppercase mb-2">অর্ডার সারাংশ</p>
            <div className="flex items-center justify-between">
              <p className="text-[13px] text-ink">
                {itemCount}টি আইটেম
              </p>
              <p className="text-[13px] font-bold text-ink">৳{order.total?.toLocaleString()}</p>
            </div>
            {safeArray(order.items).slice(0, 2).map((item: any) => (
              <p key={item.id ?? item.productId ?? item.name} className="text-[11px] text-ink/50 mt-0.5 truncate">
                {item.name} × {item.quantity ?? 1}
              </p>
            ))}
            {safeArray(order.items).length > 2 && (
              <p className="text-[11px] text-ink/40 mt-0.5">
                +{safeArray(order.items).length - 2} আরও
              </p>
            )}
          </div>
        )}

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

        {/* Share on WhatsApp */}
        {(() => {
          const id = orderId ?? order?.id ?? '';
          const msg = encodeURIComponent(
            `আমি Bake Art Style থেকে একটি cake order করেছি! 🎂\nOrder ID: #${id}\nতোমরাও order করতে পারো: https://bas.umuhammadiswa.workers.dev`
          );
          return (
            <a
              href={`https://wa.me/?text=${msg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] text-[13px] font-bold text-white transition active:scale-[.98]"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp এ শেয়ার করুন
            </a>
          );
        })()}

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
