import {
  Heart, MapPin, CreditCard, Bell, HelpCircle, Settings, LogOut,
  ChevronRight, Star, Sparkles, LogIn, X, Save, Check
} from 'lucide-react';
import { useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { useUI, useUser, useOrders, useCart, useAuthStore } from '../lib/store';
import { useProducts } from '../hooks/useProducts';
import { useAuth } from '../hooks/useAuth';
import BrandLogo from '../components/BrandLogo';
import { ChatBot } from '../components/ChatBot';
const AdminPanel = lazy(() =>
  import('../components/AdminPanel').then((m) => ({ default: m.AdminPanel }))
);

interface Props {
  onAuthOpen?: () => void;
  isAdmin?: boolean;
}

type SavedPayment = 'bkash' | 'nagad' | 'cash';

type CustomerProfile = {
  name: string;
  phone: string;
  address: string;
  district: string;
  payment: SavedPayment;
};

const CUSTOMER_PROFILE_KEY = 'bakeart-customer-profile';

const DISTRICTS = [
  'Comilla', 'Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi',
  'Khulna', 'Mymensingh', 'Barishal', 'Rangpur',
];

const PAYMENTS: { id: SavedPayment; label: string; sub: string }[] = [
  { id: 'bkash', label: 'bKash', sub: 'Mobile payment' },
  { id: 'nagad', label: 'Nagad', sub: 'Mobile payment' },
  { id: 'cash', label: 'Cash on Delivery', sub: 'Pay when delivered' },
];

const emptyCustomerProfile = (name = ''): CustomerProfile => ({
  name,
  phone: '',
  address: '',
  district: 'Comilla',
  payment: 'cash',
});

function loadCustomerProfile(userId: string | undefined, defaultName = ''): CustomerProfile {
  try {
    const key = userId ? `${CUSTOMER_PROFILE_KEY}-${userId}` : CUSTOMER_PROFILE_KEY;
    const raw = localStorage.getItem(key);
    if (!raw) return emptyCustomerProfile(defaultName);
    return { ...emptyCustomerProfile(defaultName), ...JSON.parse(raw) };
  } catch {
    return emptyCustomerProfile(defaultName);
  }
}

function saveCustomerProfile(userId: string | undefined, profile: CustomerProfile) {
  const key = userId ? `${CUSTOMER_PROFILE_KEY}-${userId}` : CUSTOMER_PROFILE_KEY;
  localStorage.setItem(key, JSON.stringify(profile));
}

export default function ProfileScreen({ onAuthOpen, isAdmin = false }: Props) {
  const { go, setChatOpen } = useUI();
  const { wishlist } = useUser();
  const { orders } = useOrders();
  const { items } = useCart();
  const { user } = useAuthStore();
  const { signOut } = useAuth();
  const { products } = useProducts();

  const [contactOpen, setContactOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);

  const [savedProfile, setSavedProfile] = useState<CustomerProfile>(() =>
    loadCustomerProfile(user?.id, user?.name ?? '')
  );
  const [draftProfile, setDraftProfile] = useState<CustomerProfile>(() =>
    loadCustomerProfile(user?.id, user?.name ?? '')
  );

  const wishlistItems = products.filter((p) => wishlist.includes(p.id));

  const profileComplete = !!(
    savedProfile.name &&
    savedProfile.phone &&
    savedProfile.address
  );

  const paymentLabel = useMemo(
    () => PAYMENTS.find((p) => p.id === savedProfile.payment)?.label ?? 'Cash on Delivery',
    [savedProfile.payment]
  );

  useEffect(() => {
    const next = loadCustomerProfile(user?.id, user?.name ?? '');
    setSavedProfile(next);
    setDraftProfile(next);
  }, [user?.id, user?.name]);

  useEffect(() => {
    setChatOpen(contactOpen || customerOpen);
    return () => setChatOpen(false);
  }, [contactOpen, customerOpen, setChatOpen]);

  const openCustomerEditor = () => {
    const latest = loadCustomerProfile(user?.id, user?.name ?? '');
    setDraftProfile(latest);
    setCustomerOpen(true);
  };

  const handleSaveCustomer = () => {
    const next: CustomerProfile = {
      name: draftProfile.name.trim(),
      phone: draftProfile.phone.trim(),
      address: draftProfile.address.trim(),
      district: draftProfile.district.trim() || 'Comilla',
      payment: draftProfile.payment,
    };

    saveCustomerProfile(user?.id, next);
    setSavedProfile(next);
    setCustomerOpen(false);
  };

  const menu = [
    {
      Icon: Heart,
      label: 'Wishlist',
      sub: `${wishlist.length} saved items`,
      accent: 'text-coral',
      action: () => go({ name: 'wishlist' }),
    },
    {
      Icon: MapPin,
      label: 'Addresses',
      sub: savedProfile.address ? `${savedProfile.district} · saved` : 'Save delivery address',
      accent: 'text-ink',
      action: openCustomerEditor,
    },
    {
      Icon: CreditCard,
      label: 'Payment methods',
      sub: paymentLabel,
      accent: 'text-ink',
      action: openCustomerEditor,
    },
    {
      Icon: Bell,
      label: 'Notifications',
      sub: 'Order & promo updates',
      accent: 'text-ink',
      action: () => {},
    },
    {
      Icon: HelpCircle,
      label: 'Contact & Support',
      sub: 'কোনো সমস্যা? আমাদের জানান',
      accent: 'text-coral',
      action: () => setContactOpen(true),
    },
    {
      Icon: Settings,
      label: 'Settings',
      sub: 'Customer info & preferences',
      accent: 'text-ink',
      action: openCustomerEditor,
    },
  ];

  if (!user) {
    return (
      <div className="flex h-full flex-col bg-cream items-center justify-center px-8 text-center">
        <div className="text-5xl mb-4">👤</div>
        <h2 className="font-display text-2xl font-bold text-ink mb-2">Sign In</h2>
        <p className="text-sm text-ink/50 mb-6">
          Sign in to save your delivery info, orders, wishlist, and profile.
        </p>
        <button
          onClick={onAuthOpen}
          className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-coral text-white font-bold text-sm"
        >
          <LogIn className="w-4 h-4" /> Sign In
        </button>
      </div>
    );
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-full flex-col bg-cream">
      <header className="flex-shrink-0 px-5 pt-3 pb-2">
        <h1 className="font-display text-[28px] font-bold tracking-tight text-ink">
          Profile
        </h1>
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto pb-32">
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
                <div className="font-display text-[18px] font-bold tracking-tight text-white">
                  {user.name}
                </div>
                {user.email && <div className="text-[12px] text-white/80">{user.email}</div>}
                <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase backdrop-blur">
                  <Star className="h-2.5 w-2.5 fill-white text-white" /> Member
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2.5 px-5 anim-up delay-1">
          <Stat label="Orders" value={orders.length} />
          <Stat label="Wishlist" value={wishlist.length} />
          <Stat label="In cart" value={items.length} />
        </div>

        <div className="mt-4 px-5 anim-up delay-2">
          <button
            onClick={openCustomerEditor}
            className="w-full rounded-2xl bg-white p-4 text-left transition active:scale-[.98]"
            style={{ boxShadow: '0 1px 2px rgba(26,19,17,.02), 0 8px 24px -16px rgba(26,19,17,.16)' }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-bold tracking-wider text-coral uppercase">
                  Quick checkout profile
                </div>
                <div className="mt-1 text-[14px] font-bold text-ink">
                  {profileComplete ? 'Saved for faster checkout' : 'Add info once, checkout faster'}
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                profileComplete ? 'bg-green-50 text-green-700' : 'bg-coral-50 text-coral'
              }`}>
                {profileComplete ? 'Ready' : 'Setup'}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-1.5 text-[11.5px] text-ink-200">
              <div><span className="font-bold text-ink">Name:</span> {savedProfile.name || user.name || 'Not set'}</div>
              <div><span className="font-bold text-ink">Phone:</span> {savedProfile.phone || 'Not set'}</div>
              <div className="line-clamp-2">
                <span className="font-bold text-ink">Address:</span> {savedProfile.address || 'Not set'}
              </div>
              <div><span className="font-bold text-ink">Payment:</span> {paymentLabel}</div>
            </div>
          </button>
        </div>

        {wishlistItems.length > 0 && (
          <div className="mt-5 anim-up delay-2">
            <div className="flex items-center justify-between px-5">
              <h3 className="font-display text-[15px] font-bold tracking-tight text-ink">
                Wishlist
              </h3>
              <button
                onClick={() => go({ name: 'wishlist' })}
                className="text-[12px] font-bold text-coral"
              >
                See all
              </button>
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

        <div className="mt-5 px-5 anim-up delay-3">
          <div
            className="overflow-hidden rounded-2xl bg-white"
            style={{ boxShadow: '0 1px 2px rgba(26,19,17,.02), 0 8px 24px -16px rgba(26,19,17,.16)' }}
          >
            {menu.map((m, i) => (
              <button
                key={m.label}
                onClick={m.action}
                className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-cream ${
                  i !== menu.length - 1 ? 'border-b border-ink-50' : ''
                }`}
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

        <div className="mt-4 px-5 anim-up delay-4">
          <button
            onClick={signOut}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-ink-50 bg-white py-3.5 text-[13px] font-bold text-coral transition active:scale-[.98]"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>

        {/* Admin Dashboard — only visible to admin users */}
        {isAdmin && (
          <div className="px-4 pb-6 anim-up">
            <div className="flex items-center gap-2 mb-3 mt-4">
              <span className="text-lg">⚙️</span>
              <h2 className="font-display text-[17px] font-bold text-ink">Admin Dashboard</h2>
              <span className="ml-auto rounded-full bg-coral px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">Admin</span>
            </div>
            <Suspense fallback={<div className="py-8 text-center text-xs text-ink/40">Loading admin dashboard...</div>}>
              <AdminPanel embedded />
            </Suspense>
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-2 text-ink-200">
          <BrandLogo size={18} />
          <span className="text-[11px] font-medium tracking-wider uppercase">
            Bake Art Style · v2.0
          </span>
        </div>
      </div>

      {customerOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
            onClick={() => setCustomerOpen(false)}
          />
          <div className="fixed bottom-0 left-1/2 z-[61] max-h-[88vh] w-full max-w-[420px] -translate-x-1/2 overflow-hidden rounded-t-3xl glass-strong shadow-2xl">
            <div className="w-10 h-1 bg-ink/10 rounded-full mx-auto mt-3" />

            <div className="px-5 pt-4 pb-2 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-ink">Checkout Profile</h2>
                <p className="text-[11px] text-ink-200">
                  একবার save করলে checkout-এ auto-fill হবে
                </p>
              </div>
              <button
                onClick={() => setCustomerOpen(false)}
                className="w-8 h-8 rounded-full bg-ink/5 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-ink/60" />
              </button>
            </div>

            <div className="no-scrollbar max-h-[72vh] overflow-y-auto px-5 pb-6 pt-2 space-y-3">
              <Field
                label="আপনার নাম"
                value={draftProfile.name}
                onChange={(v) => setDraftProfile({ ...draftProfile, name: v })}
                placeholder="আপনার নাম"
              />

              <Field
                label="মোবাইল নম্বর"
                value={draftProfile.phone}
                onChange={(v) => setDraftProfile({ ...draftProfile, phone: v })}
                placeholder="01XXXXXXXXX"
                inputMode="tel"
              />

              <label className="block">
                <span className="mb-1 block text-[10.5px] font-bold tracking-wider text-ink-200 uppercase">
                  সম্পূর্ণ ঠিকানা
                </span>
                <textarea
                  value={draftProfile.address}
                  onChange={(e) => setDraftProfile({ ...draftProfile, address: e.target.value })}
                  placeholder="বাসা/রোড/এলাকা"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-ink-50 bg-white px-3 py-2.5 text-[13px] font-medium text-ink outline-none focus:border-coral focus:ring-2 focus:ring-coral/15"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[10.5px] font-bold tracking-wider text-ink-200 uppercase">
                  জেলা / এলাকা
                </span>
                <select
                  value={draftProfile.district}
                  onChange={(e) => setDraftProfile({ ...draftProfile, district: e.target.value })}
                  className="h-11 w-full rounded-xl border border-ink-50 bg-white px-3 text-[13px] font-medium text-ink outline-none focus:border-coral focus:ring-2 focus:ring-coral/15"
                >
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </label>

              <div>
                <div className="mb-1 text-[10.5px] font-bold tracking-wider text-ink-200 uppercase">
                  Default payment
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {PAYMENTS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setDraftProfile({ ...draftProfile, payment: p.id })}
                      className={`flex items-center justify-between rounded-xl border-2 p-3 text-left ${
                        draftProfile.payment === p.id
                          ? 'border-coral bg-coral-50/50'
                          : 'border-ink-50 bg-white'
                      }`}
                    >
                      <div>
                        <div className="text-[13px] font-bold text-ink">{p.label}</div>
                        <div className="text-[10.5px] text-ink-200">{p.sub}</div>
                      </div>
                      <div className={`flex h-5 w-5 items-center justify-center rounded-full ${
                        draftProfile.payment === p.id
                          ? 'bg-coral text-white'
                          : 'border border-ink-50 bg-white'
                      }`}>
                        {draftProfile.payment === p.id && <Check className="h-3 w-3" strokeWidth={3} />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSaveCustomer}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-coral text-[13px] font-bold text-white"
              >
                <Save className="h-4 w-4" />
                Save for Checkout
              </button>
            </div>
          </div>
        </>
      )}

      {contactOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
            onClick={() => setContactOpen(false)}
          />
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] z-[61] glass-strong rounded-t-3xl shadow-2xl">
            <div className="w-10 h-1 bg-ink/10 rounded-full mx-auto mt-3" />
            <div className="px-5 pt-4 pb-2 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-ink">যোগাযোগ ও সহায়তা</h2>
              <button
                onClick={() => setContactOpen(false)}
                className="w-8 h-8 rounded-full bg-ink/5 flex items-center justify-center"
              >
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

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: 'text' | 'tel';
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10.5px] font-bold tracking-wider text-ink-200 uppercase">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="h-11 w-full rounded-xl border border-ink-50 bg-white px-3 text-[13px] font-medium text-ink outline-none focus:border-coral focus:ring-2 focus:ring-coral/15"
      />
    </label>
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
