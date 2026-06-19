import { useState, useMemo } from 'react'
import { useProducts } from '@/hooks/useProducts'
import { ProductCard } from './ProductCard'
import { CATEGORIES } from '@/lib/data'

export function MenuSection() {
  const { products, loading } = useProducts()
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')

  const visible = useMemo(() => {
    let list = products.filter((p) => p.approved)
    if (activeCategory !== 'all') list = list.filter((p) => p.category === activeCategory)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
    }
    return list
  }, [products, activeCategory, search])

  return (
    <section id="menu" className="py-20 bg-white dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="section-label">🧁 Fresh &amp; Delicious</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mt-3 mb-2">আমাদের কেক মেনু</h2>
          <div className="section-divider" />
          <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto text-sm mt-4">প্রতিটি কেক তাজা উপকরণ দিয়ে হাতে তৈরি। আপনার পছন্দের কেকটি বেছে নিন।</p>
        </div>

        {/* Search */}
        <div className="max-w-sm mx-auto mb-6">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="কেক খুঁজুন..." className="input pl-9" />
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-8 justify-center">
          {CATEGORIES.map((cat) => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800'
              }`}>
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton rounded-2xl h-72" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-gray-400 dark:text-gray-500">কোনো কেক পাওয়া যায়নি</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visible.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </section>
  )
}
