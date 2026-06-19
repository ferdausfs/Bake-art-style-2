import { Hero } from '@/components/Hero'
import { SpecialOffers } from '@/components/SpecialOffers'
import { MenuSection } from '@/components/MenuSection'
import { GallerySection } from '@/components/GallerySection'
import { CustomCakeSection } from '@/components/CustomCakeSection'
import { AboutSection } from '@/components/AboutSection'
import { QuickViewModal } from '@/components/QuickViewModal'

const TESTIMONIALS = [
  { name: 'সাদিয়া আফরিন', role: 'রেগুলার কাস্টমার', text: 'কেকের স্বাদ অসাধারণ! সবাই প্রশংসা করেছে। ডেলিভারিও সময়মতো পেয়েছি।', rating: 5, avatar: '👩‍💼' },
  { name: 'তানভীর আহমেদ', role: 'কর্পোরেট ক্লায়েন্ট', text: 'কাস্টমাইজড কেক যেমন চেয়েছিলাম ঠিক তেমন হয়েছে। স্পঞ্জ সফট, ফ্রস্টিং পারফেক্ট। হাইলি রেকমেন্ডেড!', rating: 5, avatar: '👨‍💼' },
  { name: 'নুসরাত জাহান', role: 'ভোজনরসিক', text: 'মিক্সড বেরি চিজকেক জীবনের সেরা! মুখে দিলেই মিলিয়ে যায়। প্যাকেজিংও প্রিমিয়াম।', rating: 5, avatar: '🧕' },
]

function ReviewsSection() {
  return (
    <section id="reviews" className="py-20 bg-rose-50/40 dark:bg-slate-900/50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <span className="font-script text-xl font-bold text-rose-500 dark:text-rose-400">Sweet Words</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mt-1 mb-2">গ্রাহকদের মিষ্টি অনুভূতি</h2>
          <div className="section-divider" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 p-7 rounded-3xl shadow-sm border border-rose-50 dark:border-slate-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative group">
              <span className="absolute top-5 right-5 text-5xl text-rose-100 dark:text-rose-900/30 font-serif select-none pointer-events-none">"</span>
              <div className="flex gap-1 text-amber-400 mb-3">{'★'.repeat(t.rating)}</div>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed italic relative z-10">"{t.text}"</p>
              <div className="flex items-center gap-3 mt-5 pt-3 border-t border-gray-50 dark:border-slate-700">
                <div className="w-9 h-9 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-lg">{t.avatar}</div>
                <div>
                  <h4 className="font-bold text-xs dark:text-white">{t.name}</h4>
                  <p className="text-[10px] text-rose-600 dark:text-rose-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function HomePage() {
  return (
    <>
      <Hero />
      <SpecialOffers />
      <MenuSection />
      <GallerySection />
      <CustomCakeSection />
      <AboutSection />
      <ReviewsSection />
      <QuickViewModal />
    </>
  )
}
