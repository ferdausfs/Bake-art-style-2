export type Occasion = 'birthday' | 'wedding' | 'anniversary' | 'cupcakes' | 'gift' | 'premium';

export type Product = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  oldPrice?: number;
  image: string;
  gallery?: string[];
  rating: number;
  reviews: number;
  occasion: Occasion;
  flavors: string[];
  weights: { size: string; price: number }[];
  toppings?: string[];
  tags?: string[];
  bestseller?: boolean;
  newArrival?: boolean;
};

export type CartItem = {
  productId: string;
  name: string;
  image: string;
  size: string;
  flavor: string;
  topping?: string;
  message?: string;
  price: number;
  quantity: number;
};

export type Order = {
  id: string;
  items: CartItem[];
  customer: {
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    pin: string;
  };
  delivery: { date: string; time: string };
  payment: 'bkash' | 'nagad' | 'cash';
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: 'placed' | 'confirmed' | 'baking' | 'ready' | 'out' | 'delivered' | 'cancelled';
  createdAt: number;
};

export type Banner = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  tag: string;
  color: string;
};

export type Category = {
  id: Occasion | 'all';
  name: string;
  icon: string;
  color: string;
};

// ── Production Backend Types ──────────────────────────────
export interface DbProduct {
  id: string;
  name: string;
  category: 'birthday' | 'wedding' | 'custom' | 'seasonal';
  price: number;
  rating: number;
  reviews: number;
  tag?: string;
  weight: string;
  image: string;
  description: string;
  approved: boolean;
  badges: string[];
  created_at?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface DbOrder {
  id: string;
  user_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  delivery_date: string;
  delivery_time: string;
  payment_method: 'cod' | 'upi' | 'card';
  payment_screenshot?: string;
  items: DbOrderItem[];
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  status: 'placed' | 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'delivered';
  promo_code?: string;
  created_at: string;
}

export interface DbOrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  cake_message?: string;
  selected_weight?: string;
}

export interface GalleryItem {
  id: string;
  image: string;
  caption: string;
  product_id?: string;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id?: string;
  user_name: string;
  rating: number;
  comment: string;
  approved: boolean;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  active: boolean;
}

export interface SiteSettings {
  adminPin: string;
  adminEmail: string;
  promoEnabled: boolean;
  promoCode: string;
  promoPercent: number;
  deliveryFee: number;
  freeDeliveryThreshold?: number;
  deliveryZonesEnabled?: boolean;
  outOfZoneMessage?: string;
  geminiApiKey: string;
  whatsappNumber: string;
  upiId: string;
  promoTitle: string;
  deliveryEstimate: string;
  coupons: Coupon[];
  allowedZones: string[];
  customFlavorImages?: Record<string, string>;
}
