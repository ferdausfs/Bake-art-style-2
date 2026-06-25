import { useState } from 'react';
import { SlidersHorizontal, Search } from 'lucide-react';
import { useUI, useUser } from '../lib/store';
import { categories } from '../lib/data';
import { useProducts } from '../hooks/useProducts';
import SearchBar from '../components/SearchBar';
import ProductCard from '../components/ProductCard';
import OccasionIcon from '../components/OccasionIcon';

const ALL_CAT = { id: 'all' as const, name: 'All' };

export default function CategoriesScreen() {
  const { go } = useUI();
  const { wishlist, toggleWish } = useUser();
  const { products } = useProducts();
  const [active, setActive] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = products
    .filter((p) => (p.inStock ?? true))
    .filter((p) => (active === 'all' ? true : p.occasion === active))
    .filter((p) =>
      search.trim() ? p.name.toLowerCase().includes(search.toLowerCase()) : true
    );

  return (
    <div className="flex h-full flex-col bg-cream">
      {/* Header */}
      <header className="flex-shrink-0 px-5 pt-3 pb-2">
        <div className="flex items-end justify-between">
          <div>
            <div className="section-eyebrow">Explore</div>
            <h1 className="mt-1 font-display text-[28px] font-bold tracking-tight text-ink">
              All cakes
            </h1>
          </div>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink-200 transition active:scale-90" style={{ boxShadow: '0 1px 2px rgba(26,19,17,.03), 0 8px 24px -16px rgba(26,19,17,.16)' }}>
            <SlidersHorizontal className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="mt-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search cakes…" />
        </div>
      </header>

      {/* Filter chips */}
      <div className="no-scrollbar mt-3 flex flex-shrink-0 gap-2 overflow-x-auto px-5 pb-3">
        {[ALL_CAT, ...categories].map((c) => {
          const isActive = active === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={`chip flex-shrink-0 ${isActive ? 'chip-active' : ''}`}
            >
              <OccasionIcon id={c.id} size={15} />
              <span>{c.name}</span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-32">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[12px] font-medium text-ink-200">
            <span className="font-bold text-ink">{filtered.length}</span> cakes
          </p>
          <p className="text-[12px] font-medium text-ink-200">Sorted by Popular</p>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex justify-center text-ink-200 opacity-60">
              <Search size={44} strokeWidth={1.5} />
            </div>
            <p className="mt-2 text-[14px] font-medium text-ink-300">No cakes found</p>
            <p className="text-[12px] text-ink-200">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                wished={wishlist.includes(p.id)}
                onWish={toggleWish}
                onOpen={() => go({ name: 'product', productId: p.id })}
                variant="grid"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
