import { useState, useEffect } from 'react'
import { useCartStore, useUIStore } from '@/lib/store'
import { useProducts } from '@/hooks/useProducts'
import { useReviews } from '@/hooks/useReviews'
import { useAuth } from '@/hooks/useAuth'
import { toBn, fmtPrice } from '@/lib/utils'
import { WEIGHT_OPTIONS } from '@/lib/data'
import type { Review } from '@/types'
import toast from 'react-hot-toast'

const CATEGORY_LABELS: Record<string, string> = {
  birthday: 'জন্মদিনের কেক', wedding: 'ওয়েডিং কেক', custom: 'কাস্টম', seasonal: 'সিজনাল',
}

export function QuickViewModal() {
  const { quickViewProduct, setQuickView, wishlist, toggleWishlist } = useUIStore()
  const { products } = useProducts()
  const addItem = useCartStore((s) => s.addItem)
  const { user } = useAuth()
  const [qty, setQty] = useState(1)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [selectedWeightIdx, setSelectedWeightIdx] = useState(1) // default 1kg
  const [activeTab, setActiveTab] = useState<'info' | 'reviews'>('info')
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [submittingReview, setSubmittingReview] = useState(false)

  const product = products.find((p) => p.id === quickViewProduct) ?? null
  const { reviews, saveReview, fetchReviews } = useReviews(product?.id)

  useEffect(() => {
    if (quickViewProduct) {
      setQty(1)
      setImgLoaded(false)
      setSelectedWeightIdx(1)
      setActiveTab('info')
      fetchReviews(quickViewProduct)
    }
  }, [quickViewProduct])

  if (!quickViewProduct || !product) return null

  const isWished = wishlist.includes(product.id)
  const selectedWeight = WEIGHT_OPTIONS[selectedWeightIdx]
  const effectivePrice = Math.round(product.price * selectedWeight.multiplier)

  const handleAdd = () => {
    addItem(product, qty, undefined, selectedWeight.label, effectivePrice)
    toast.success(`${product.name} (${selectedWeight.label}, x${toBn(qty)}) কার্টে যোগ হয়েছে! 🛒`)
    setQuickView(null)
  }

  const handleReviewSubmit = async () => {
    if (!user) { toast.error('রিভিউ দিতে প্রথমে লগইন করুন'); return }
    if (!reviewForm.comment.trim()) { toast.error('মন্তব্য লিখুন'); return }
    setSubmittingReview(true)
    try {
      const review: Review = {
        id: `rv-${Date.now()}`,
        product_id: product.id,
        user_id: user.id,
        user_name: user.name,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        approved: false,
        created_at: new Date().toISOString(),
      }
      await saveReview(review)
      setReviewForm({ rating: 5, comment: '' })
      toast.success('রিভিউ জমা হয়েছে! অনুমোদনের পর দেখাবে। ধন্যবাদ 🙏')
    } finally {
      setSubmittingReview(false)
    }
  }

  const stars = (r: number) => {
    const full = Math.floor(r)
    const half = r % 1 >= 0.5
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0))
  }

  return (
    <>
      <div className="fixed inset-0 z-[65] bg-black/70 backdrop-blur-sm" onClick={() => setQuickView(null)} />
      <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 pointer-events-none">
        <div className="relative bg-white dark:bg-slate-800 w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden animate-scale-in flex flex-col pointer-events-auto">
          <button onClick={() => setQuickView(null)}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 dark:bg-slate-700 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-lg">
            ✕
          </button>

          <div className="grid md:grid-cols-2 overflow-y-auto no-scrollbar">
            {/* Image */}
            <div className="relative aspect-square bg-rose-50 dark:bg-slate-700 flex-shrink-0">
              {!imgLoaded && <div className="absolute inset-0 skeleton" />}
              <img src={product.image} alt={product.name}
                className={`w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImgLoaded(true)}
                onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" fill="#fce7f3"><rect width="400" height="400"/><text x="200" y="220" text-anchor="middle" font-size="100">🎂</text></svg>'); setImgLoaded(true) }}
              />
              {product.tag && (
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xs font-bold shadow-md">
                  ✨ {product.tag}
                </span>
              )}
            </div>

            {/* Details */}
            <div className="p-6 md:p-8 flex flex-col overflow-y-auto">
              <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">
                {CATEGORY_LABELS[product.category] ?? product.category}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1 mb-2">{product.name}</h2>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-amber-400 text-sm">{stars(product.rating)}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {toBn(product.rating)} ({toBn(reviews.length > 0 ? reviews.length : product.reviews)} রিভিউ)
                </span>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 bg-gray-100 dark:bg-slate-700 rounded-xl p-1 mb-4">
                {(['info', 'reviews'] as const).map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-600 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
                    {tab === 'info' ? '📋 বিবরণ' : `⭐ রিভিউ (${toBn(reviews.length)})`}
                  </button>
                ))}
              </div>

              {activeTab === 'info' && (
                <>
                  {/* Weight selector */}
                  <div className="mb-4">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">⚖️ ওজন ও দাম:</p>
                    <div className="grid grid-cols-5 gap-1">
                      {WEIGHT_OPTIONS.map((w, i) => {
                        const p = Math.round(product.price * w.multiplier)
                        return (
                          <button key={i} onClick={() => setSelectedWeightIdx(i)}
                            className={`py-2 px-1 rounded-xl text-center border-2 transition-all ${selectedWeightIdx === i ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20' : 'border-gray-200 dark:border-slate-600 hover:border-rose-200'}`}>
                            <p className="text-[10px] font-bold dark:text-white">{w.label}</p>
                            <p className="text-[9px] text-rose-600 dark:text-rose-400 font-bold">{fmtPrice(p)}</p>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <p className="text-3xl font-black text-rose-600 dark:text-rose-400 mb-3">
                    {fmtPrice(effectivePrice)}
                    <span className="text-sm font-normal text-gray-400 ml-1">/{selectedWeight.label}</span>
                  </p>

                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">{product.description}</p>

                  {product.badges.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {product.badges.map((b, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold">{b}</span>
                      ))}
                    </div>
                  )}

                  {/* Qty */}
                  <div className="flex items-center gap-4 mb-5">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">পরিমাণ:</span>
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-700 rounded-xl p-1">
                      <button onClick={() => setQty(Math.max(1, qty - 1))}
                        className="w-9 h-9 rounded-lg bg-white dark:bg-slate-600 font-bold hover:bg-rose-50 dark:hover:bg-slate-500 transition-colors flex items-center justify-center dark:text-white">−</button>
                      <span className="w-10 text-center font-black text-base dark:text-white">{toBn(qty)}</span>
                      <button onClick={() => setQty(qty + 1)}
                        className="w-9 h-9 rounded-lg bg-white dark:bg-slate-600 font-bold hover:bg-rose-50 dark:hover:bg-slate-500 transition-colors flex items-center justify-center dark:text-white">+</button>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto font-bold">{fmtPrice(qty * effectivePrice)}</span>
                  </div>
                </>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-3 flex-1 overflow-y-auto max-h-52">
                  {reviews.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-3xl mb-2">⭐</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">এখনো কোনো রিভিউ নেই। প্রথম রিভিউ দিন!</p>
                    </div>
                  ) : reviews.map((r) => (
                    <div key={r.id} className="bg-gray-50 dark:bg-slate-700 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs dark:text-white">{r.user_name}</span>
                        <span className="text-amber-400 text-xs">{'★'.repeat(r.rating)}</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300">{r.comment}</p>
                    </div>
                  ))}

                  {/* Write review */}
                  <div className="border-t dark:border-slate-600 pt-3 mt-2">
                    <p className="text-xs font-bold dark:text-white mb-2">আপনার রিভিউ:</p>
                    <div className="flex gap-1 mb-2">
                      {[1,2,3,4,5].map((n) => (
                        <button key={n} onClick={() => setReviewForm({ ...reviewForm, rating: n })}
                          className={`text-xl transition-colors ${n <= reviewForm.rating ? 'text-amber-400' : 'text-gray-300'}`}>★</button>
                      ))}
                    </div>
                    <textarea
                      className="input resize-none text-xs"
                      rows={2}
                      placeholder="আপনার অভিজ্ঞতা লিখুন..."
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    />
                    <button onClick={handleReviewSubmit} disabled={submittingReview}
                      className="w-full mt-2 py-2 bg-rose-500 text-white text-xs font-bold rounded-xl hover:bg-rose-600 transition-colors disabled:opacity-50">
                      {submittingReview ? '⏳ জমা হচ্ছে...' : '📝 রিভিউ জমা দিন'}
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              {activeTab === 'info' && (
                <div className="flex gap-3 mt-auto flex-wrap">
                  <button onClick={handleAdd}
                    className="flex-1 min-w-[140px] py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-rose-500/30 transition-all btn-shine text-sm">
                    🛒 কার্টে যোগ ({fmtPrice(qty * effectivePrice)})
                  </button>
                  <button onClick={() => { toggleWishlist(product.id); toast.success(isWished ? 'ইচ্ছেতালিকা থেকে সরানো হয়েছে' : 'ইচ্ছেতালিকায় যোগ হয়েছে! ♥') }}
                    className={`px-5 py-3 rounded-xl font-bold border-2 transition-all text-sm ${isWished ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/30 text-rose-600' : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:border-rose-300'}`}>
                    {isWished ? '♥ সেভ' : '♡ সেভ'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
