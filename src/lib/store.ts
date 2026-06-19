import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Product, SiteSettings, User } from '@/types'
import { DEFAULT_SETTINGS } from '@/lib/data'
import { ls } from '@/lib/utils'

// ── Cart Store ──────────────────────────────────────────────
interface CartState {
  items: CartItem[]
  addItem: (product: Product, qty?: number, message?: string, weight?: string, weightPrice?: number) => void
  removeItem: (id: string) => void
  updateQty: (id: string, qty: number) => void
  clearCart: () => void
  total: () => number
  count: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, qty = 1, message, weight, weightPrice) => {
        set((s) => {
          const key = product.id + (message || '') + (weight || '')
          const existing = s.items.find((i) =>
            i.id === product.id && i.cake_message === message && i.selected_weight === weight
          )
          const effectivePrice = weightPrice ?? product.price
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.id === product.id && i.cake_message === message && i.selected_weight === weight
                  ? { ...i, quantity: i.quantity + qty }
                  : i
              ),
            }
          }
          return {
            items: [...s.items, {
              ...product,
              price: effectivePrice,
              quantity: qty,
              cake_message: message,
              selected_weight: weight,
              selected_weight_price: weightPrice,
            }],
          }
        })
      },
      removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      updateQty: (id, qty) => {
        if (qty < 1) { get().removeItem(id); return }
        set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, quantity: qty } : i)) }))
      },
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
      count: () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    { name: 'bake-cart' }
  )
)

// ── Auth Store ──────────────────────────────────────────────
interface AuthState {
  user: User | null
  login: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    { name: 'bake-auth' }
  )
)

// ── Settings Store ──────────────────────────────────────────
interface SettingsState {
  settings: SiteSettings
  updateSettings: (patch: Partial<SiteSettings>) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: ls.get<SiteSettings>('bake-settings', DEFAULT_SETTINGS),
      updateSettings: (patch) =>
        set((s) => {
          const next = { ...s.settings, ...patch }
          ls.set('bake-settings', next)
          return { settings: next }
        }),
    }),
    { name: 'bake-settings' }
  )
)

// ── Location Store (delivery-zone GPS gate) ───────────────────
interface LocationState {
  customerDistrict: string | null
  customerLat: number | null
  customerLng: number | null
  locationVerified: boolean
  setCustomerLocation: (district: string, lat: number, lng: number) => void
  clearLocation: () => void
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      customerDistrict: null,
      customerLat: null,
      customerLng: null,
      locationVerified: false,
      setCustomerLocation: (district, lat, lng) =>
        set({ customerDistrict: district, customerLat: lat, customerLng: lng, locationVerified: true }),
      clearLocation: () =>
        set({ customerDistrict: null, customerLat: null, customerLng: null, locationVerified: false }),
    }),
    { name: 'bake-location' }
  )
)

// ── UI Store ────────────────────────────────────────────────
interface UIState {
  darkMode: boolean
  cartOpen: boolean
  checkoutOpen: boolean
  adminOpen: boolean
  quickViewProduct: string | null
  trackingOpen: boolean
  promoDiscount: number
  wishlist: string[]
  newOrderCount: number
  toggleDark: () => void
  setCartOpen: (v: boolean) => void
  setCheckoutOpen: (v: boolean) => void
  setAdminOpen: (v: boolean) => void
  setQuickView: (id: string | null) => void
  setTrackingOpen: (v: boolean) => void
  applyPromo: (pct: number) => void
  clearPromo: () => void
  toggleWishlist: (id: string) => void
  incrementNewOrders: () => void
  clearNewOrders: () => void
}

export const useUIStore = create<UIState>()((set) => ({
  darkMode: ls.get('bake-dark', false),
  cartOpen: false,
  checkoutOpen: false,
  adminOpen: false,
  quickViewProduct: null,
  trackingOpen: false,
  promoDiscount: 0,
  wishlist: ls.get<string[]>('bake-wishlist', []),
  newOrderCount: 0,
  toggleDark: () =>
    set((s) => {
      const next = !s.darkMode
      ls.set('bake-dark', next)
      document.documentElement.classList.toggle('dark', next)
      return { darkMode: next }
    }),
  setCartOpen: (v) => set({ cartOpen: v }),
  setCheckoutOpen: (v) => set({ checkoutOpen: v }),
  setAdminOpen: (v) => set({ adminOpen: v }),
  setQuickView: (id) => set({ quickViewProduct: id }),
  setTrackingOpen: (v) => set({ trackingOpen: v }),
  applyPromo: (pct) => set({ promoDiscount: pct }),
  toggleWishlist: (id) => set((s) => {
    const next = s.wishlist.includes(id) ? s.wishlist.filter((x) => x !== id) : [...s.wishlist, id]
    ls.set('bake-wishlist', next)
    return { wishlist: next }
  }),
  clearPromo: () => set({ promoDiscount: 0 }),
  incrementNewOrders: () => set((s) => ({ newOrderCount: s.newOrderCount + 1 })),
  clearNewOrders: () => set({ newOrderCount: 0 }),
}))
