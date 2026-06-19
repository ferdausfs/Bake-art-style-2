import { useState } from 'react'
import { useCartStore, useUIStore } from '@/lib/store'
import { toBn, fmtPrice } from '@/lib/utils'
import type { Product } from '@/types'
import toast from 'react-hot-toast'

interface Props { product: Product }

export function ProductCard({ product }: Props) {
  const [imgErr, setImgErr] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const { setQuickView, wishlist, toggleWishlist } = useUIStore()

  const isWished = wishlist.includes(product.id)

  const handleAdd = () => {
    addItem(product)
    toast.success(`${product.name} কার্টে যোগ হয়েছে! 🛒`)
  }

  const handleWish = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleWishlist(product.id)
    toast.success(isWished ? 'ইচ্ছেতালিকা থেকে সরানো হয়েছে' : 'ইচ্ছেতালিকায় যোগ হয়েছে! ♥')
  }

  return (
    <div className="card overflow-hidden group hover:shadow-xl hover:shadow-rose-500/10 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up">
      {/* Image */}
      <div className="relative overflow-hidden h-52 bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30">
        {!loaded && !imgErr && <div className="absolute inset-0 skeleton" />}
        {!imgErr ? (
          <img src={product.image} alt={product.name}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setLoaded(true)}
            onError={() => { setImgErr(true); setLoaded(true) }}
            loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">🎂</div>
        )}

        {/* Tag */}
        {product.tag && (
          <div className="absolute top-3 left-3">
            <span className={`px-2.5 py-1 rounded-lg backdrop-blur text-[10px] font-bold shadow-md ${product.tag === 'বেস্টসেলার' ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white' : 'bg-white/95 dark:bg-slate-800/95 text-rose-600 dark:text-rose-400'}`}>
              ✨ {product.tag}
            </span>
          </div>
        )}

        {/* Wishlist heart */}
        <button onClick={handleWish}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md transition-all backdrop-blur border ${isWished ? 'bg-rose-500 text-white border-rose-500 scale-110' : 'bg-white/90 dark:bg-slate-800/90 text-gray-400 dark:text-gray-500 border-white/50 hover:text-rose-500 hover:scale-110'}`}>
          {isWished ? '♥' : '♡'}
        </button>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4 gap-3">
          <button onClick={() => setQuickView(product.id)}
            className="px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 text-gray-800 dark:text-white text-xs font-bold shadow-lg hover:scale-105 transition-transform">
            👁️ দ্রুত দেখুন
          </button>
          <button onClick={handleAdd}
            className="px-3 py-1.5 rounded-full bg-rose-500 text-white text-xs font-bold shadow-lg hover:scale-105 transition-transform">
            🛒 যোগ করুন
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {product.badges.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {product.badges.map((b, i) => (
              <span key={i} className="px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold">{b}</span>
            ))}
          </div>
        )}

        <h3 className="font-bold text-gray-800 dark:text-white text-sm mb-1 line-clamp-1">{product.name}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{product.description}</p>

        <div className="flex items-center gap-2 mb-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="text-amber-500">★</span>
          <span>{toBn(product.rating)} ({toBn(product.reviews)})</span>
          <span>•</span>
          <span>⚖️ {product.weight}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">মূল্য</p>
            <p className="text-lg font-black text-rose-600 dark:text-rose-400">{fmtPrice(product.price)}</p>
          </div>
          <button onClick={handleAdd}
            className="flex-1 min-w-[110px] max-w-[140px] py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-rose-500/30 transition-all btn-shine text-xs">
            🛒 যোগ করুন
          </button>
        </div>
      </div>
    </div>
  )
}
