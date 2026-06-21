import type { Product, Category, Banner } from '../types';

export const categories: Category[] = [
  { id: 'birthday',    name: 'Birthday',    icon: '🎂', color: '#FFE2E7' },
  { id: 'anniversary', name: 'Anniversary', icon: '❤️', color: '#FFE2E7' },
  { id: 'cupcakes',    name: 'Cupcakes',    icon: '🧁', color: '#FFE2E7' },
  { id: 'gift',        name: 'Custom',      icon: '🎁', color: '#FFE2E7' },
];

const weights = [
  { size: '0.5 kg', price: 0 },
  { size: '1 kg',   price: 100 },
  { size: '1.5 kg', price: 250 },
  { size: '2 kg',   price: 400 },
];

const FLAVORS = ['Chocolate', 'Vanilla', 'Red Velvet', 'Butterscotch', 'Strawberry'];

export const products: Product[] = [
  {
    id: 'p1',
    name: 'Chocolate Truffle',
    tagline: 'Rich chocolate sponge with ganache',
    description: 'Made with rich chocolate sponge, layered with silky chocolate ganache and topped with chocolate truffles.',
    price: 799,
    image: '/cakes/chocolate-truffle.png',
    rating: 4.8, reviews: 256, occasion: 'birthday',
    flavors: FLAVORS, weights,
    toppings: ['Chocolate truffles', 'Strawberry', 'Gold dust'],
    bestseller: true,
  },
  {
    id: 'p2',
    name: 'Red Velvet',
    tagline: 'Classic red velvet with cream',
    description: 'Soft crimson velvet sponge with a hint of cocoa, layered with silky cream cheese frosting and fresh strawberries.',
    price: 849,
    image: '/cakes/red-velvet.png',
    rating: 4.9, reviews: 312, occasion: 'anniversary',
    flavors: FLAVORS, weights,
    toppings: ['Cream cheese roses', 'Fresh strawberries', 'White chocolate'],
    bestseller: true,
  },
  {
    id: 'p3',
    name: 'Butterscotch',
    tagline: 'Caramel praline indulgence',
    description: 'Silky vanilla sponge with praline crunch, coated in smooth butterscotch buttercream and caramel drizzle.',
    price: 749,
    image: '/cakes/butterscotch.png',
    rating: 4.7, reviews: 184, occasion: 'birthday',
    flavors: FLAVORS, weights,
    toppings: ['Caramel drip', 'Candied nuts', 'Praline crunch'],
    bestseller: true,
  },
  {
    id: 'p4',
    name: 'Pink Strawberry',
    tagline: 'Dreamy strawberry delight',
    description: 'Light vanilla chiffon with fresh strawberries, pink strawberry glaze and delicate rosettes.',
    price: 899,
    image: '/cakes/strawberry-pink.png',
    rating: 4.9, reviews: 220, occasion: 'anniversary',
    flavors: FLAVORS, weights,
    toppings: ['Pink rosettes', 'Fresh strawberries', 'Gold sprinkles'],
    newArrival: true,
  },
  {
    id: 'p5',
    name: 'Vanilla Dream',
    tagline: 'Classic vanilla bean cake',
    description: 'Fluffy Madagascar vanilla sponge with vanilla bean buttercream — pure elegance.',
    price: 699,
    image: '/cakes/butterscotch.png',
    rating: 4.6, reviews: 145, occasion: 'birthday',
    flavors: FLAVORS, weights,
  },
  {
    id: 'p6',
    name: 'Rose Garden',
    tagline: 'Floral rose-infused cake',
    description: 'Rose-infused sponge with raspberry coulis, adorned with hand-piped rose buttercream.',
    price: 949,
    image: '/cakes/strawberry-pink.png',
    rating: 5.0, reviews: 88, occasion: 'anniversary',
    flavors: FLAVORS, weights,
    newArrival: true,
  },
];

export const banners: Banner[] = [
  {
    id: 'b1',
    title: 'Bake Art Style Collections',
    subtitle: 'Delicious cakes for every occasion.',
    image: '/banners/banner1.jpg',
    tag: 'Shop Now',
    color: '#FCEFF1',
    type: 'new_item',
    productId: 'p1',
  },
  {
    id: 'b2',
    title: 'Birthday Special',
    subtitle: 'Up to 20% off this week only',
    image: '/banners/banner2.jpg',
    tag: 'Order Now',
    color: '#FFE2E7',
    type: 'new_item',
    productId: 'p2',
  },
  {
    id: 'b3',
    title: 'Customize Your Cake',
    subtitle: 'Design your dream cake in 4 steps',
    image: '/banners/banner3.jpg',
    tag: 'Customize',
    color: '#FCE4E6',
    type: 'new_item',
    productId: 'p3',
  },
];

// ── Production / Admin Data ──────────────────────────────
import type { SiteSettings } from '../types';

export const DEFAULT_SETTINGS: SiteSettings = {
  adminPin: '1234',
  adminEmail: 'umuhammadiswa@gmail.com',
  promoEnabled: true,
  promoCode: 'BAKE20',
  promoPercent: 20,
  deliveryFee: 60,
  freeDeliveryThreshold: 999,
  deliveryZonesEnabled: true,
  outOfZoneMessage: 'আপনার এলাকায় এখনো ডেলিভারি নেই — WhatsApp-এ অর্ডার করুন, আমরা সাহায্য করব!',
  geminiApiKey: '',
  whatsappNumber: '8801XXXXXXXXX',
  upiId: '01XXXXXXXXX',
  promoTitle: '🎁 Special offer! Order today',
  deliveryEstimate: '2–4 ঘণ্টা',
  coupons: [],
  allowedZones: ['Comilla', 'Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Mymensingh', 'Barishal'],
};
