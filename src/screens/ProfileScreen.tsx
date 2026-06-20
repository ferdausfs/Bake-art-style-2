import { Heart, MapPin, CreditCard, Bell, HelpCircle, Settings, LogOut, ChevronRight, Star, Sparkles, LogIn, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useUI, useUser, useOrders, useCart, useAuthStore } from '../lib/store';
import { useProducts } from '../hooks/useProducts';
import { useAuth } from '../hooks/useAuth';
import BrandLogo from '../components/BrandLogo';
import { ChatBot } from '../components/ChatBot';

interface Props {
  onAuthOpen?: () => void;
}

export default function ProfileScreen({ onAuthOpen }: Props) {
  const { go, setChatOpen } = useUI();
  const { wishlist } = useUser();
  const { orders } = useOrders();
  const { items } = useCart();
  const { user } = useAuthStore();
  const { signOut } = useAuth();
  const { products } = useProducts();
  const [contactOpen, setContactOpen] = useState(false);

  const wishlistItems = products.filter((p) => wishlist.includes(p.id));

  useEffect(() => {
    setChatOpen(contactOpen);
    return () => setChatOpen(false);
  }, [contactOpen, setChatOpen]);

  const menu = [
    { Icon: Heart, label: 'Wishlist', sub: `${wishlist.length} saved items`, accent: 'text-coral', action: () => go({ name: 'wishlist' }) },
    { Icon: MapPin, label: 'Addresses', sub: 'Manage delivery addresses', accent: 'text-ink', action: () => {} },
    { Icon: CreditCard, label: 'Payment methods', sub: 'bKash, Nagad, Cash', accent: 'text-ink', action: () => {} },
    { Icon: Bell, label: 'Notifications', sub: 'Order & promo updates', accent: 'text-ink', action: () => {} },
    { Icon: HelpCircle, label: 'Contact & Support', sub: 'কোনো সমস্যা? আমাদের জানান', accent: 'text-coral', action: () => setContactOpen(true) },
    { Icon: Settings, label: 'Settings', sub: 'App preferences', accent: 'text-ink', action: () => {} },
  ];

  // Not logged in
  if (!user) {
    return (
      <div className="flex h-full flex-col bg-cream items-center justify-center px-8 text-center">
        <div className="text-5xl mb-4">👤</div>
        <h2 className="font-display text-2xl font-bold text-ink mb-2">Sign In</h2>
        <p className="text-sm text-ink/50 mb-6">Sign in to view your orders, wishlist, and profile.</p>
        <button onClick={onAuthOpen}
          className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-coral text-white font-bold text-sm">
          <LogIn className="w-4 h-4" /> Sign In
        </button>
      </div>
    );
  }

  const initials = user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="flex h-full flex-col bg-cream">
      <header className="flex-shrink-0 px-5 pt-3 pb-2">
        <h1 className="font-display text-[28px] font-bold tracking-tight text-ink">Profile</h1>
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto pb-32">
        {/* Member card */}
        <div className="px-5 anim-up">
          <div
            className="relative overflow-hidden rounded-[28px] p-5"
            style={{ background: 'linear-gradient(135deg, #F25E73 0%, #B73A4D 100%)' }}
          >
            <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-gold/15" />

            <div className="relative flex items-center gap-3.5">
              <div
                className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-white/25 text-[24px] font-bold text-white backdrop-blur"
                style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,.3)' }}
              >
                {user.avatar && user.avatar.length > 2 ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover rounded-2xl" />
                ) : initials}
              </div>
              <div className="flex-1">
                <div className="font-display text-[18px] font-bold tracking-tight text-white">{user.name}</div>
                {user.email && <div className="text-[12px] text-white/80">{user.email}</div>}
                <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase backdrop-blur">
                  <Star className="h-2.5 w-2.5 fill-white text-white" /> Member
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2.5 px-5 anim-up delay-1">
          <Stat label="Orders" value={orders.length} />
          <Stat label="Wishlist" value={wishlist.length} />
          <Stat label="In cart" value={items.length} />
        </div>

        {/* Wishlist preview */}
        {wishlistItems.length > 0 && (
          <div className="mt-5 anim-up delay-2">
            <div className="flex items-center justify-between px-5">
              <h3 className="font-display text-[15px] font-bold tracking-tight text-ink">Wishlist</h3>
              <button onClick={() => go({ name: 'wishlist' })} className="text-[12px] font-bold text-coral">See all</button>
            </div>
            <div className="no-scrollbar mt-3 flex gap-2.5 overflow-x-auto px-5 pb-1">
              {wishlistItems.slice(0, 6).map((p) => (
                <button
                  key={p.id}
                  onClick={() => go({ name: 'product', productId: p.id })}
                  className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl active:scale-95"
                  style={{ boxShadow: '0 6px 14px -8px rgba(26,19,17,.3)' }}
                >
                  <img src={p.image} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Menu list */}
        <div className="mt-5 px-5 anim-up delay-3">
          <div
            className="overflow-hidden rounded-2xl bg-white"
            style={{ boxShadow: '0 1px 2px rgba(26,19,17,.02), 0 8px 24px -16px rgba(26,19,17,.16)' }}
          >
            {menu.map((m, i) => (
              <button
                key={m.label}
                onClick={m.action}
                className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-cream ${i !== menu.length - 1 ? 'border-b border-ink-50' : ''}`}
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-coral-50 ${m.accent}`}>
                  <m.Icon className="h-[17px] w-[17px]" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <div className="text-[13.5px] font-bold text-ink">{m.label}</div>
                  <div className="text-[11px] text-ink-200">{m.sub}</div>
                </div>
                <ChevronRight className="h-4 w-4 text-ink-200" />
              </button>
            ))}
          </div>
        </div>

        {/* Refer a friend */}
        <div className="mt-4 px-5 anim-up delay-4">
          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-coral-300 bg-coral-50/40 px-3.5 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-coral text-white">
              <Sparkles className="h-4 w-4" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-bold text-ink">Invite friends, earn ৳200</div>
              <div className="text-[11px] text-ink-200">Share your referral link</div>
            </div>
            <button className="rounded-full bg-coral px-3 py-1.5 text-[11px] font-bold text-white active:scale-95">
              Invite
            </button>
          </div>
        </div>

        {/* Sign out */}
        <div className="mt-4 px-5 anim-up delay-4">
          <button
            onClick={signOut}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-ink-50 bg-white py-3.5 text-[13px] font-bold text-coral transition active:scale-[.98]"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>

        {/* Brand */}
        <div className="mt-6 flex items-center justify-center gap-2 text-ink-200">
          <BrandLogo size={18} />
          <span className="text-[11px] font-medium tracking-wider uppercase">Bake Art Style · v2.0</span>
        </div>
      </div>

      {/* Contact & Support overlay */}
      {contactOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm" onClick={() => setContactOpen(false)} />
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] z-[61] bg-cream rounded-t-3xl shadow-2xl">
            <div className="w-10 h-1 bg-ink/10 rounded-full mx-auto mt-3" />
            <div className="px-5 pt-4 pb-2 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-ink">যোগাযোগ ও সহায়তা</h2>
              <button onClick={() => setContactOpen(false)} className="w-8 h-8 rounded-full bg-ink/5 flex items-center justify-center">
                <X className="w-4 h-4 text-ink/60" />
              </button>
            </div>
            <div className="px-5 pb-8">
              <ChatBot embedded />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="rounded-2xl bg-white p-3 text-center"
      style={{ boxShadow: '0 1px 2px rgba(26,19,17,.02), 0 6px 18px -14px rgba(26,19,17,.16)' }}
    >
      <div className="font-display text-[20px] font-bold tabular text-ink">{value}</div>
      <div className="mt-0.5 text-[10.5px] font-semibold text-ink-200">{label}</div>
    </div>
  );
}
