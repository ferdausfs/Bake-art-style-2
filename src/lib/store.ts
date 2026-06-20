import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Order } from '../types';

// ===== App view routing =====
export type Tab = 'home' | 'categories' | 'orders' | 'profile';

export type View =
  | { name: 'splash' }
  | { name: 'tabs'; tab: Tab }
  | { name: 'product'; productId: string }
  | { name: 'customize'; productId?: string }
  | { name: 'cart' }
  | { name: 'checkout' }
  | { name: 'success'; orderId: string }
  | { name: 'wishlist' }
  | { name: 'tracking'; orderId?: string };

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
  // Admin notifications
  newOrderCount: number;
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
  chatOpen: false,
  setView: (v) =>
    set({
      view: v,
      tab: v.name === 'tabs' ? v.tab : get().tab,
      history: v.name === 'splash' ? [] : get().history,
    }),
  setTab: (tab) => set({ tab, view: { name: 'tabs', tab }, history: [] }),
  go: (v) => {
    const cur = get().view;
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
  incrementNewOrders: () => set((s) => ({ newOrderCount: s.newOrderCount + 1 })),
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
    { name: 'bakeart-cart', version: 2 }
  )
);

// ===== Orders =====
type OrderState = {
  orders: Order[];
  placeOrder: (order: Omit<Order, 'id' | 'createdAt' | 'status'>) => Order;
  setOrders: (orders: Order[]) => void;
  upsertOrder: (order: Order) => void;
  updateOrderStatus: (id: string, status: Order['status']) => void;
};

export const useOrders = create<OrderState>()(
  persist(
    (set) => ({
      orders: [],
      placeOrder: (data) => {
        const o: Order = {
          ...data,
          id: 'BAS' + Date.now().toString().slice(-6),
          createdAt: Date.now(),
          status: 'placed',
        };
        set((s) => ({ orders: [o, ...s.orders] }));
        return o;
      },
      setOrders: (orders) => set({ orders }),
      upsertOrder: (order) =>
        set((s) => {
          const exists = s.orders.find((o) => o.id === order.id);
          return {
            orders: exists
              ? s.orders.map((o) => (o.id === order.id ? order : o))
              : [order, ...s.orders],
          };
        }),
      updateOrderStatus: (id, status) =>
        set((s) => ({
          orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)),
        })),
    }),
    { name: 'bakeart-orders', version: 2 }
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
    { name: 'bakeart-user', version: 2 }
  )
);

export const formatINR = (n: number) => `৳${n.toLocaleString('en-BD')}`;

// Selectors / helpers
export const cartSubtotal = (items: CartItem[]) =>
  items.reduce((s, i) => s + i.price * i.quantity, 0);

export const freeDeliveryThreshold = 1500;
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
    { name: 'bakeart-auth', version: 2 }
  )
);

// ── Settings Store ─────────────────────────────────────────
type SettingsState = {
  settings: SiteSettings;
  updateSettings: (patch: Partial<SiteSettings>) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      updateSettings: (patch) =>
        set((s) => {
          const next = { ...s.settings, ...patch };
          return { settings: next };
        }),
    }),
    {
      name: 'bakeart-settings',
      version: 2,
      merge: (persisted, current) => {
        const p = (persisted as { settings?: Partial<SiteSettings> } | undefined)?.settings ?? {};
        return { ...current, settings: { ...DEFAULT_SETTINGS, ...p } };
      },
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
    { name: 'bakeart-location', version: 2 }
  )
);

// ── UI extras (promo, new orders) ─────────────────────────
// Already in useUI above — adding methods via zustand's subscribe pattern
// These are available via useUI():
//   promoDiscount, applyPromo, clearPromo
//   newOrderCount, incrementNewOrders, clearNewOrders
//   chatOpen, setChatOpen
