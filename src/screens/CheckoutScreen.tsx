import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, MapPin, Clock, Wallet, Check, Shield, Navigation, Loader2, Phone, Banknote, ShoppingCart, Gift, Users } from 'lucide-react';
import {
  useCart, useOrders, useUI, formatINR,
  cartSubtotal, standardDeliveryFee,
  useLocation,
  useSettingsStore,
  useAuthStore,
  useWallet,
  getReferralCode,
  WALLET_REFERRAL_BONUS,
  pushReferralReward,
} from '../lib/store';
import { supabase } from '../lib/supabase';
import { LocationGate } from '../components/LocationGate';

const PAYMENTS = [
  { id: 'bkash', label: 'bKash', sub: 'Send money / Payment', Icon: Phone },
  { id: 'nagad', label: 'Nagad', sub: 'Send money / Payment', Icon: Phone },
  { id: 'cash',  label: 'Cash on Delivery', sub: 'ডেলিভারির সময় পেমেন্ট', Icon: Banknote },
] as const;

const BD_DISTRICTS = [
  'Comilla', 'Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi',
  'Khulna', 'Mymensingh', 'Barishal', 'Rangpur',
];

const SLOTS = [
  { v: '10am - 12pm', hot: false },
  { v: '12pm - 2pm',  hot: false },
  { v: '4pm - 6pm',   hot: true },
  { v: '6pm - 8pm',   hot: false },
];

interface Props {
  onBack?: () => void;
}

export default function CheckoutScreen({ onBack }: Props) {
  const { items, clear } = useCart();
  const { placeOrder, orders } = useOrders();
  const { back, go, promoDiscount, pendingLoyaltyRedeem } = useUI();
  const { verified: locationVerified, district: detectedDistrict } = useLocation();
  const user = useAuthStore((s) => s.user);

  // Referral
  const { earnReferral } = useWallet();
  const [referralInput, setReferralInput] = useState('');
  const [referralApplied, setReferralApplied] = useState(false);
  const [referralError, setReferralError] = useState('');
  const [referralLoading, setReferralLoading] = useState(false);
  const userReferralCode = getReferralCode(user);

  const applyReferralCode = async () => {
    const code = referralInput.trim().toUpperCase();
    if (!code) return;

    if (code === userReferralCode) {
      setReferralError("নিজের referral code ব্যবহার করা যাবে না");
      return;
    }
    if (!user) {
      setReferralError("Referral bonus পেতে আগে sign in করো");
      return;
    }

    setReferralLoading(true);
    setReferralError('');

    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email');

      if (error) throw error;

      const matched = (profiles ?? []).find(
        (profile: { id: string; email: string }) =>
          getReferralCode({ email: profile.email, id: profile.id }) === code
      );

      if (!matched) {
        setReferralError("এই referral code টি valid নয়");
        return;
      }

      setReferralApplied(true);
      earnReferral(code, 'buyer');
    } catch {
      setReferralError("Referral code যাচাই করা যায়নি, আবার চেষ্টা করো");
    } finally {
      setReferralLoading(false);
    }
  };

  const [showLocationGate, setShowLocationGate] = useState(!locationVerified);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState('');
  const [giftMode, setGiftMode] = useState(false);
  const [gift, setGift] = useState({ message: '', hidePrice: false, wrap: false, recipientName: '', recipientPhone: '' });

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    district: detectedDistrict || 'Comilla',
    date: new Date().toISOString().slice(0, 10),
    time: '4pm - 6pm',
    payment: 'cash' as typeof PAYMENTS[number]['id'],
  });

  // Autofill name, phone and address for logged in users
  useEffect(() => {
    if (user) {
      setForm((prev) => {
        const next = { ...prev };
        if (!next.name && user.name) {
          next.name = user.name;
        }

        const recentOrder = orders.find(
          (o) =>
            o.userId === user.id ||
            (user.email && o.customer?.email?.toLowerCase() === user.email.toLowerCase())
        );

        if (recentOrder) {
          if (!next.phone && recentOrder.customer?.phone) {
            next.phone = recentOrder.customer.phone;
          }
          if (!next.address && recentOrder.customer?.address) {
            next.address = recentOrder.customer.address;
          }
          if (recentOrder.customer?.city) {
            const matchedDistrict = BD_DISTRICTS.find(
              (d) => d.toLowerCase() === recentOrder.customer.city.toLowerCase()
            );
            if (matchedDistrict) {
              next.district = matchedDistrict;
            }
          }
        }
        return next;
      });
    }
  }, [user, orders]);

  const { settings } = useSettingsStore();
  const currentDeliveryFee = settings.deliveryFee !== undefined ? settings.deliveryFee : standardDeliveryFee;
  const currentFreeThreshold = settings.freeDeliveryThreshold !== undefined ? settings.freeDeliveryThreshold : 999;


  const { subtotal, delivery, promoDiscountAmount, walletDiscount, discountAmount, total } = useMemo(() => {
    const sub = cartSubtotal(items);
    const freeDlv = sub >= currentFreeThreshold;
    const dlv = items.length === 0 ? 0 : (freeDlv ? 0 : currentDeliveryFee);
    const promoDisc = promoDiscount > 0 ? (sub * promoDiscount) / 100 : 0;
    const walletDisc = pendingLoyaltyRedeem; // pendingLoyaltyRedeem now stores ৳ directly
    const disc = promoDisc + walletDisc;
    const giftWrapFee = giftMode && gift.wrap ? 50 : 0;
    return { subtotal: sub, delivery: dlv, promoDiscountAmount: promoDisc, walletDiscount: walletDisc, discountAmount: disc, total: Math.max(0, sub + dlv - disc + giftWrapFee) };
  }, [items, currentDeliveryFee, currentFreeThreshold, promoDiscount, pendingLoyaltyRedeem, giftMode, gift.wrap]);

  const handleLocate = async () => {
    setLocating(true);
    setLocateError('');
    try {
      if (!navigator.geolocation) {
        throw new Error('জিপিএস সমর্থিত নয়');
      }
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });
      const { latitude: lat, longitude: lng } = pos.coords;
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      if (!r.ok) {
        throw new Error('সার্ভার থেকে এড্রেস পাওয়া যায়নি');
      }
      const data = await r.json();
      const city =
        data.address?.city ||
        data.address?.town ||
        data.address?.district ||
        data.address?.county ||
        data.address?.state_district ||
        '';
      const addressText = data.display_name || city || '';

      setForm((prev) => {
        const next = { ...prev };
        next.address = addressText;
        const detectedCity = (city || addressText).toLowerCase();
        const matchedDistrict = BD_DISTRICTS.find(
          (d) => detectedCity.includes(d.toLowerCase()) || addressText.toLowerCase().includes(d.toLowerCase())
        );
        if (matchedDistrict) {
          next.district = matchedDistrict;
        }
        return next;
      });
    } catch (e: any) {
      console.warn('Geolocation failed:', e);
      setLocateError('লোকেশন শনাক্ত করা যায়নি, অনুগ্রহ করে ম্যানুয়ালি লিখুন।');
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = () => {
    if (items.length === 0) return;
    if (!form.name || !form.phone || !form.address) return;
    const { settings } = useSettingsStore.getState();
    const o = placeOrder({
      items,
      customer: { name: form.name, phone: form.phone, email: '', address: form.address, city: form.district, pin: '' },
      delivery: { date: form.date, time: form.time },
      payment: form.payment,
      subtotal, deliveryFee: delivery, total,
      discount: discountAmount,
      promoCode: promoDiscount > 0 ? settings.promoCode : undefined,
      loyaltyPointsRedeemed: pendingLoyaltyRedeem > 0 ? pendingLoyaltyRedeem : undefined,
      gift: giftMode ? gift : undefined,
    });
    // Credit the referrer (cross-device) when their code was used on this order
    if (referralApplied && referralInput.trim()) {
      void pushReferralReward(referralInput.trim(), {
        refereeId: user?.id || `guest-${o.id}`,
        refereeName: form.name || 'Customer',
        usedAt: Date.now(),
      });
    }
    clear();
    go({ name: 'success', orderId: o.id });
  };

  const handleBack = onBack ?? back;

  // Location gate before checkout (payment step) — must verify zone first
  if (showLocationGate) {
    return (
      <LocationGate
        onDismiss={() => setShowLocationGate(false)}
      />
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex h-full flex-col bg-cream">
        <Header title="চেকআউট" onBack={handleBack} />
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <div className="flex justify-center text-ink-200 opacity-60">
            <ShoppingCart size={48} strokeWidth={1.5} />
          </div>
          <h2 className="mt-4 font-display text-[20px] font-bold text-ink">কার্ট খালি</h2>
          <p className="mt-1 text-[12px] text-ink-200">আগে একটা কেক যোগ করুন।</p>
          <button onClick={handleBack} className="btn-primary mt-5 h-12 rounded-2xl px-6 text-[13px] font-bold">
            কেক দেখুন
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-cream">
      <Header title="চেকআউট" onBack={handleBack} />

      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-32 pt-1">
        {/* Items */}
        <Section icon={MapPin} title="অর্ডারের আইটেম">
          <div className="space-y-2.5">
            {items.slice(0, 3).map((it, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-cream">
                  <img src={it.image} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="line-clamp-1 text-[13px] font-bold text-ink">{it.name}</div>
                  <div className="text-[10.5px] text-ink-200">{it.size} · ×{it.quantity}</div>
                </div>
                <div className="font-display text-[13px] font-bold tabular text-ink">
                  {formatINR(it.price * it.quantity)}
                </div>
              </div>
            ))}
            {items.length > 3 && (
              <div className="text-center text-[11px] text-ink-200">
                +{items.length - 3} আরও আইটেম
              </div>
            )}
          </div>
        </Section>

        {/* Delivery address */}
        <Section icon={MapPin} title="ডেলিভারি ঠিকানা">
          <div className="space-y-2.5">
            <input
              placeholder="আপনার নাম"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-11 w-full rounded-xl border border-ink-50 bg-white px-3 text-[13px] font-medium text-ink outline-none focus:border-coral focus:ring-2 focus:ring-coral/15"
            />
            <input
              placeholder="মোবাইল নম্বর (01XXXXXXXXX)"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="h-11 w-full rounded-xl border border-ink-50 bg-white px-3 text-[13px] font-medium text-ink outline-none focus:border-coral focus:ring-2 focus:ring-coral/15"
            />

            {/* GPS Button */}
            <div className="flex flex-col gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={handleLocate}
                disabled={locating}
                className="flex items-center justify-center gap-1.5 self-start rounded-full bg-ink-50 px-3.5 py-1.5 text-[11px] font-bold text-ink transition hover:bg-ink-100 active:scale-95 disabled:opacity-50"
              >
                {locating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Navigation className="h-3 w-3" />
                )}
                {locating ? 'লোকেশন খোঁজা হচ্ছে...' : 'বর্তমান অবস্থান ব্যবহার করুন'}
              </button>
              {locateError && (
                <span className="text-[11px] text-red-500 font-semibold px-1">{locateError}</span>
              )}
            </div>

            <textarea
              placeholder="সম্পূর্ণ ঠিকানা (বাসা/রোড/এলাকা)"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={2}
              className="w-full rounded-xl border border-ink-50 bg-white px-3 py-2.5 text-[13px] font-medium text-ink outline-none focus:border-coral focus:ring-2 focus:ring-coral/15 resize-none"
            />
            <select
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
              className="h-11 w-full rounded-xl border border-ink-50 bg-white px-3 text-[13px] font-medium text-ink outline-none focus:border-coral focus:ring-2 focus:ring-coral/15"
            >
              {BD_DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </Section>

        {/* Date & time */}
        <Section icon={Clock} title="ডেলিভারি সময়">
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="h-11 w-full rounded-xl border border-ink-50 bg-white px-3 text-[13px] font-medium text-ink outline-none transition focus:border-coral focus:ring-2 focus:ring-coral/15"
          />
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            {SLOTS.map((s) => (
              <button
                key={s.v}
                onClick={() => setForm({ ...form, time: s.v })}
                className={`relative h-11 rounded-xl border-2 text-[12px] font-semibold transition active:scale-95 ${
                  form.time === s.v
                    ? 'border-coral bg-coral text-white shadow-[0_6px_16px_-8px_rgba(242,94,115,.5)]'
                    : 'border-ink-50 bg-white text-ink'
                }`}
              >
                {s.v}
                {s.hot && form.time !== s.v && (
                  <span className="absolute -top-1.5 -right-1.5 rounded-full bg-ink px-1.5 py-0.5 text-[8px] font-bold uppercase text-white">
                    Popular
                  </span>
                )}
              </button>
            ))}
          </div>
        </Section>

        {/* Gift Mode */}
        <section className="space-y-3">
          <div
            className="flex items-center justify-between rounded-2xl bg-white px-4 py-3.5 cursor-pointer"
            style={{ boxShadow: '0 1px 2px rgba(26,19,17,.02), 0 4px 12px -8px rgba(26,19,17,.12)' }}
            onClick={() => setGiftMode(!giftMode)}
          >
            <div className="flex items-center gap-3">
              <Gift className="h-6 w-6 text-ink" strokeWidth={1.75} />
              <div>
                <div className="text-[13px] font-bold text-ink">This is a gift order</div>
                <div className="text-[11px] text-ink/50">Add message, gift wrap & recipient details</div>
              </div>
            </div>
            <div className={`h-6 w-11 rounded-full transition-colors ${giftMode ? 'bg-coral' : 'bg-ink/15'} relative flex-shrink-0`}>
              <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${giftMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </div>

          {giftMode && (
            <div className="space-y-3 rounded-2xl bg-white px-4 py-4"
              style={{ boxShadow: '0 1px 2px rgba(26,19,17,.02), 0 4px 12px -8px rgba(26,19,17,.12)' }}>
              <textarea
                maxLength={200}
                placeholder="Write a heartfelt message..."
                className="w-full resize-none rounded-xl border border-ink/10 bg-cream px-3 py-2.5 text-[13px] text-ink placeholder:text-ink/30 focus:border-coral focus:outline-none"
                rows={3}
                value={gift.message}
                onChange={(e) => setGift(g => ({ ...g, message: e.target.value }))}
              />
              <div className="text-right text-[10px] text-ink/30">{gift.message.length}/200</div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={gift.wrap} onChange={(e) => setGift(g => ({ ...g, wrap: e.target.checked }))}
                  className="h-4 w-4 rounded accent-coral" />
                <span className="text-[13px] text-ink">Gift wrap <span className="text-coral font-bold">+৳50</span></span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={gift.hidePrice} onChange={(e) => setGift(g => ({ ...g, hidePrice: e.target.checked }))}
                  className="h-4 w-4 rounded accent-coral" />
                <span className="text-[13px] text-ink">Hide price from recipient</span>
              </label>
              <input placeholder="Recipient name (optional)"
                className="w-full rounded-xl border border-ink/10 bg-cream px-3 py-2.5 text-[13px] text-ink placeholder:text-ink/30 focus:border-coral focus:outline-none"
                value={gift.recipientName}
                onChange={(e) => setGift(g => ({ ...g, recipientName: e.target.value }))} />
              <input placeholder="Recipient phone (optional)"
                className="w-full rounded-xl border border-ink/10 bg-cream px-3 py-2.5 text-[13px] text-ink placeholder:text-ink/30 focus:border-coral focus:outline-none"
                value={gift.recipientPhone}
                onChange={(e) => setGift(g => ({ ...g, recipientPhone: e.target.value }))} />
            </div>
          )}
        </section>

        {/* Payment */}
        <Section icon={Wallet} title="পেমেন্ট পদ্ধতি">
          <div className="space-y-2">
            {PAYMENTS.map((p) => (
              <button
                key={p.id}
                onClick={() => setForm({ ...form, payment: p.id })}
                className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition active:scale-[.99] ${
                  form.payment === p.id
                    ? 'border-coral bg-coral-50/50'
                    : 'border-ink-50 bg-white'
                }`}
              >
                <div className="flex h-10 w-12 items-center justify-center rounded-lg bg-ink text-white">
                  <p.Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-bold text-ink">{p.label}</div>
                  <div className="text-[10.5px] text-ink-200">{p.sub}</div>
                </div>
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full transition ${
                    form.payment === p.id ? 'bg-coral text-white' : 'border border-ink-50 bg-white'
                  }`}
                >
                  {form.payment === p.id && <Check className="h-3 w-3" strokeWidth={3} />}
                </div>
              </button>
            ))}
          </div>

          {/* Referral Code */}
          <div className="mt-4 pt-4 border-t border-ink/5">
            <div className="flex items-center gap-2 mb-2.5">
              <Users className="h-4 w-4 text-ink-200" />
              <span className="text-[12px] font-bold text-ink">রেফারেল কোড</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                value={referralInput}
                onChange={(e) => { setReferralInput(e.target.value); setReferralError(''); }}
                placeholder="কারো রেফারেল কোড আছে?"
                disabled={referralApplied}
                className="flex-1 h-10 rounded-xl border border-ink-50 bg-white px-3 text-[13px] font-medium text-ink outline-none focus:border-coral focus:ring-2 focus:ring-coral/15 disabled:opacity-50"
              />
              <button
                onClick={applyReferralCode}
                disabled={referralApplied || !referralInput || referralLoading}
                className="rounded-xl bg-coral px-3.5 py-2 text-[11px] font-bold text-white active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {referralLoading ? 'Checking...' : 'Apply'}
              </button>
            </div>
            {referralApplied && (
              <div className="mt-2 text-[11px] text-emerald-600 font-semibold">
                Referral code applied! ৳{WALLET_REFERRAL_BONUS} added to your wallet
              </div>
            )}
            {referralError && (
              <div className="mt-2 text-[11px] text-red-500 font-semibold">{referralError}</div>
            )}
            {userReferralCode && (
              <div className="mt-2 text-[10px] text-ink/40">
                Your code: <span className="font-mono font-bold">{userReferralCode}</span> — share it to earn ৳{WALLET_REFERRAL_BONUS} per referral
              </div>
            )}
          </div>
        </Section>

        {/* Bill */}
        <Section title="বিল বিবরণ" className="!p-0">
          <div className="space-y-2 px-4 py-4 text-[13px]">
            <Row label={`সাবটোটাল (${items.length} আইটেম)`} value={formatINR(subtotal)} />
            <Row
              label="ডেলিভারি চার্জ"
              value={delivery === 0 ? 'ফ্রি' : formatINR(delivery)}
              positive={delivery === 0}
            />
            {promoDiscountAmount > 0 && (
              <Row
                label="প্রোমো ডিসকাউন্ট"
                value={'-' + formatINR(Math.round(promoDiscountAmount))}
                positive
              />
            )}
            {walletDiscount > 0 && (
              <Row
                label="Wallet discount"
                value={'-৳' + walletDiscount}
                positive
              />
            )}
            {giftMode && gift.wrap && <Row label="Gift wrap" value={formatINR(50)} />}
            <div className="h-px bg-ink-50" />
            <div className="flex items-center justify-between pt-1">
              <span className="font-display text-[15px] font-bold tracking-tight text-ink">মোট</span>
              <span className="font-display text-[20px] font-bold tabular text-ink">{formatINR(total)}</span>
            </div>
          </div>
        </Section>

        <div className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-cream py-3 text-[11px] text-ink-200">
          <Shield className="h-3.5 w-3.5" />
          নিরাপদ ও বিশ্বস্ত অর্ডার প্রসেসিং
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="absolute right-0 bottom-0 left-0 z-30 border-t border-ink-50/80 bg-white/95 px-5 pt-3 pb-6 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div>
            <div className="text-[10px] font-bold tracking-wider text-ink-200 uppercase">পেমেন্ট</div>
            <div className="font-display text-[20px] font-bold tabular text-ink">{formatINR(total)}</div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!form.name || !form.phone || !form.address}
            className="btn-primary ml-auto flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl text-[14px] font-bold tracking-tight disabled:opacity-50"
          >
            অর্ডার করুন
            <Check className="h-[18px] w-[18px]" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="flex flex-shrink-0 items-center justify-between px-5 pt-3 pb-3">
      <button
        onClick={onBack}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink transition active:scale-90"
        style={{ boxShadow: '0 1px 2px rgba(26,19,17,.03), 0 6px 16px -10px rgba(26,19,17,.2)' }}
      >
        <ArrowLeft className="h-[20px] w-[20px]" strokeWidth={2} />
      </button>
      <h1 className="font-display text-[16px] font-bold tracking-tight text-ink">{title}</h1>
      <div className="w-10" />
    </header>
  );
}

function Section({
  icon: Icon, title, badge, children, className = '',
}: {
  icon?: any;
  title: string;
  badge?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`mt-3 overflow-hidden rounded-2xl bg-white ${className}`}
      style={{ boxShadow: '0 1px 2px rgba(26,19,17,.02), 0 8px 24px -16px rgba(26,19,17,.16)' }}
    >
      <div className="flex items-center gap-2.5 border-b border-ink-50 px-4 py-3">
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-50 text-ink-200">
            <Icon className="h-4 w-4" strokeWidth={2} />
          </div>
        )}
        <h3 className="font-display text-[14px] font-bold tracking-tight text-ink">{title}</h3>
        {badge && (
          <span className="ml-auto rounded-full bg-ink-50 px-2 py-0.5 text-[10px] font-bold text-ink-200">
            {badge}
          </span>
        )}
      </div>
      <div className="px-4 py-3">{children}</div>
    </section>
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
