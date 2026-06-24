import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Heart, MapPin, CreditCard, Bell, HelpCircle, Settings, LogOut,
  ChevronRight, Star, Sparkles, LogIn, X, Save, Check, User, AlertTriangle
} from 'lucide-react';
import { useUI, useUser, useOrders, useCart, useAuthStore, useLoyalty } from '../lib/store';
import { useProducts } from '../hooks/useProducts';
import { useAuth } from '../hooks/useAuth';
import { ls } from '../lib/utils';
import BrandLogo from '../components/BrandLogo';
import { ChatBot } from '../components/ChatBot';
import { AdminPanel } from '../components/AdminPanel';
import type { SavedAddress, SpecialDate } from '../types';

const loadAddresses = (userId?: string): SavedAddress[] => {
  if (!userId) return [];
  return ls.get<SavedAddress[]>(`bakeart-addresses-${userId}`, []);
};
const saveAddresses = (userId: string, addresses: SavedAddress[]) => {
  ls.set(`bakeart-addresses-${userId}`, addresses);
};

const loadSpecialDates = (userId?: string): SpecialDate[] =>
  userId ? ls.get<SpecialDate[]>(`bakeart-dates-${userId}`, []) : [];
const saveSpecialDates = (userId: string, dates: SpecialDate[]) =>
  ls.set(`bakeart-dates-${userId}`, dates);

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

class AdminErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; errorMessage: string }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorMessage: error?.message || String(error) };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("AdminPanel render error caught by Boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-5 mt-4 text-center">
          <div className="flex justify-center text-red-500 mb-2">
            <AlertTriangle size={32} strokeWidth={1.75} />
          </div>
          <h2 className="text-sm font-bold text-red-700 mb-1">Admin Dashboard Error</h2>
          <p className="text-xs text-red-500 mb-2">{this.state.errorMessage}</p>
          <p className="text-xs text-ink/40">Refresh the page to retry.</p>
          <button
            onClick={() => this.setState({ hasError: false, errorMessage: '' })}
            className="mt-3 px-4 py-2 rounded-xl bg-ink text-white text-xs font-bold"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ProfileScreen({ onAuthOpen, isAdmin = false }: Props) {
  const { go, setChatOpen } = useUI();
  const { wishlist } = useUser();
  const { orders } = useOrders();
  const { items } = useCart();
  const { user } = useAuthStore();
  const { signOut } = useAuth();
  const { products } = useProducts();
  const { points, history } = useLoyalty();

  const [contactOpen, setContactOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);

  const [savedProfile, setSavedProfile] = useState<CustomerProfile>(() =>
    loadCustomerProfile(user?.id, user?.name ?? '')
  );
  const [draftProfile, setDraftProfile] = useState<CustomerProfile>(() =>
    loadCustomerProfile(user?.id, user?.name ?? '')
  );

  const [addresses, setAddresses] = useState<SavedAddress[]>(() => loadAddresses(user?.id));
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [addrForm, setAddrForm] = useState({ name: '', address: '', district: '', phone: '' });

  const [specialDates, setSpecialDates] = useState<SpecialDate[]>(() => loadSpecialDates(user?.id));
  const [showDatesModal, setShowDatesModal] = useState(false);
  const [dateForm, setDateForm] = useState({ type: 'birthday' as SpecialDate['type'], name: '', date: '' });

  const wishlistItems = (products ?? []).filter((p) => p && wishlist.includes(p.id));

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

  useEffect(() => {
    if (user?.id) saveAddresses(user.id, addresses);
  }, [addresses, user?.id]);

  useEffect(() => {
    if (user?.id) saveSpecialDates(user.id, specialDates);
  }, [specialDates, user?.id]);

  useEffect(() => {
    if (!user?.id || specialDates.length === 0) return;
    const today = new Date();
    const currentYear = today.getFullYear();
    const updated = [...specialDates];
    let changed = false;
    updated.forEach((d, i) => {
      const [month, day] = d.date.split('-').map(Number);
      const eventDate = new Date(currentYear, month - 1, day);
      const diffDays = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 7 && d.notifiedYear !== currentYear) {
        useUI.getState().addNotification(
          `🎂 ${d.name} in ${diffDays === 0 ? 'today!' : `${diffDays} day${diffDays > 1 ? 's' : ''}!`}`,
          `Order a special cake now to celebrate! 🎉`
        );
        updated[i] = { ...d, notifiedYear: currentYear };
        changed = true;
      }
    });
    if (changed) setSpecialDates(updated);
  }, [user?.id]); // eslint-disable-line

  const openCustomerEditor = () => {
    const latest = loadCustomerProfile(user?.id, user?.name ?? '');
    setDraftProfile(latest);
    setCustomerOpen(true);
  };

  const handleSaveCustomer = useCallback(() => {
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
  }, [draftProfile, user?.id]);

  const menu = [
    {
      Icon: Heart,
      label: 'Wishlist',
      sub: `${(wishlist ?? []).length} saved items`,
      action: () => go({ name: 'wishlist' }),
    },
    {
      Icon: MapPin,
      label: 'Addresses',
      sub: savedProfile.address ? `${savedProfile.district} · saved` : 'Save delivery address',
      action: openCustomerEditor,
    },
    {
      Icon: CreditCard,
      label: 'Payment methods',
      sub: paymentLabel,
      action: openCustomerEditor,
    },
    {
      Icon: Bell,
      label: 'Notifications',
      sub: 'Order & promo updates',
      action: () => {},
    },
    {
      Icon: HelpCircle,
      label: 'Contact & Support',
      sub: 'কোনো সমস্যা? আমাদের জানান',
      action: () => setContactOpen(true),
    },
    {
      Icon: Settings,
      label: 'Settings',
      sub: 'Customer info & preferences',
      action: openCustomerEditor,
    },
  ];

  if (!user) {
    return (
      <div className="flex h-full flex-col bg-cream items-center justify-center px-8 text-center">
        <div className="flex justify-center text-ink-200 opacity-60 mb-4">
          <User size={48} strokeWidth={1.5} />
        </div>
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
            style={{ background: 'linear-gradient(135deg, #2A1F1E 0%, #3D2D2C 100%)' }}
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

        {/* Loyalty Points Card */}
        {user && (
          <section className="px-4 pt-2 pb-1">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 px-5 py-4 text-white"
              style={{ boxShadow: '0 8px 24px -8px rgba(217,161,91,.5)' }}>
              {/* Background decoration */}
              <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
              <div className="pointer-events-none absolute -right-1 top-8 h-16 w-16 rounded-full bg-white/8" />
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-white/70">Loyalty Points</div>
                  <div className="mt-1 font-display text-[36px] font-bold leading-none
..." />
                  <div className="mt-1 text-[11px] text-white/80">
                    Earn 1 point per ৳10 spent · Redeem 1000 pts = ৳50 off
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] font-bold text-white/80">
                      <span>Next reward at 1000 pts</span>
                      <span>{points % 1000}/1000</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-white/20">
                      <div className="h-full rounded-full bg-white transition-all"
                        style={{ width: `${Math.min(100, ((points % 1000) / 1000) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Loyalty History */}
        {user && history.length > 0 && (
          <section className="px-4 pb-2">
            <div className="rounded-2xl bg-white overflow-hidden"
              style={{ boxShadow: '0 1px 2px rgba(26,19,17,.02), 0 4px 12px -8px rgba(26,19,17,.10)' }}>
              <div className="px-4 py-3 border-b border-ink/5">
                <span className="text-[12px] font-bold text-ink">Points History</span>
              </div>
              <div className="divide-y divide-ink/5">
                {history.slice(0, 5).map((h) => (
                  <div key={h.id} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <div className="text-[12px] font-semibold text-ink">
                        {h.type === 'earned' ? '⭐ Points earned' : '🎁 Points redeemed'}
                      </div>
                      <div className="text-[10px] text-ink/40">
                        {new Date(h.date).toLocaleDateString('en-BD', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                    <span className={`text-[13px] font-bold ${h.type === 'earned' ? 'text-emerald-600' : 'text-coral'}`}>
                      {h.type === 'earned' ? '+' : ''}{h.points.toLocaleString()} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2.5 px-5 anim-up delay-1">
          <Stat label="Orders" value={(orders ?? []).length} />
          <Stat label="Wishlist" value={(wishlist ?? []).length} />
          <Stat label="In cart" value={(items ?? []).length} />
        </div>

        <div className="mt-4 px-5 anim-up delay-2">
          <button
            onClick={openCustomerEditor}
            className="w-full rounded-2xl bg-white p-4 text-left transition active:scale-[.98]"
            style={{ boxShadow: '0 1px 2px rgba(26,19,17,.02), 0 8px 24px -16px rgba(26,19,17,.16)' }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-bold tracking-wider text-ink-200 uppercase">
                  Quick checkout profile
                </div>
                <div className="mt-1 text-[14px] font-bold text-ink">
                  {profileComplete ? 'Saved for faster checkout' : 'Add info once, checkout faster'}
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                profileComplete ? 'bg-green-50 text-green-700' : 'bg-ink-50 text-ink-200'
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

          {/* Saved Addresses */}
          {user && (
            <button
              onClick={() => setShowAddressModal(true)}
              className="mt-3 flex w-full items-center justify-between rounded-2xl bg-white p-4 text-left transition active:scale-[.98]"
              style={{ boxShadow: '0 1px 2px rgba(26,19,17,.02), 0 8px 24px -16px rgba(26,19,17,.16)' }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-coral/10 text-coral">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[13px] font-bold text-ink">Saved Addresses</div>
                  <div className="text-[11px] text-ink/50">
                    {addresses.length === 0 ? 'No saved addresses' : `${addresses.length} address${addresses.length > 1 ? 'es' : ''} saved`}
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-ink/30" />
            </button>
          )}

          {/* Special Dates */}
          {user && (
            <button
              onClick={() => setShowDatesModal(true)}
              className="mt-3 flex w-full items-center justify-between rounded-2xl bg-white p-4 text-left transition active:scale-[.98]"
              style={{ boxShadow: '0 1px 2px rgba(26,19,17,.02), 0 8px 24px -16px rgba(26,19,17,.16)' }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-coral/10 text-coral text-lg">🎂</div>
                <div>
                  <div className="text-[13px] font-bold text-ink">Special Dates</div>
                  <div className="text-[11px] text-ink/50">
                    {specialDates.length === 0 ? 'Birthdays, anniversaries' : `${specialDates.length} date${specialDates.length > 1 ? 's' : ''} saved`}
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-ink/30" />
            </button>
          )}
        </div>

        {wishlistItems.length > 0 && (
          <div className="mt-5 anim-up delay-2">
            <div className="flex items-center justify-between px-5">
              <h3 className="font-display text-[15px] font-bold tracking-tight text-ink">
                Wishlist
              </h3>
              <button
                onClick={() => go({ name: 'wishlist' })}
                className="text-[12px] font-bold text-ink underline-offset-4 hover:underline"
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
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-50 text-ink-200">
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
          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-ink-100 bg-white px-3.5 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-white">
              <Sparkles className="h-4 w-4" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-bold text-ink">Invite friends, earn ৳200</div>
              <div className="text-[11px] text-ink-200">Share your referral link</div>
            </div>
            <button className="rounded-full bg-ink px-3 py-1.5 text-[11px] font-bold text-white active:scale-95">
              Invite
            </button>
          </div>
        </div>

        <div className="mt-4 px-5 anim-up delay-4">
          <button
            onClick={signOut}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-ink-50 bg-white py-3.5 text-[13px] font-bold text-ink transition active:scale-[.98]"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>

        {/* Admin Dashboard — only visible to admin users */}
        {isAdmin && user && (
          <div className="px-4 pb-6 anim-up">
            <div className="flex items-center gap-2 mb-3 mt-4">
              <Settings className="h-5 w-5 text-ink" strokeWidth={2} />
              <h2 className="font-display text-[17px] font-bold text-ink">Admin Dashboard</h2>
              <span className="ml-auto rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">Admin</span>
            </div>
            <AdminErrorBoundary>
              <AdminPanel embedded />
            </AdminErrorBoundary>
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

      {/* Address Manager Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-[80] flex flex-col bg-black/40 backdrop-blur-sm" onClick={() => !editingAddress && setShowAddressModal(false)}>
          <div className="mt-auto w-full rounded-t-3xl glass-strong p-5 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-[17px] font-bold text-ink">Saved Addresses</h2>
              <button onClick={() => setShowAddressModal(false)} className="h-8 w-8 rounded-full bg-ink/5 flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>

            {!editingAddress ? (
              <>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {addresses.length === 0 && (
                    <div className="py-6 text-center text-[13px] text-ink/40">No saved addresses yet</div>
                  )}
                  {addresses.map((addr) => (
                    <div key={addr.id} className="flex items-center gap-3 rounded-2xl bg-white p-3"
                      style={{ boxShadow: '0 1px 4px rgba(26,19,17,.06)' }}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-bold text-ink">{addr.name}</span>
                          {addr.isDefault && <span className="rounded-full bg-coral px-2 py-0.5 text-[9px] font-bold text-white">Default</span>}
                        </div>
                        <div className="text-[11px] text-ink/50 mt-0.5">{addr.address}, {addr.district}</div>
                        <div className="text-[11px] text-ink/40">{addr.phone}</div>
                      </div>
                      <div className="flex gap-1">
                        {!addr.isDefault && (
                          <button onClick={() => setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === addr.id })))}
                            className="rounded-lg bg-ink/5 px-2 py-1 text-[10px] font-bold text-ink/60">Set default</button>
                        )}
                        <button onClick={() => { setAddrForm({ name: addr.name, address: addr.address, district: addr.district, phone: addr.phone }); setEditingAddress(addr); }}
                          className="rounded-lg bg-coral/10 px-2 py-1 text-[10px] font-bold text-coral">Edit</button>
                        <button onClick={() => setAddresses(prev => prev.filter(a => a.id !== addr.id))}
                          className="rounded-lg bg-red-50 px-2 py-1 text-[10px] font-bold text-red-400">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
                {addresses.length < 5 && (
                  <button
                    onClick={() => { setAddrForm({ name: '', address: '', district: '', phone: '' }); setEditingAddress({ id: `addr-${Date.now()}`, name: '', address: '', district: '', phone: '', isDefault: addresses.length === 0 }); }}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-coral py-3 text-[13px] font-bold text-white"
                  >
                    + Add New Address
                  </button>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <h3 className="text-[14px] font-bold text-ink">{addresses.find(a => a.id === editingAddress.id) ? 'Edit Address' : 'New Address'}</h3>
                {[
                  { key: 'name', label: 'Label (e.g. Home, Office)', placeholder: 'Home' },
                  { key: 'address', label: 'Full Address', placeholder: 'House 5, Road 3, Comilla' },
                  { key: 'district', label: 'District', placeholder: 'Comilla' },
                  { key: 'phone', label: 'Phone', placeholder: '01700000000' },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="text-[10px] font-bold text-ink/50 uppercase">{f.label}</label>
                    <input
                      value={addrForm[f.key as keyof typeof addrForm]}
                      onChange={(e) => setAddrForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="mt-1 w-full rounded-xl border border-ink/10 bg-cream px-3 py-2.5 text-[13px] text-ink focus:border-coral focus:outline-none"
                    />
                  </div>
                ))}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!addrForm.name || !addrForm.address) return;
                      const updated = { ...editingAddress, ...addrForm };
                      setAddresses(prev => {
                        const exists = prev.find(a => a.id === updated.id);
                        return exists ? prev.map(a => a.id === updated.id ? updated : a) : [...prev, updated];
                      });
                      setEditingAddress(null);
                    }}
                    className="flex-1 rounded-xl bg-coral py-2.5 text-[13px] font-bold text-white"
                  >Save</button>
                  <button onClick={() => setEditingAddress(null)}
                    className="flex-1 rounded-xl bg-ink/5 py-2.5 text-[13px] font-bold text-ink/60">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Special Dates Modal */}
      {showDatesModal && (
        <div className="fixed inset-0 z-[80] flex flex-col bg-black/40 backdrop-blur-sm" onClick={() => setShowDatesModal(false)}>
          <div className="mt-auto w-full rounded-t-3xl glass-strong p-5 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-[17px] font-bold text-ink">Special Dates</h2>
              <button onClick={() => setShowDatesModal(false)} className="h-8 w-8 rounded-full bg-ink/5 flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-3 text-[11px] text-ink/50">We'll remind you 7 days before to order a cake 🎂</p>
            <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
              {specialDates.map((d) => (
                <div key={d.id} className="flex items-center gap-3 rounded-2xl bg-white p-3" style={{ boxShadow: '0 1px 4px rgba(26,19,17,.06)' }}>
                  <span className="text-xl">{d.type === 'birthday' ? '🎂' : d.type === 'anniversary' ? '💍' : '🎉'}</span>
                  <div className="flex-1">
                    <div className="text-[12px] font-bold text-ink">{d.name}</div>
                    <div className="text-[11px] text-ink/50">{d.type} · {d.date}</div>
                  </div>
                  <button onClick={() => setSpecialDates(prev => prev.filter(x => x.id !== d.id))}
                    className="text-[11px] text-red-400 font-bold">Remove</button>
                </div>
              ))}
              {specialDates.length === 0 && <div className="py-4 text-center text-[12px] text-ink/40">No dates saved yet</div>}
            </div>
            {specialDates.length < 5 && (
              <div className="space-y-2 border-t border-ink/8 pt-3">
                <div className="flex gap-2">
                  <select value={dateForm.type} onChange={(e) => setDateForm(f => ({ ...f, type: e.target.value as SpecialDate['type'] }))}
                    className="rounded-xl border border-ink/10 bg-cream px-2 py-2 text-[12px] text-ink">
                    <option value="birthday">🎂 Birthday</option>
                    <option value="anniversary">💍 Anniversary</option>
                    <option value="other">🎉 Other</option>
                  </select>
                  <input value={dateForm.name} onChange={(e) => setDateForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Mom's Birthday"
                    className="flex-1 rounded-xl border border-ink/10 bg-cream px-3 py-2 text-[12px] text-ink focus:border-coral focus:outline-none" />
                </div>
                <div className="flex gap-2">
                  <input type="date" value={dateForm.date ? `2000-${dateForm.date}` : ''}
                    onChange={(e) => {
                      const parts = e.target.value.split('-');
                      if (parts.length >= 3) setDateForm(f => ({ ...f, date: `${parts[1]}-${parts[2]}` }));
                    }}
                    className="flex-1 rounded-xl border border-ink/10 bg-cream px-3 py-2 text-[12px] text-ink focus:border-coral focus:outline-none" />
                  <button
                    onClick={() => {
                      if (!dateForm.name || !dateForm.date) return;
                      setSpecialDates(prev => [...prev, { id: `sd-${Date.now()}`, ...dateForm }]);
                      setDateForm({ type: 'birthday', name: '', date: '' });
                    }}
                    className="rounded-xl bg-coral px-4 py-2 text-[12px] font-bold text-white"
                  >Add</button>
                </div>
              </div>
            )}
          </div>
        </div>
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
