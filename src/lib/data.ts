import type { Product, SiteSettings } from '@/types'

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'p1', name: 'চকোলেট ড্রিম কেক', category: 'birthday', price: 850,
    rating: 4.9, reviews: 124, tag: 'বেস্টসেলার', weight: '১ কেজি',
    image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=600',
    description: 'বেলজিয়ান চকোলেট দিয়ে তৈরি অসাধারণ লেয়ার কেক। ভেতরে গানাশ ফিলিং, বাইরে সিল্ক বাটারক্রিম।',
    approved: true, badges: ['হালাল ✓', 'No Preservative'],
  },
  {
    id: 'p2', name: 'স্ট্রবেরি ক্রিম কেক', category: 'birthday', price: 950,
    rating: 4.8, reviews: 89, tag: 'নতুন', weight: '১ কেজি',
    image: 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg?auto=compress&cs=tinysrgb&w=600',
    description: 'তাজা স্ট্রবেরি ও হোয়াইট চকোলেট ক্রিম দিয়ে তৈরি। হালকা মিষ্টি, সবার প্রিয়।',
    approved: true, badges: ['হালাল ✓', 'Fresh Fruit'],
  },
  {
    id: 'p3', name: 'রেড ভেলভেট ক্লাসিক', category: 'wedding', price: 1200,
    rating: 5.0, reviews: 56, tag: 'প্রিমিয়াম', weight: '১.৫ কেজি',
    image: 'https://images.pexels.com/photos/4110004/pexels-photo-4110004.jpeg?auto=compress&cs=tinysrgb&w=600',
    description: 'ক্লাসিক রেড ভেলভেট ক্রিম চিজ ফ্রস্টিং সহ। বিবাহ ও বিশেষ অনুষ্ঠানের জন্য আদর্শ।',
    approved: true, badges: ['হালাল ✓', 'Premium'],
  },
  {
    id: 'p4', name: 'ম্যাঙ্গো মুস কেক', category: 'seasonal', price: 900,
    rating: 4.7, reviews: 43, tag: 'সিজনাল', weight: '১ কেজি',
    image: 'https://images.pexels.com/photos/5718025/pexels-photo-5718025.jpeg?auto=compress&cs=tinysrgb&w=600',
    description: 'আমের মৌসুমে তাজা রাজশাহী আম দিয়ে তৈরি মুস কেক।',
    approved: true, badges: ['হালাল ✓', 'Seasonal'],
  },
  {
    id: 'p5', name: 'ব্ল্যাক ফরেস্ট ডিলাক্স', category: 'birthday', price: 1100,
    rating: 4.9, reviews: 97, tag: 'জনপ্রিয়', weight: '১.৫ কেজি',
    image: 'https://images.pexels.com/photos/2144200/pexels-photo-2144200.jpeg?auto=compress&cs=tinysrgb&w=600',
    description: 'ডার্ক চকোলেট স্পঞ্জ, চেরি ফিলিং এবং হোয়াইপড ক্রিম।',
    approved: true, badges: ['হালাল ✓', 'No Preservative'],
  },
  {
    id: 'p6', name: 'বাটারস্কচ ক্রাঞ্চ', category: 'birthday', price: 800,
    rating: 4.6, reviews: 61, weight: '১ কেজি',
    image: 'https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg?auto=compress&cs=tinysrgb&w=600',
    description: 'ক্যারামেলাইজড বাটারস্কচ ক্রিম ও ক্রাঞ্চি টফি বিট সহ।',
    approved: true, badges: ['হালাল ✓', 'Kids Favorite'],
  },
]

export const DEFAULT_SETTINGS: SiteSettings = {
  adminPin: '1234',
  adminEmail: 'umuhammadiswa@gmail.com',
  promoEnabled: true,
  promoCode: 'BAKE20',
  promoPercent: 20,
  deliveryFee: 60,
  geminiApiKey: '',
  whatsappNumber: '8801764411168',
  bkashNumber: '01764411168',
  nagadNumber: '01764411168',
  promoTitle: '🎁 বিশেষ অফার! আজই অর্ডার করুন',
  deliveryEstimate: '২-৩ ঘণ্টা',
  coupons: [],
}

export const CAKE_FLAVORS = [
  { id: 'choco', name: 'চকোলেট', price: 0, emoji: '🍫' },
  { id: 'vanilla', name: 'ভ্যানিলা', price: 0, emoji: '🍦' },
  { id: 'strawberry', name: 'স্ট্রবেরি', price: 50, emoji: '🍓' },
  { id: 'mango', name: 'আম', price: 50, emoji: '🥭' },
  { id: 'redvelvet', name: 'রেড ভেলভেট', price: 100, emoji: '❤️' },
  { id: 'butterscotch', name: 'বাটারস্কচ', price: 0, emoji: '🍯' },
]

export const CAKE_WEIGHTS = [
  { id: '500g', name: '৫০০ গ্রাম', price: 500 },
  { id: '1kg', name: '১ কেজি', price: 850 },
  { id: '1.5kg', name: '১.৫ কেজি', price: 1200 },
  { id: '2kg', name: '২ কেজি', price: 1550 },
  { id: '2.5kg', name: '২.৫ কেজি', price: 1900 },
  { id: '3kg', name: '৩ কেজি', price: 2200 },
]

export const WEIGHT_OPTIONS = [
  { label: '½ কেজি', value: 0.5, multiplier: 0.6 },
  { label: '১ কেজি', value: 1.0, multiplier: 1.0 },
  { label: '১.৫ কেজি', value: 1.5, multiplier: 1.4 },
  { label: '২ কেজি', value: 2.0, multiplier: 1.8 },
  { label: '৩ কেজি', value: 3.0, multiplier: 2.5 },
]

export const CATEGORIES = [
  { id: 'all', label: 'সব', emoji: '🎂' },
  { id: 'birthday', label: 'জন্মদিন', emoji: '🎉' },
  { id: 'wedding', label: 'বিবাহ', emoji: '💍' },
  { id: 'custom', label: 'কাস্টম', emoji: '✨' },
  { id: 'seasonal', label: 'সিজনাল', emoji: '🌸' },
]

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: '⏳ পেন্ডিং',
  confirmed: '✅ কনফার্ম',
  preparing: '👩‍🍳 প্রস্তুতি',
  delivering: '🚗 ডেলিভারি',
  delivered: '🎉 সম্পন্ন',
}
