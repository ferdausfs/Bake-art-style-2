export interface Product {
  id: string
  name: string
  category: 'birthday' | 'wedding' | 'custom' | 'seasonal'
  price: number
  rating: number
  reviews: number
  tag?: string
  weight: string
  image: string
  description: string
  approved: boolean
  badges: string[]
  created_at?: string
}

export interface CartItem extends Product {
  quantity: number
  cake_message?: string
  selected_weight?: string
  selected_weight_price?: number
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

export interface Order {
  id: string
  user_id?: string
  customer_name: string
  customer_phone: string
  customer_address: string
  delivery_date: string
  delivery_time: string
  payment_method: 'cod' | 'bkash' | 'nagad'
  payment_screenshot?: string
  items: OrderItem[]
  subtotal: number
  discount: number
  delivery_fee: number
  total: number
  status: 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'delivered'
  promo_code?: string
  created_at: string
  district?: string | null
  gps_lat?: number | null
  gps_lng?: number | null
  location_verified?: boolean
}

export interface OrderItem {
  product_id: string
  name: string
  price: number
  quantity: number
  cake_message?: string
  selected_weight?: string
}

export interface GalleryItem {
  id: string
  image: string
  caption: string
  product_id?: string
  created_at: string
}

export interface Review {
  id: string
  product_id: string
  user_id?: string
  user_name: string
  rating: number
  comment: string
  approved: boolean
  created_at: string
}

export interface Coupon {
  id: string
  code: string
  discount: number
  maxUses: number
  usedCount: number
  expiresAt: string
  active: boolean
}

export interface SiteSettings {
  adminPin: string
  adminEmail: string
  promoEnabled: boolean
  promoCode: string
  promoPercent: number
  deliveryFee: number
  geminiApiKey: string
  whatsappNumber: string
  bkashNumber: string
  nagadNumber: string
  promoTitle: string
  deliveryEstimate: string
  coupons: Coupon[]
}

export type ToastType = 'success' | 'error' | 'info'
