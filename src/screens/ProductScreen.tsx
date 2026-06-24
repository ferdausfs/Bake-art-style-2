import { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Star, ShoppingBag, Check, Share2, Truck, Sparkles, Shield, Cake, Pencil, CheckCircle2, Camera, X } from 'lucide-react';
import { useUI, useCart, useUser, useAuthStore, formatINR } from '../lib/store';
import { useProducts } from '../hooks/useProducts';
import { useReviews } from '../hooks/useReviews';
import type { Review } from '../types';

const ADDONS = [
  { id: 'candles', name: 'Birthday candles', price: 20 },
  { id: 'message', name: 'Custom message', price: 50 },
  { id: 'card', name: 'Greeting card', price: 30 },
  { id: 'knife', name: 'Cake knife set', price: 80 },
];

export default function ProductScreen() {
  const { view, back, go } = useUI();
  const { add } = useCart();
  const { wishlist, toggleWish } = useUser();
  const { products } = useProducts();

  const product = view.name === 'product' ? products.find((p) => p.id === view.productId) : null;
  const [activeImg, setActiveImg] = useState<string | null>(null);

  // Reviews state
  const { reviews, saveReview, uploadReviewImage } = useReviews(product?.id);
  const { user } = useAuthStore();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImageFile, setReviewImageFile] = useState<File | null>(null);
  const [reviewImagePreview, setReviewImagePreview] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const handleSubmitReview = async () => {
    if (!product || !reviewComment.trim() || submittingReview) return;
    setSubmittingReview(true);
    try {
      let imageUrl = '';
      if (reviewImageFile) {
        imageUrl = await uploadReviewImage(reviewImageFile);
      }
      const review: Review = {
        id: `r-${Date.now()}`,
        product_id: product.id,
        user_id: user?.id,
        user_name: user?.name || 'Anonymous',
        rating: reviewRating,
        comment: reviewComment.trim(),
        image: imageUrl || undefined,
        approved: false,
        created_at: new Date().toISOString(),
      };
      await saveReview(review);
      setReviewSuccess(true);
      setShowReviewForm(false);
      setReviewComment('');
      setReviewRating(5);
      setReviewImageFile(null);
      setReviewImagePreview('');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Reset activeImg when product ID changes
  useEffect(() => {
    setActiveImg(null);
  }, [view.name === 'product' ? view.productId : '']);

  if (view.name !== 'product') return null;

  if (!product) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-cream px-6 text-center">
        <div className="flex justify-center text-ink-200 opacity-60">
          <Cake size={48} strokeWidth={1.5} />
        </div>
        <h2 className="mt-4 font-display text-[20px] font-bold text-ink">Cake not found</h2>
        <p className="mt-1 text-[12px] text-ink-200">This item may have been removed.</p>
        <button onClick={back} className="btn-primary mt-5 h-12 rounded-2xl px-6 text-[13px] font-bold">
          Go back
        </button>
      </div>
    );
  }

  const currentImg = activeImg || product.image;
  const [size, setSize] = useState(product.weights[1]?.size ?? product.weights[0]?.size);
  const [addons, setAddons] = useState<Record<string, boolean>>({});
  const [customWeight, setCustomWeight] = useState('1');
  const [weightError, setWeightError] = useState('');
  const wished = wishlist.includes(product.id);

  const selectedWeight = product.weights.find((w) => w.size === size);
  const addonsCost = ADDONS.reduce((s, a) => s + (addons[a.id] ? a.price : 0), 0);
  const selectedAddons = ADDONS.filter((a) => addons[a.id]).map((a) => a.name);

  // If weight-based pricing is set, compute dynamically
  const weightPrice = product.pricePerUnit && customWeight && +customWeight > 0
    ? +customWeight * product.pricePerUnit
    : 0;
  const base = product.pricePerUnit
    ? weightPrice
    : (product.price + (selectedWeight?.price ?? 0));
  const total = base + addonsCost;

  const handleAdd = () => {
    if (product.pricePerUnit) {
      const w = parseFloat(customWeight);
      if (!customWeight || isNaN(w) || w <= 0) {
        setWeightError('Please enter a valid weight');
        return;
      }
      setWeightError('');
      add({
        productId: product.id,
        name: product.name,
        image: product.image,
        size: `${customWeight} ${product.priceUnit ?? 'kg'}`,
        flavor: product.flavors[0],
        topping: selectedAddons.length ? selectedAddons.join(', ') : undefined,
        price: total,
        quantity: 1,
      });
    } else {
      add({
        productId: product.id,
        name: product.name,
        image: product.image,
        size,
        flavor: product.flavors[0],
        topping: selectedAddons.length ? selectedAddons.join(', ') : undefined,
        price: total,
        quantity: 1,
      });
    }
    go({ name: 'cart' });
  };

  return (
    <div className="relative flex h-full flex-col bg-blush-50">
      {/* ONE scrollable area: image + all content (parallax scroll) */}
      <div className="no-scrollbar relative flex-1 overflow-y-auto bg-blush-50 pb-28">
        {/* Hero image — scrolls up naturally as user scrolls down */}
        <div className="relative w-full aspect-[4/3] bg-blush-100">
          <img src={currentImg} alt={product.name} className="absolute inset-0 h-full w-full object-cover" />

          {/* Soft top fade for control legibility */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-blush-100/85 to-transparent" />

          {/* Pagination dots */}
          <div className="absolute right-0 bottom-5 left-0 flex justify-center gap-1.5 pointer-events-none">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === 0 ? 'w-5 bg-coral' : 'w-1.5 bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content sheet below image — flows naturally as user scrolls */}
        <div className="bg-white rounded-t-[28px] -mt-5 relative z-10 px-5 pt-6">
          {/* Gallery Thumbnail Strip */}
          {product.gallery && product.gallery.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
              {[product.image, ...product.gallery].map((url, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(url)}
                  className={`flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-colors ${
                    currentImg === url ? 'border-coral' : 'border-transparent'
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Title row */}
          <div className="flex items-start justify-between gap-3">
            <h1 className="flex-1 font-display text-[26px] font-bold leading-[1.1] tracking-tight text-ink">
              {product.name}
            </h1>
            {product.tier && product.tier !== 'normal' && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                product.tier === 'premium'
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-white'
                  : 'bg-ink text-white'
              }`}>
                {product.tier === 'premium' ? (
                  <>
                    <Star className="h-3 w-3" strokeWidth={2.5} /> Premium
                  </>
                ) : (
                  <>
                    <Pencil className="h-3 w-3" strokeWidth={2.5} /> Custom Order
                  </>
                )}
              </span>
            )}
          </div>

          {/* Rating + meta */}
          <div className="mt-2 flex items-center gap-2 text-[12.5px]">
            <div className="flex items-center gap-0.5 text-gold">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${i < Math.round(product.rating) ? 'fill-current' : 'opacity-30'}`}
                  strokeWidth={0}
                />
              ))}
            </div>
            <span className="font-bold text-ink">{product.rating}</span>
            <span className="text-ink-200">({product.reviews.toLocaleString()} reviews)</span>
          </div>

          {/* Price */}
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-display text-[34px] font-bold leading-none text-coral tabular">
              {formatINR(base)}
            </span>
            {product.oldPrice && (
              <span className="text-[14px] text-ink-200 line-through">
                {formatINR(product.oldPrice)}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="mt-4 text-[13.5px] leading-relaxed text-ink-200">{product.description}</p>

          {/* Trust row */}
          <div className="mt-5 flex items-center justify-between rounded-2xl bg-cream px-4 py-3">
            <Trust icon={Truck} label="Free delivery" />
            <span className="h-5 w-px bg-ink-50" />
            <Trust icon={Sparkles} label="Freshly baked" />
            <span className="h-5 w-px bg-ink-50" />
            <Trust icon={Shield} label="Secure pay" />
          </div>

          {/* Size selector */}
          <section className="mt-7">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-[15px] font-bold tracking-tight text-ink">Select size</h3>
              <span className="text-[11px] text-ink-200">{product.pricePerUnit ? 'Weight-based' : 'Serves 8-12'}</span>
            </div>
            {product.pricePerUnit ? (
              /* Dynamic weight-based pricing */
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0.25"
                    step="0.25"
                    placeholder={`Enter weight in ${product.priceUnit ?? 'kg'}`}
                    className="flex-1 px-3 py-2.5 rounded-xl border-2 border-ink/10 bg-cream text-sm font-bold text-ink focus:border-coral focus:outline-none"
                    value={customWeight}
                    onChange={(e) => setCustomWeight(e.target.value)}
                  />
                  <span className="text-sm font-bold text-ink/50">{product.priceUnit ?? 'kg'}</span>
                </div>
                {weightError && (
                  <div className="text-[11px] text-red-500 font-semibold">{weightError}</div>
                )}
                {customWeight && +customWeight > 0 && (
                  <div className="mt-2 rounded-xl bg-ink-50 px-3 py-2 flex items-center justify-between">
                    <span className="text-[11px] text-ink/60">{customWeight} {product.priceUnit ?? 'kg'} × ৳{product.pricePerUnit}</span>
                    <span className="font-display text-base font-bold text-ink">৳{(+customWeight * (product.pricePerUnit ?? 0)).toLocaleString()}</span>
                  </div>
                )}
              </div>
            ) : (
              /* Existing static weight chips */
              <div className="mt-3 grid grid-cols-4 gap-2">
                {product.weights.map((w) => {
                  const fullPrice = product.price + w.price;
                  const active = size === w.size;
                  return (
                    <button
                      key={w.size}
                      onClick={() => setSize(w.size)}
                      className={`flex min-h-[64px] flex-col items-center justify-center rounded-2xl border-2 bg-white transition active:scale-95 ${
                        active
                          ? 'border-coral bg-coral-50 text-coral'
                          : 'border-ink-50 text-ink'
                      }`}
                    >
                      <span className="text-[13px] font-bold">{w.size}</span>
                      <span className="mt-0.5 text-[11px] font-semibold tabular opacity-70">
                        {formatINR(fullPrice)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Add-ons */}
          <section className="mt-7">
            <h3 className="font-display text-[15px] font-bold tracking-tight text-ink">Add-ons</h3>
            <div className="mt-3 space-y-1.5">
              {ADDONS.map((a) => {
                const active = !!addons[a.id];
                return (
                  <button
                    key={a.id}
                    onClick={() => setAddons((s) => ({ ...s, [a.id]: !s[a.id] }))}
                    className={`flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left transition active:scale-[.99] ${
                      active ? 'ring-2 ring-coral/40 bg-coral-50' : ''
                    }`}
                    style={{ boxShadow: '0 1px 2px rgba(26,19,17,.02), 0 4px 16px -10px rgba(26,19,17,.18)' }}
                  >
                    <div
                      className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg border-2 transition ${
                        active ? 'border-coral bg-coral' : 'border-ink-50 bg-white'
                      }`}
                    >
                      {active && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                    </div>
                    <span className="flex-1 text-[14px] font-bold text-ink">{a.name}</span>
                    <span className="text-[13.5px] font-extrabold text-ink tabular">
                      {formatINR(a.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Customise CTA */}
          <button
            onClick={() => go({ name: 'customize', productId: product.id })}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink-100 bg-cream py-3.5 text-[13.5px] font-bold text-ink transition active:scale-[.98]"
          >
            <Sparkles className="h-4 w-4" />
            Fully customize this cake
          </button>
        </div>

        {/* Reviews Section inside scroll container */}
        <div className="px-5 mt-6 pb-4">
      <section className="px-5 mt-6 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-[17px] font-bold text-ink">Reviews</h2>
          {!showReviewForm && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="rounded-xl bg-ink-50 px-3 py-1.5 text-[11px] font-bold text-ink"
            >
              + Write a review
            </button>
          )}
        </div>

        {/* Success message */}
        {reviewSuccess && (
          <div className="mb-3 flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-[12px] text-emerald-700 font-semibold">
            <CheckCircle2 className="h-4 w-4" />
            Review submitted! It'll appear after admin approval.
          </div>
        )}

        {/* Review form */}
        {showReviewForm && (
          <div className="mb-4 rounded-2xl bg-white p-4 space-y-3"
            style={{ boxShadow: '0 1px 2px rgba(26,19,17,.02), 0 8px 24px -16px rgba(26,19,17,.16)' }}>
            {/* Star rating */}
            <div>
              <div className="text-[11px] font-bold text-ink/50 mb-1">Rating</div>
              <div className="flex gap-1">
                {[1,2,3,4,5].map((s) => (
                  <button key={s} onClick={() => setReviewRating(s)}>
                    <Star className={`h-7 w-7 ${s <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-ink/20'}`} />
                  </button>
                ))}
              </div>
            </div>
            {/* Comment */}
            <textarea
              placeholder="Share your experience... How was the taste, design, delivery?"
              rows={3}
              maxLength={500}
              className="w-full resize-none rounded-xl border border-ink/10 bg-cream px-3 py-2.5 text-[13px] text-ink placeholder:text-ink/30 focus:border-coral focus:outline-none"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
            />
            {/* Photo upload */}
            <div>
              <div className="text-[11px] font-bold text-ink/50 mb-1">Add photo (optional)</div>
              {reviewImagePreview ? (
                <div className="relative w-20 h-20">
                  <img src={reviewImagePreview} alt="" className="w-20 h-20 rounded-xl object-cover" />
                  <button
                    onClick={() => { setReviewImageFile(null); setReviewImagePreview(''); }}
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-ink text-white flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-ink/20 bg-cream hover:border-coral">
                  <Camera className="h-6 w-6 text-ink-200" strokeWidth={1.5} />
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 2 * 1024 * 1024) { alert('Max 2MB'); return; }
                    setReviewImageFile(file);
                    const url = URL.createObjectURL(file);
                    setReviewImagePreview(url);
                  }} />
                </label>
              )}
            </div>
            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleSubmitReview}
                disabled={!reviewComment.trim() || submittingReview}
                className="flex-1 py-2.5 rounded-xl bg-coral text-white text-[13px] font-bold disabled:opacity-50"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
              <button
                onClick={() => setShowReviewForm(false)}
                className="px-4 py-2.5 rounded-xl bg-ink/5 text-ink/60 text-[13px] font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Approved reviews list */}
        {reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.slice(0, 5).map((r) => (
              <div key={r.id} className="rounded-2xl bg-white p-4"
                style={{ boxShadow: '0 1px 2px rgba(26,19,17,.02), 0 4px 12px -8px rgba(26,19,17,.12)' }}>
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-ink-50 font-bold text-ink text-[13px]">
                    {r.user_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="text-[12px] font-bold text-ink">{r.user_name}</div>
                      <div className="flex">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} className={`h-3 w-3 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-ink/15'}`} />
                        ))}
                      </div>
                    </div>
                    <div className="mt-1 text-[12px] text-ink/70 leading-relaxed">{r.comment}</div>
                    {r.image && (
                      <img src={r.image} alt="review" className="mt-2 h-24 w-24 rounded-xl object-cover" />
                    )}
                    <div className="mt-1.5 text-[10px] text-ink/30">
                      {new Date(r.created_at).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-[13px] text-ink/40">
            No reviews yet. Be the first!
          </div>
        )}
      </section>

        </div>
      </div>

      {/* Sticky floating controls at top — visible above image, with pointer-events-auto on each button */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 pt-5 pb-2 pointer-events-none">
        <button
          onClick={back}
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink transition active:scale-90"
          style={{ boxShadow: '0 8px 22px -10px rgba(26,19,17,.35)' }}
          aria-label="Back"
        >
          <ArrowLeft className="h-[20px] w-[20px]" strokeWidth={2.2} />
        </button>
        <div className="flex gap-2.5 pointer-events-auto">
          <button
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink transition active:scale-90"
            style={{ boxShadow: '0 8px 22px -10px rgba(26,19,17,.35)' }}
            aria-label="Share"
          >
            <Share2 className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
          <button
            onClick={() => toggleWish(product.id)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink transition active:scale-90"
            style={{ boxShadow: '0 8px 22px -10px rgba(26,19,17,.35)' }}
            aria-label="Wishlist"
          >
            <Heart
              className={`h-[19px] w-[19px] ${wished ? 'fill-coral text-coral' : ''}`}
              strokeWidth={2}
            />
          </button>
        </div>
      </div>

      {/* Sticky bottom CTA */}
      <div className="absolute right-0 bottom-0 left-0 z-30 border-t border-ink-50/80 bg-white/95 px-5 pt-3 pb-6 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div>
            <div className="text-[10px] font-bold tracking-wider text-ink-200 uppercase">
              Total
            </div>
            <div className="font-display text-[22px] font-bold text-coral tabular">
              {formatINR(total)}
            </div>
          </div>
          <button
            onClick={handleAdd}
            className="btn-primary ml-auto flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl text-[14px] font-bold tracking-tight"
          >
            <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={2.2} />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

function Trust({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-medium text-ink-200">
      <Icon className="h-3.5 w-3.5 text-ink-200" strokeWidth={2} />
      {label}
    </div>
  );
}
