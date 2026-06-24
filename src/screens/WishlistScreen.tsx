import { ArrowLeft, Heart } from 'lucide-react';
import { useUI, useUser } from '../lib/store';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/ProductCard';

export default function WishlistScreen() {
  const { back, go } = useUI();
  const { wishlist, toggleWish } = useUser();
  const { products } = useProducts();
  const list = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="flex h-full flex-col bg-cream">
      <header className="flex flex-shrink-0 items-center justify-between px-5 pt-3 pb-3">
        <button
          onClick={back}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink active:scale-90"
          style={{ boxShadow: '0 1px 2px rgba(26,19,17,.03), 0 6px 16px -10px rgba(26,19,17,.2)' }}
        >
          <ArrowLeft className="h-[20px] w-[20px]" strokeWidth={2} />
        </button>
        <h1 className="font-display text-[16px] font-bold tracking-tight text-ink">Wishlist</h1>
        <div className="w-10" />
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-32 pt-1">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-16 text-center">
            <div
              className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white"
              style={{ boxShadow: '0 1px 2px rgba(26,19,17,.03), 0 12px 30px -18px rgba(26,19,17,.14)' }}
            >
              <Heart className="h-12 w-12 text-ink-200" strokeWidth={1.8} />
            </div>
            <h2 className="mt-5 font-display text-[22px] font-bold tracking-tight text-ink">
              Your wishlist is empty
            </h2>
            <p className="mt-1.5 max-w-xs text-[13px] text-ink-200">
              Tap the heart on any cake to save it for later.
            </p>
            <button onClick={back} className="btn-primary mt-6 h-12 rounded-2xl px-7 text-[13px] font-bold">
              Browse cakes
            </button>
          </div>
        ) : (
          <>
            <p className="mb-3 text-[12px] font-medium text-ink-200">
              <span className="font-bold text-ink">{list.length}</span> saved cakes
            </p>
            <div className="grid grid-cols-2 gap-3">
              {list.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  wished
                  onWish={toggleWish}
                  onOpen={() => go({ name: 'product', productId: p.id })}
                  variant="grid"
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
