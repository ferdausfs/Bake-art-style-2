import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Order } from '../types';
import { supabase } from './supabase';
import { isSupabaseConfigured } from './utils';


const REMOTE_SETTINGS_KEY = 'site_settings';

const pushBrowserRouteState = () => {
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
  applyPromo: (pct) => set({ promoDiscount: pct }),
  clearPromo: () => set({ promoDiscount: 0 }),
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

      setOrders: (orders) => set({ orders }),

      placeOrder: (data) => {
        const o: Order = {
          ...data,
          id: 'BAS' + Date.now().toString().slice(-6),
          createdAt: Date.now(),
          status: 'placed',
        };

        set((s) => ({ orders: [o, ...s.orders] }));
        useUI.getState().addNotification('✅ Order placed', `Order #${o.id} has been placed successfully.`);

        if (isSupabaseConfigured()) {
          const user = useAuthStore.getState().user;
          const isUuid =
            !!user?.id &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);

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
            discount: 0,
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
      logout: () => set({ user: null }),
    }),
    { name: 'bakeart-auth' }
  )
);

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
        const remote = await readRemoteSetting<Partial<SiteSettings>>(REMOTE_SETTINGS_KEY);
        if (remote) {
          set({ settings: { ...DEFAULT_SETTINGS, ...get().settings, ...remote } });
        }
      },
      updateSettings: (patch) =>
        set((s) => {
          const next = { ...s.settings, ...patch };
          void writeRemoteSetting(REMOTE_SETTINGS_KEY, next);
          return { settings: next };
        }),
    }),
    { name: 'bakeart-settings' }
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
