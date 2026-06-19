import { useEffect, useState } from 'react'
import { useGallery } from '@/hooks/useGallery'
import { useUIStore } from '@/lib/store'

export function GallerySection() {
  const { gallery, fetchGallery } = useGallery()
  const { setQuickView } = useUIStore()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  useEffect(() => { fetchGallery() }, [fetchGallery])

  // Use default showcase items if no gallery items saved
  const displayItems = gallery.length > 0 ? gallery : [
    { id: 'd1', image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=600', caption: 'চকোলেট ড্রিম কেক', product_id: 'p1', created_at: '' },
    { id: 'd2', image: 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg?auto=compress&cs=tinysrgb&w=600', caption: 'স্ট্রবেরি ক্রিম কেক', product_id: 'p2', created_at: '' },
    { id: 'd3', image: 'https://images.pexels.com/photos/4110004/pexels-photo-4110004.jpeg?auto=compress&cs=tinysrgb&w=600', caption: 'রেড ভেলভেট', product_id: 'p3', created_at: '' },
    { id: 'd4', image: 'https://images.pexels.com/photos/2144200/pexels-photo-2144200.jpeg?auto=compress&cs=tinysrgb&w=600', caption: 'ব্ল্যাক ফরেস্ট', product_id: 'p5', created_at: '' },
    { id: 'd5', image: 'https://images.pexels.com/photos/5718025/pexels-photo-5718025.jpeg?auto=compress&cs=tinysrgb&w=600', caption: 'ম্যাঙ্গো মুস', product_id: 'p4', created_at: '' },
    { id: 'd6', image: 'https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg?auto=compress&cs=tinysrgb&w=600', caption: 'বাটারস্কচ ক্রাঞ্চ', product_id: 'p6', created_at: '' },
  ]

  return (
    <section id="gallery" className="py-20 bg-white dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <span className="section-label">Our Portfolio</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mt-1 mb-2">
            আমাদের কাজের <span className="text-rose-500">গ্যালারি</span>
          </h2>
          <div className="section-divider" />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">প্রতিটি কেক ভালোবাসা দিয়ে তৈরি 🍰</p>
        </div>

        {/* Masonry Grid */}
        <div className="columns-2 sm:columns-3 gap-4 space-y-4">
          {displayItems.map((item, i) => (
            <div
              key={item.id}
              className="break-inside-avoid relative overflow-hidden rounded-2xl group cursor-pointer"
              style={{ marginBottom: '1rem' }}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => item.product_id && setQuickView(item.product_id)}
            >
              <img
                src={item.image}
                alt={item.caption}
                className={`w-full object-cover rounded-2xl transition-transform duration-500 ${
                  i % 3 === 0 ? 'aspect-square' : i % 3 === 1 ? 'aspect-[3/4]' : 'aspect-[4/3]'
                } group-hover:scale-105`}
                loading="lazy"
              />
              {/* Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent rounded-2xl transition-opacity duration-300 flex flex-col justify-end p-3 ${
                hoveredId === item.id ? 'opacity-100' : 'opacity-0'
              }`}>
                <p className="text-white font-bold text-sm leading-tight">{item.caption}</p>
                {item.product_id && (
                  <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-rose-300">
                    <span>👁</span> দেখুন
                  </span>
                )}
              </div>

              {/* Always-visible caption on mobile */}
              <div className="sm:hidden absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent rounded-b-2xl p-2">
                <p className="text-white text-xs font-bold truncate">{item.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
