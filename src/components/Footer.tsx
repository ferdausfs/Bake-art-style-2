import { useUIStore, useSettingsStore } from '@/lib/store'

export function Footer() {
  const { setTrackingOpen } = useUIStore()
  const settings = useSettingsStore((s) => s.settings)
  const WA = settings.whatsappNumber

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-rose-950 text-white pt-14 pb-8 border-t-4 border-rose-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-10 border-b border-white/10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🎂</span>
              <h2 className="text-xl font-bold">বেক আর্ট স্টাইল</h2>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed mb-5">
              কুমিল্লার হাট বলি বাড়ির হোমমেড বেকারি। ১০০% তাজা ও খাঁটি কেক, ডেলিভারি সার্ভিস।
            </p>
            <div className="flex gap-3">
              <a href="https://www.tiktok.com/@bakeartstyel" target="_blank" rel="noopener"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-rose-500 hover:scale-110 flex items-center justify-center text-xs font-bold transition-all">TT</a>
              <a href={`https://wa.me/${WA}`} target="_blank" rel="noopener"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-green-500 hover:scale-110 flex items-center justify-center text-xs font-bold transition-all">WA</a>
              <a href={`tel:+${WA}`}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-rose-500 hover:scale-110 flex items-center justify-center text-xs font-bold transition-all">📞</a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-4">প্রয়োজনীয় লিংক</h3>
            <ul className="flex flex-col gap-2 text-xs text-gray-300">
              {[['হোম','#hero'],['মেন্যু','#menu'],['গ্যালারি','#gallery'],['কাস্টম কেক','#custom'],['রিভিউ','#reviews'],['যোগাযোগ','#contact']].map(([n,h]) => (
                <li key={n}><a href={h} className="hover:text-rose-400 transition-colors">{n}</a></li>
              ))}
              <li>
                <button onClick={() => setTrackingOpen(true)} className="hover:text-purple-400 transition-colors text-left">
                  📦 অর্ডার ট্র্যাক করুন
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div id="contact">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-4">যোগাযোগ</h3>
            <ul className="flex flex-col gap-2 text-xs text-gray-300">
              <li>📍 হাট বলি বাড়ি, কুমিল্লা</li>
              <li><a href={`tel:+${WA}`} className="hover:text-rose-400 transition-colors">📞 +880 1764-411168</a></li>
              <li><a href={`https://wa.me/${WA}`} target="_blank" rel="noopener" className="hover:text-green-400 transition-colors">💬 WhatsApp: +880 1764-411168</a></li>
              <li>⏰ সর্বদা উন্মুক্ত</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 text-center text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} বেক আর্ট স্টাইল। সর্বস্বত্ব সংরক্ষিত।</p>
          <a href={`tel:+${WA}`} className="hover:text-white transition-colors">হাট বলি বাড়ি, কুমিল্লা — +880 1764-411168</a>
        </div>
      </div>
    </footer>
  )
}
