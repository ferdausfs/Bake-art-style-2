import { Heart, Plus, Star } from 'lucide-react';
import { useCart, formatINR } from '../lib/store';
import type { Product } from '../types';

type Props = {
  product: Product;
  wished: boolean;
  onOpen: () => void;
  onWish: (id: string) => void;
  variant?: 'horizontal' | 'grid';
};

export default function ProductCard({ product, wished, onOpen, onWish, variant = 'horizontal' }: Props) {
  const { add } = useCart();

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    add({
      productId: product.id,
      name: product.name,
      image: product.image,
      size: product.weights?.[0]?.size ?? '1 kg',
      flavor: product.flavors?.[0] ?? 'Chocolate',
      price: product.price,
      quantity: 1,
    });
  };

  const handleWish = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onWish(product.id);
  };

  if (variant === 'grid') {
    return (
      <article
        onClick={onOpen}
        className="group relative cursor-pointer overflow-hidden rounded-3xl bg-white transition active:scale-[.98] product-card-shadow"
      >
        <div className="relative aspect-square overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />

          {/* Wishlist */}
          <button
            onClick={handleWish}
            className={`absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition active:scale-90 ${
              wished ? 'bg-white text-coral' : 'bg-white/90 text-ink-200'
            }`}
            style={{ boxShadow: '0 4px 14px -6px rgba(26,19,17,.25)' }}
          >
            <Heart className={`h-[15px] w-[15px] ${wished ? 'fill-coral' : ''}`} strokeWidth={2} />
          </button>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.bestseller && (
              <span className="badge-premium rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide">
                Bestseller
              </span>
            )}
            {product.newArrival && (
              <span className="rounded-full bg-coral px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                New
              </span>
            )}
          </div>
        </div>

        <div className="p-3.5">
          <div className="flex items-center gap-1 text-[11px]">
            <Star className="h-3 w-3 fill-gold text-gold" />
            <span className="font-bold text-ink">{product.rating}</span>
            <span className="text-ink-200">({product.reviews.toLocaleString()})</span>
          </div>
          <h3 className="mt-1 line-clamp-1 font-display text-[16px] font-bold tracking-tight text-ink">
            {product.name}
          </h3>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-display text-[17px] font-bold tabular text-gradient-coral">
              {formatINR(product.price)}
            </span>
            {(product.inStock ?? true) && (
              <button
                onClick={handleAdd}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-coral text-white shadow-[0_8px_20px_-8px_rgba(242,94,115,.5)] transition active:scale-90 hover:brightness-105"
                aria-label="Add to cart"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </article>
    );
  }

  // Horizontal scroll variant
  return (
    <article
      onClick={onOpen}
      className="group relative flex w-[170px] flex-shrink-0 cursor-pointer flex-col overflow-hidden rounded-3xl bg-white transition active:scale-[.98] product-card-shadow"
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />

        <button
          onClick={handleWish}
          className={`absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition active:scale-90 ${
            wished ? 'bg-white text-coral' : 'bg-white/90 text-ink-200'
          }`}
          style={{ boxShadow: '0 4px 12px -6px rgba(26,19,17,.25)' }}
        >
          <Heart className={`h-3.5 w-3.5 ${wished ? 'fill-coral' : ''}`} strokeWidth={2} />
        </button>

        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {product.bestseller && (
            <span className="badge-premium rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide">
              Best
            </span>
          )}
          {product.newArrival && (
            <span className="rounded-full bg-coral px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
              New
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-center gap-1 text-[10px]">
          <Star className="h-2.5 w-2.5 fill-gold text-gold" />
          <span className="font-bold text-ink">{product.rating}</span>
          <span className="text-ink-200">({product.reviews.toLocaleString()})</span>
        </div>
        <h3 className="mt-1 line-clamp-1 font-display text-[15px] font-bold tracking-tight text-ink">
          {product.name}
        </h3>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-display text-[15px] font-bold tabular text-gradient-coral">
            {formatINR(product.price)}
          </span>
          {(product.inStock ?? true) && (
            <button
              onClick={handleAdd}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-coral text-white shadow-[0_6px_16px_-8px_rgba(242,94,115,.5)] transition active:scale-90"
              aria-label="Add to cart"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
