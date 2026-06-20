import { Heart, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useUI, useUser, useCart } from '../lib/store';
import { useProducts } from '../hooks/useProducts';

const formatINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export function WishlistScreen() {
  const { back, go } = useUI();
  const { wishlist: rawWishlist, toggleWish } = useUser();
  const wishlist = rawWishlist ?? [];
  const { add } = useCart();
  const { products: rawProducts } = useProducts();
  const products = rawProducts ?? [];

  const items = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="flex flex-col h-full bg-cream">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-ink/6 flex-shrink-0">
        <button onClick={back} className="w-9 h-9 rounded-full bg-ink/5 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-ink" />
        </button>
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-coral" />
          <h1 className="font-display text-xl font-bold text-ink">Wishlist</h1>
          {items.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-coral/10 text-coral text-xs font-bold">
              {items.length}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="w-20 h-20 rounded-full bg-coral/10 flex items-center justify-center mb-4">
              <Heart className="w-9 h-9 text-coral" />
            </div>
            <p className="font-bold text-ink/60 text-sm mb-1">Wishlist is empty</p>
            <p className="text-xs text-ink/40 mb-6">Tap the heart on any cake to save it here</p>
            <button onClick={() => go({ name: 'tabs', tab: 'categories' })}
              className="px-6 py-3 rounded-2xl bg-coral text-white font-bold text-sm">
              Browse Cakes
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3 bg-white rounded-2xl p-3"
                style={{ boxShadow: '0 2px 12px -4px rgba(26,19,17,.1)' }}>
                <button onClick={() => go({ name: 'product', productId: item.id })}
                  className="w-20 h-20 rounded-xl overflow-hidden bg-blush flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-ink line-clamp-1">{item.name}</p>
                  <p className="text-xs text-ink/50 mt-0.5">{item.tagline}</p>
                  <p className="text-sm font-black text-coral mt-1">{formatINR(item.price)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => add({
                        productId: item.id, name: item.name, image: item.image,
                        size: item.weights?.[1]?.size ?? '1 kg',
                        flavor: item.flavors?.[0] ?? 'Chocolate',
                        price: item.price, quantity: 1,
                      })}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-coral text-white text-[11px] font-bold">
                      <ShoppingBag className="w-3 h-3" /> Add to Cart
                    </button>
                    <button onClick={() => toggleWish(item.id)}
                      className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
