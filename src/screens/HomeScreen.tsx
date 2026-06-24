import { useEffect, useState, useMemo } from 'react';
import { ArrowRight, Sparkles, ChevronLeft, ChevronRight, Megaphone, RefreshCw } from 'lucide-react';
import { useUI, useUser, useOrders } from '../lib/store';
import { categories } from '../lib/data';
import { useProducts } from '../hooks/useProducts';
import { useBanners } from '../hooks/useBanners';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import ProductCard from '../components/ProductCard';
import SectionHeader from '../components/SectionHeader';
import BrandLogo from '../components/BrandLogo';
import OccasionIcon from '../components/OccasionIcon';
import type { Banner } from '../types';

const ALL_CAT = { id: 'all' as const, name: 'All' };

export default function HomeScreen({
  onLogoTap,
  onNotificationsOpen,
}: {
  onLogoTap?: () => void;
  onNotificationsOpen?: () => void;
}) {
  const { go } = useUI();
  const { wishlist, toggleWish } = useUser();
  const { orders } = useOrders();
  const { products } = useProducts();
  const { banners } = useBanners();

  const [bannerIdx, setBannerIdx] = useState(0);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeNotice, setActiveNotice] = useState<Banner | null>(null);

  const trending = useMemo(() => products
    .filter((p) => p.bestseller || p.newArrival)
    .slice(0, 8), [products]);

  useEffect(() => {
    if (banners.length === 0) return;
    const t = setInterval(() => setBannerIdx((i) => (i + 1) % banners.length), 5500);
    return () => clearInterval(t);
  }, [banners.length]);

  return (
    <div className="flex h-full flex-col bg-cream">
      <Header onLogoTap={onLogoTap} onNotificationsOpen={onNotificationsOpen} />

      <div className="no-scrollbar flex-1 overflow-y-auto pb-32">
        {/* Greeting + search */}
        <div className="px-5 pt-1 anim-up relative overflow-hidden">
          {/* Decorative background glow */}
          <div className="pointer-events-none absolute -right-10 -top-8 h-40 w-40 rounded-full bg-blush-200/60 blur-3xl" />
          <div className="pointer-events-none absolute -left-4 top-4 h-24 w-24 rounded-full bg-blush-100/80 blur-2xl" />
          <div className="text-[12px] font-medium tracking-[0.2em] text-ink-200 uppercase">
            Welcome back
          </div>
          <h1 className="mt-1 font-display text-[28px] font-bold leading-[1.1] tracking-tight text-ink">
            What cake are we
            <br />
            <span className="text-gradient-coral">celebrating today?</span>
          </h1>
          <div className="mt-4">
            <SearchBar value={search} onChange={setSearch} />
          </div>
        </div>

        {/* Hero carousel */}
        {banners.length > 0 && (
          <div className="mt-5 px-5 anim-up delay-1">
            <div
              className="relative overflow-hidden rounded-[28px] bg-white"
              style={{ boxShadow: '0 1px 2px rgba(26,19,17,.03), 0 18px 50px -28px rgba(26,19,17,.18)' }}
            >
              <div className="relative aspect-[16/11] w-full overflow-hidden">
                {banners.map((b, i) => (
                  <div
                    key={b.id}
                    className={`absolute inset-0 transition-opacity duration-700 ${
                      i === bannerIdx ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                  >
                    <img
                      src={b.image}
                      alt={b.title}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
                    <div className="absolute inset-0 flex flex-col justify-end p-5">
                      <span className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase backdrop-blur-md">
                        <Sparkles className="h-2.5 w-2.5" /> {b.tag}
                      </span>
                      <h3 className="font-display text-[24px] font-bold leading-tight tracking-tight text-white">
                        {b.title}
                      </h3>
                      <p className="mt-1 text-[12.5px] leading-snug text-white/85">{b.subtitle}</p>
                      <button
                        onClick={() => {
                          if (b.type === 'discount') {
                            if (b.promoCode) {
                              navigator.clipboard?.writeText(b.promoCode);
                              setCopiedId(b.id);
                              setTimeout(() => setCopiedId(null), 1500);
                            }
                          } else if (b.type === 'notice') {
                            setActiveNotice(b);
                          } else {
                            // new_item
                            go({ name: 'product', productId: b.productId || products[0]?.id || 'p1' });
                          }
                        }}
                        className="mt-3.5 inline-flex h-10 w-fit items-center gap-1.5 rounded-full bg-white px-4 text-[12.5px] font-bold text-ink transition active:scale-95 shadow"
                      >
                        {b.type === 'discount' ? (
                          copiedId === b.id ? 'Copied!' : `Copy: ${b.promoCode || 'CODE'}`
                        ) : (
                          <>
                            {b.tag || 'Order now'}
                            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => setBannerIdx((i) => (i - 1 + banners.length) % banners.length)}
                  className="absolute top-1/2 left-3 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink backdrop-blur transition active:scale-95 md:flex"
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => setBannerIdx((i) => (i + 1) % banners.length)}
                  className="absolute top-1/2 right-3 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink backdrop-blur transition active:scale-95 md:flex"
                  aria-label="Next"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
                </button>

                <div className="absolute right-0 bottom-3 left-0 z-20 flex justify-center gap-1.5">
                  {banners.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setBannerIdx(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === bannerIdx ? 'w-6 bg-white shadow' : 'w-1.5 bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick action: order again */}
        {orders.length > 0 && (
          <div className="mt-5 px-5 anim-up delay-2">
            <button
              onClick={() => go({ name: 'tabs', tab: 'orders' })}
              className="group flex w-full items-center gap-3 rounded-2xl border border-ink-50 bg-white p-3.5 text-left transition active:scale-[.98]"
              style={{ boxShadow: '0 1px 2px rgba(26,19,17,.02), 0 8px 24px -18px rgba(26,19,17,.18)' }}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-50">
                <RefreshCw className="h-5 w-5 text-ink" strokeWidth={1.75} />
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-bold text-ink">Order again</div>
                <div className="text-[11.5px] text-ink-200">
                  Your previous favourites, one tap away
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-ink-200 transition group-hover:translate-x-0.5" />
            </button>
          </div>
        )}

        {/* Categories */}
        <div className="mt-7 anim-up delay-2">
          <SectionHeader title="Browse by occasion" />
          <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto px-5 pb-1">
            {[ALL_CAT, ...categories].map((c) => (
              <button
                key={c.id}
                onClick={() => go({ name: 'tabs', tab: 'categories' })}
                className="group flex w-[78px] flex-shrink-0 flex-col items-center gap-2 transition active:scale-95"
              >
                <div
                  className="relative flex h-[64px] w-[64px] items-center justify-center overflow-hidden rounded-[22px] border border-white bg-gradient-to-br from-white to-blush-100 text-ink-200 shadow-[0_10px_24px_-16px_rgba(26,19,17,.18)] transition group-active:scale-95"
                  style={{
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,.9), 0 10px 24px -16px rgba(26,19,17,.18)',
                  }}
                >
                  <span className="absolute -right-4 -top-4 h-10 w-10 rounded-full bg-blush-200/50" />
                  <OccasionIcon id={c.id} size={28} className="relative" />
                </div>
                <span className="text-[12px] font-semibold text-ink">{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Trending */}
        <div className="mt-7 anim-up delay-3">
          <SectionHeader
            eyebrow="Trending now"
            title="Popular this week"
            action={{ label: 'See all', onClick: () => go({ name: 'tabs', tab: 'categories' }) }}
          />
          <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto px-5 pb-2">
            {trending.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                wished={wishlist.includes(p.id)}
                onWish={toggleWish}
                onOpen={() => go({ name: 'product', productId: p.id })}
              />
            ))}
          </div>
        </div>

        {/* Personalized */}
        <div className="mt-7 px-5 anim-up delay-4">
          <div
            className="relative overflow-hidden rounded-[28px] p-5"
            style={{ background: 'linear-gradient(135deg, #2A1F1E 0%, #3D2D2C 100%)' }}
          >
            <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-coral/30 blur-2xl" />
            <div className="absolute bottom-0 -left-12 h-32 w-32 rounded-full bg-gold/15 blur-2xl" />

            <div className="relative flex items-center gap-4">
              <div className="flex-1">
                <div className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-blush-200 uppercase backdrop-blur">
                  <Sparkles className="h-2.5 w-2.5" /> For you
                </div>
                <h3 className="mt-2 font-display text-[20px] leading-tight font-bold tracking-tight text-white">
                  Picked for your taste
                </h3>
                <p className="mt-1 text-[12px] text-white/70">
                  Hand-picked selections based on trending bakes.
                </p>
                <button
                  onClick={() => go({ name: 'customize' })}
                  className="mt-3.5 inline-flex h-9 items-center gap-1.5 rounded-full bg-coral px-3.5 text-[12px] font-bold text-white shadow-[0_8px_18px_-8px_rgba(242,94,115,.55)] transition active:scale-95"
                >
                  Customize yours <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
                </button>
              </div>
              <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl shadow-lg">
                <img src={products[3]?.image || '/cakes/logo-cake.png'} alt="" className="h-full w-full object-cover" />
              </div>
            </div>
          </div>
        </div>

        {/* Brand strip */}
        <div className="mt-6 px-5 pb-3">
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-white/60 py-3 text-ink-200">
            <BrandLogo size={20} />
            <span className="text-[11.5px] font-medium tracking-wider uppercase">
              Handcrafted since 2018
            </span>
          </div>
        </div>
      </div>

      {/* Notice Modal */}
      {activeNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5 backdrop-blur-sm anim-fade">
          <div
            className="w-full max-w-sm overflow-hidden rounded-[28px] glass-strong p-6 shadow-2xl anim-scale"
            style={{ boxShadow: '0 20px 60px -10px rgba(0,0,0,0.15)' }}
          >
            <div className="flex justify-center text-ink">
              <Megaphone size={40} strokeWidth={1.5} />
            </div>
            <h3 className="mt-4 font-display text-[20px] font-bold tracking-tight text-ink">
              {activeNotice.title}
            </h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-200">
              {activeNotice.noticeText}
            </p>
            <button
              onClick={() => setActiveNotice(null)}
              className="btn-primary mt-6 flex h-11 w-full items-center justify-center rounded-2xl text-[13px] font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
