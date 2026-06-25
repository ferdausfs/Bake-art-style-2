import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Order } from '../types';
import { supabase } from './supabase';
import { isSupabaseConfigured } from './utils';




export const pushBrowserRouteState = () => {
  try {
    if (typeof window !== 'undefined') {
      window.history.pushState({ bakeArtRoute: true, t: Date.now() }, '');
    }
  } catch {
    // ignore history errors
  }
};

const readRemoteSetting = async <T,>(key: string): Promise<T | null> => {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error) throw error;
    return (data?.value as T) ?? null;
  } catch (e) {
    console.warn(`Remote setting read failed: ${key}`, e);
    return null;
  }
};

const writeRemoteSetting = async (key: string, value: unknown): Promise<void> => {
  if (!isSupabaseConfigured()) return;
  try {
    const { error } = await supabase
      .from('app_settings')
      .upsert(
        { key, value, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

    if (error) throw error;
  } catch (e) {
    console.warn(`Remote setting write failed: ${key}`, e);
  }
};

// ===== App view routing =====
export type Tab = 'home' | 'categories' | 'orders' | 'profile';

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
};

export type View =
  | { name: 'splash' }
  | { name: 'tabs'; tab: Tab }
  | { name: 'product'; productId: string }
  | { name: 'customize'; productId?: string }
  | { name: 'cart' }
  | { name: 'checkout' }
  | { name: 'success'; orderId: string }
  | { name: 'wishlist' }
  | { name: 'tracking'; orderId?: string }
  | { name: 'admin'; tab?: string };

type UIState = {
  view: View;
  tab: Tab;
  setView: (v: View) => void;
  setTab: (t: Tab) => void;
  back: () => void;
  history: View[];
  go: (v: View) => void;
  // Promo
  promoDiscount: number;
  applyPromo: (pct: number) => void;
  clearPromo: () => void;
  // Loyalty (pending redemption applied at checkout)
  pendingLoyaltyRedeem: number;
  setPendingLoyaltyRedeem: (pts: number) => void;
  clearLoyalty: () => void;
  clearAllCheckoutDiscounts: () => void;
  // Admin/user notifications
  newOrderCount: number;
  notifications: NotificationItem[];
  addNotification: (title: string, body: string) => void;
  markAllRead: () => void;
  incrementNewOrders: () => void;
  clearNewOrders: () => void;
  // Chat
  chatOpen: boolean;
  setChatOpen: (v: boolean) => void;
};

export const useUI = create<UIState>((set, get) => ({
  view: { name: 'splash' },
  tab: 'home',
  history: [],
  promoDiscount: 0,
  pendingLoyaltyRedeem: 0,
  newOrderCount: 0,
  notifications: [],
  chatOpen: false,
  setView: (v) =>
    set({
      view: v,
      tab: v.name === 'tabs' ? v.tab : get().tab,
      history: v.name === 'splash' ? [] : get().history,
    }),
  setTab: (tab) => {
    const cur = get().view;
    if (!(cur.name === 'tabs' && cur.tab === tab)) pushBrowserRouteState();
    set({
      tab,
      view: { name: 'tabs', tab },
      history: cur.name === 'splash' ? [] : [...get().history, cur].slice(-20),
    });
  },
  go: (v) => {
    const cur = get().view;
    pushBrowserRouteState();
    set({
      view: v,
      tab: v.name === 'tabs' ? v.tab : get().tab,
      history: [...get().history, cur].slice(-12),
    });
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
  },
  back: () => {
    const h = [...get().history];
    const prev = h.pop();
    set({
      view: prev ?? { name: 'tabs', tab: get().tab },
      tab: prev?.name === 'tabs' ? prev.tab : get().tab,
      history: h,
    });
    requestAnimationFrame(() => window.scrollTo({ top: 0 }));
  },
  applyPromo: (pct) => set((s) => ({ promoDiscount: pct, pendingLoyaltyRedeem: 0 })),
  clearPromo: () => set({ promoDiscount: 0 }),
  setPendingLoyaltyRedeem: (pts) => set((s) => ({ pendingLoyaltyRedeem: Math.max(0, pts), promoDiscount: 0 })),
  clearLoyalty: () => set({ pendingLoyaltyRedeem: 0 }),
  clearAllCheckoutDiscounts: () => set({ promoDiscount: 0, pendingLoyaltyRedeem: 0 }),
  addNotification: (title, body) => set((s) => ({
    notifications: [
      { id: `nt-${Date.now()}`, title, body, createdAt: Date.now(), read: false },
      ...s.notifications,
    ].slice(0, 30),
  })),
  markAllRead: () => set((s) => ({
    notifications: s.notifications.map((n) => ({ ...n, read: true })),
    newOrderCount: 0,
  })),
  incrementNewOrders: () => set((s) => ({
    newOrderCount: s.newOrderCount + 1,
    notifications: [
      { id: `nt-${Date.now()}`, title: '🎂 New order', body: 'A new cake order has been placed.', createdAt: Date.now(), read: false },
      ...s.notifications,
    ].slice(0, 30),
  })),
  clearNewOrders: () => set({ newOrderCount: 0 }),
  setChatOpen: (v) => set({ chatOpen: v }),
}));

// ===== Cart =====
type CartState = {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (idx: number) => void;
  setQty: (idx: number, qty: number) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item) =>
        set((s) => {
          const dup = s.items.findIndex(
            (i) =>
              i.productId === item.productId &&
              i.size === item.size &&
              i.flavor === item.flavor &&
              (i.topping ?? '') === (item.topping ?? '') &&
              (i.message ?? '') === (item.message ?? '')
          );
          if (dup >= 0) {
            const next = [...s.items];
            next[dup] = { ...next[dup], quantity: next[dup].quantity + item.quantity };
            return { items: next };
          }
          return { items: [...s.items, item] };
        }),
      remove: (idx) => set((s) => ({ items: s.items.filter((_, i) => i !== idx) })),
      setQty: (idx, qty) =>
        set((s) => ({
          items: s.items
            .map((it, i) => (i === idx ? { ...it, quantity: Math.max(0, qty) } : it))
            .filter((it) => it.quantity > 0),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: 'bakeart-cart' }
  )
);

// ===== Orders =====
type OrderState = {
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  placeOrder: (order: Omit<Order, 'id' | 'createdAt' | 'status'>) => Order;
  setOrderStatus: (id: string, status: Order['status']) => void;
};

export const useOrders = create<OrderState>()(
  persist(
    (set) => ({
      orders: [],

      setOrders: (orders) => set((s) => ({ orders: Array.isArray(orders) ? orders : s.orders })),

      placeOrder: (data) => {
        const user = useAuthStore.getState().user;
        const isUuid =
          !!user?.id &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);

        const ui = useUI.getState();
        const pendingRedeem = ui.pendingLoyaltyRedeem;

        const o: Order = {
          ...data,
          id: 'BAS' + Date.now().toString().slice(-6),
          userId: isUuid ? user!.id : undefined,
          createdAt: Date.now(),
          status: 'placed',
          loyaltyPointsRedeemed: pendingRedeem > 0 ? pendingRedeem : undefined,
        };

        // ensure discount field is populated
        if (o.discount === undefined) {
          o.discount = Math.max(0, Math.round(o.subtotal + o.deliveryFee - o.total));
        }

        set((s) => ({ orders: [o, ...s.orders] }));
        useUI.getState().addNotification('✅ Order placed', `Order #${o.id} has been placed successfully.`);
        useWallet.getState().earnFromOrder(o.id, o.total);

        // If user redeemed wallet balance in cart, deduct them now (track per order)
        if (pendingRedeem > 0) {
          useWallet.getState().redeemBalance(pendingRedeem, o.id);
        }
        // clear both promo + loyalty after order
        useUI.getState().clearAllCheckoutDiscounts();

        if (isSupabaseConfigured()) {
          void supabase.from('orders').insert({
            id: o.id,
            user_id: isUuid ? user!.id : null,
            customer_name: o.customer.name,
            customer_phone: o.customer.phone,
            customer_address: o.customer.address,
            district: o.customer.city,
            delivery_date: o.delivery.date,
            delivery_time: o.delivery.time,
            payment_method: o.payment,
            items: o.items,
            subtotal: o.subtotal,
            discount: Math.max(0, Math.round(o.subtotal + o.deliveryFee - o.total)),
            delivery_fee: o.deliveryFee,
            total: o.total,
            status: o.status,
            created_at: new Date(o.createdAt).toISOString(),
          }).then(({ error }) => {
            if (error) console.warn('Remote order insert failed:', error.message);
          });
        }

        return o;
      },

      setOrderStatus: (id, status) => {
        set((s) => ({
          orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)),
        }));

        useUI.getState().addNotification('📦 Order updated', `Order #${id} status changed to ${status}.`);

        if (status === 'confirmed') {
          useWallet.getState().confirmOrderEarn(id);
        }
        if (status === 'cancelled') {
          useWallet.getState().cancelOrderEarn(id);
          // find how much was redeemed from order record
          const order = useOrders.getState().orders.find(o => o.id === id);
          const redeemed = order?.loyaltyPointsRedeemed ?? 0;
          if (redeemed > 0) {
            useWallet.getState().refundRedeem(id, redeemed);
            useUI.getState().addNotification('Wallet refund', `৳${redeemed} refunded to your wallet for cancelled order #${id}.`);
          }
        }

        if (isSupabaseConfigured()) {
          void supabase
            .from('orders')
            .update({ status })
            .eq('id', id)
            .then(({ error }) => {
              if (error) console.warn('Remote order status update failed:', error.message);
            });
        }
      },
    }),
    { name: 'bakeart-orders' }
  )
);

// ===== Wishlist =====
type UserState = {
  wishlist: string[];
  toggleWish: (id: string) => void;
};

export const useUser = create<UserState>()(
  persist(
    (set) => ({
      wishlist: [],
      toggleWish: (id) =>
        set((s) => ({
          wishlist: s.wishlist.includes(id)
            ? s.wishlist.filter((x) => x !== id)
            : [...s.wishlist, id],
        })),
    }),
    { name: 'bakeart-user' }
  )
);

export const formatBDT = (n: number) => `৳${n.toLocaleString('en-BD')}`;
// Backward-compatible alias: existing components still import formatINR.
export const formatINR = formatBDT;

// Selectors / helpers
export const cartSubtotal = (items: CartItem[]) =>
  items.reduce((s, i) => s + i.price * i.quantity, 0);

export const freeDeliveryThreshold = 999;
export const standardDeliveryFee = 60;
export const qualifiesForFreeDelivery = (sub: number) => sub >= freeDeliveryThreshold;


// ── Auth Store ─────────────────────────────────────────────
import type { User, SiteSettings } from '../types';
import { DEFAULT_SETTINGS } from './data';

type AuthState = {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (user) => set({ user }),
      logout: () => {
        set({ user: null });
        useLocation.getState().clearLocation();
      },
    }),
    { name: 'bakeart-auth' }
  )
);

const ADMIN_ONLY_KEYS = ['adminPin', 'adminEmail', 'geminiApiKey'] as const;

// ── Settings Store ─────────────────────────────────────────
type SettingsState = {
  settings: SiteSettings;
  loadRemoteSettings: () => Promise<void>;
  updateSettings: (patch: Partial<SiteSettings>) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      loadRemoteSettings: async () => {
        const remoteSite = await readRemoteSetting<Partial<SiteSettings>>('site_settings');
        const remoteAdmin = await readRemoteSetting<Partial<SiteSettings>>('admin_settings');
        if (remoteSite || remoteAdmin) {
          set({
            settings: {
              ...DEFAULT_SETTINGS,
              ...get().settings,
              ...(remoteSite || {}),
              ...(remoteAdmin || {}),
            },
          });
        }
      },
      updateSettings: (patch) =>
        set((s) => {
          const next = { ...s.settings, ...patch };

          const nonSensitivePart: Partial<SiteSettings> = {};
          const sensitivePart: Partial<SiteSettings> = {};

          (Object.keys(next) as Array<keyof SiteSettings>).forEach((k) => {
            if ((ADMIN_ONLY_KEYS as readonly string[]).includes(k)) {
              (sensitivePart as any)[k] = next[k];
            } else {
              (nonSensitivePart as any)[k] = next[k];
            }
          });

          const patchHasSensitiveKeys = Object.keys(patch).some((k) => 
            (ADMIN_ONLY_KEYS as readonly string[]).includes(k)
          );

          void writeRemoteSetting('site_settings', nonSensitivePart);
          if (patchHasSensitiveKeys) {
            void writeRemoteSetting('admin_settings', sensitivePart);
          }

          return { settings: next };
        }),
    }),
    {
      name: 'bakeart-settings',
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as any),
        settings: {
          ...DEFAULT_SETTINGS,
          ...(current as any)?.settings,
          ...(persisted as any)?.settings,
        },
      }),
    }
  )
);

// ── Location Store ─────────────────────────────────────────
type LocationState = {
  district: string | null;
  lat: number | null;
  lng: number | null;
  verified: boolean;
  setLocation: (district: string, lat: number, lng: number) => void;
  clearLocation: () => void;
};

export const useLocation = create<LocationState>()(
  persist(
    (set) => ({
      district: null, lat: null, lng: null, verified: false,
      setLocation: (district, lat, lng) => set({ district, lat, lng, verified: true }),
      clearLocation: () => set({ district: null, lat: null, lng: null, verified: false }),
    }),
    { name: 'bakeart-location' }
  )
);

// ── UI extras (promo, new orders) ─────────────────────────
// Already in useUI above — adding methods via zustand's subscribe pattern
// These are available via useUI():
//   promoDiscount, applyPromo, clearPromo
//   newOrderCount, incrementNewOrders, clearNewOrders
//   chatOpen, setChatOpen

// ─── Wallet (Loyalty + Referral) ─────────────────────────────────────────────

// Business rules — single source of truth
export const WALLET_EARN_PER_TAKA = 20 / 1000;   // ৳20 per ৳1000 spent
export const WALLET_REFERRAL_BONUS = 100;          // ৳100 for both referrer and new buyer
export const WALLET_MAX_REDEEM = 200;              // ৳200 max discount per order
export const WALLET_MIN_ORDER_TO_REDEEM = 500;     // minimum order subtotal to use wallet

// Derive referral code from user profile
export const getReferralCode = (user: { email?: string; id?: string } | null): string | null => {
  if (!user?.email || !user?.id) return null;
  const emailPart = user.email.replace('@', '').replace('.', '').slice(0, 4).toUpperCase();
  const idPart = user.id.replace(/-/g, '').slice(-4).toUpperCase();
  return emailPart + idPart;
};

// How much wallet balance an order earns (pending until confirmed)
export const calcOrderWalletEarn = (orderTotal: number): number =>
  Math.floor((orderTotal / 1000) * 20);

export type WalletTxType = 'order_earn' | 'referral_earn' | 'redeem' | 'refund' | 'referral_bonus';

export type WalletTx = {
  id: string;
  type: WalletTxType;
  amount: number;          // positive = credit, negative = debit (in ৳)
  orderId?: string;
  refCode?: string;        // referral code used (for referral txns)
  date: number;
  note: string;            // human-readable label shown in history
  pending?: boolean;       // true = waiting for order confirmation
};

type WalletState = {
  balance: number;                                    // ৳ balance (confirmed only)
  totalEarned: number;                                // lifetime ৳ earned
  txns: WalletTx[];                                   // full transaction history
  pendingEarn: { orderId: string; amount: number }[]; // unconfirmed order earnings

  // Actions
  earnFromOrder: (orderId: string, orderTotal: number) => void;      // add pending earn
  confirmOrderEarn: (orderId: string) => void;                       // pending → balance
  cancelOrderEarn: (orderId: string) => void;                        // discard pending
  refundRedeem: (orderId: string, amount: number) => void;           // refund a redemption
  earnReferral: (refCode: string, role: 'referrer' | 'buyer') => void; // ৳100 bonus
  redeemBalance: (amount: number, orderId: string) => void;          // spend balance
};

export const useWallet = create<WalletState>()(
  persist(
    (set, get) => ({
      balance: 0,
      totalEarned: 0,
      txns: [],
      pendingEarn: [],

      earnFromOrder: (orderId, orderTotal) => {
        const amount = calcOrderWalletEarn(orderTotal);
        if (amount <= 0) return;
        // prevent duplicate pending
        if (get().pendingEarn.find(p => p.orderId === orderId)) return;
        set(s => ({
          pendingEarn: [...s.pendingEarn, { orderId, amount }],
          txns: [{
            id: `wtx-${Date.now()}`,
            type: 'order_earn',
            amount,
            orderId,
            date: Date.now(),
            note: `Order #${orderId} reward (pending)`,
            pending: true,
          }, ...s.txns],
        }));
      },

      confirmOrderEarn: (orderId) => {
        const s = get();
        // prevent double-credit
        if (s.txns.find(t => t.orderId === orderId && t.type === 'order_earn' && !t.pending)) return;
        const pending = s.pendingEarn.find(p => p.orderId === orderId);
        const amount = pending?.amount ?? 0;
        if (amount <= 0) return;
        set(cur => ({
          balance: cur.balance + amount,
          totalEarned: cur.totalEarned + amount,
          pendingEarn: cur.pendingEarn.filter(p => p.orderId !== orderId),
          txns: cur.txns.map(t =>
            t.orderId === orderId && t.type === 'order_earn' && t.pending
              ? { ...t, pending: false, note: `Order #${orderId} reward` }
              : t
          ),
        }));
      },

      cancelOrderEarn: (orderId) => {
        set(s => ({
          pendingEarn: s.pendingEarn.filter(p => p.orderId !== orderId),
          txns: s.txns.filter(t => !(t.orderId === orderId && t.type === 'order_earn' && t.pending)),
        }));
      },

      refundRedeem: (orderId, amount) => {
        if (amount <= 0) return;
        set(s => ({
          balance: s.balance + amount,
          txns: [{
            id: `wtx-${Date.now()}`,
            type: 'refund',
            amount,
            orderId,
            date: Date.now(),
            note: `Refund for cancelled order #${orderId}`,
          }, ...s.txns],
        }));
      },

      earnReferral: (refCode, role) => {
        const amount = WALLET_REFERRAL_BONUS;
        const note = role === 'referrer'
          ? `Referral bonus — someone used your code`
          : `Welcome bonus — referral code used`;
        set(s => ({
          balance: s.balance + amount,
          totalEarned: s.totalEarned + amount,
          txns: [{
            id: `wtx-${Date.now()}`,
            type: role === 'referrer' ? 'referral_earn' : 'referral_bonus',
            amount,
            refCode,
            date: Date.now(),
            note,
          }, ...s.txns],
        }));
      },

      redeemBalance: (amount, orderId) => {
        const capped = Math.min(amount, WALLET_MAX_REDEEM);
        if (capped <= 0) return;
        set(s => ({
          balance: Math.max(0, s.balance - capped),
          txns: [{
            id: `wtx-${Date.now()}`,
            type: 'redeem',
            amount: -capped,
            orderId,
            date: Date.now(),
            note: `Redeemed for order #${orderId}`,
          }, ...s.txns],
        }));
      },
    }),
    { name: 'bakeart-wallet' }
  )
);
