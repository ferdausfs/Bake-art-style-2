export function AboutSection() {
  const feats = [
    '১০০% খাঁটি ও তাজা উপাদান',
    'স্বাস্থ্যসম্মত ও হালাল পরিবেশ',
    'দক্ষ হোম বেকার',
    'দ্রুত ডোরস্টেপ ডেলিভারি',
  ]

  const imgs = [
    { src: 'https://images.pexels.com/photos/3983571/pexels-photo-3983571.jpeg?auto=compress&cs=tinysrgb&w=600', alt: 'Baking' },
    { src: 'https://images.pexels.com/photos/3983580/pexels-photo-3983580.jpeg?auto=compress&cs=tinysrgb&w=600', alt: 'Red Velvet' },
    { src: 'https://images.pexels.com/photos/19498995/pexels-photo-19498995.jpeg?auto=compress&cs=tinysrgb&w=600', alt: 'Pastry' },
    { src: 'https://images.pexels.com/photos/8478055/pexels-photo-8478055.jpeg?auto=compress&cs=tinysrgb&w=600', alt: 'Black Forest' },
  ]

  return (
    <section id="about" className="py-20 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Photo grid */}
          <div className="relative grid grid-cols-2 gap-3 sm:gap-4">
            <div className="flex flex-col gap-3 sm:gap-4 mt-8">
              <div className="rounded-2xl overflow-hidden shadow-md aspect-square">
                <img src={imgs[0].src} alt={imgs[0].alt} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
              </div>
              <div className="rounded-2xl overflow-hidden shadow-md aspect-[4/3]">
                <img src={imgs[2].src} alt={imgs[2].alt} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="rounded-2xl overflow-hidden shadow-md aspect-[4/3]">
                <img src={imgs[1].src} alt={imgs[1].alt} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
              </div>
              <div className="rounded-2xl overflow-hidden shadow-md aspect-square">
                <img src={imgs[3].src} alt={imgs[3].alt} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
              </div>
            </div>
            {/* Center badge */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/95 dark:bg-slate-800/95 backdrop-blur p-4 rounded-full shadow-2xl text-center w-28 h-28 sm:w-32 sm:h-32 flex flex-col items-center justify-center border-2 border-rose-100 dark:border-rose-900/50">
              <span className="text-xl sm:text-2xl font-bold text-rose-600">২৪/৭</span>
              <span className="text-[10px] sm:text-xs font-bold text-gray-800 dark:text-white mt-1">সেবায় নিবেদিত</span>
            </div>
          </div>

          {/* Text */}
          <div>
            <span className="font-script text-xl font-bold text-rose-500 dark:text-rose-400">Our Story</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mt-1 mb-5">
              আমাদের গল্প ও অঙ্গীকার
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-7 text-sm sm:text-base">
              কুমিল্লার হাট বলি বাড়িতে অবস্থিত <strong className="text-gray-900 dark:text-white">"বেক আর্ট স্টাইল"</strong> — তাজা উপাদান ও পরিচ্ছন্ন পরিবেশে তৈরি প্রতিটি কেক। ডেলিভারি সার্ভিসে পৌঁছে দিই স্বাদ আপনার দরজায়। পরিবার ও বন্ধুদের প্রতিটি বিশেষ মুহূর্তকে আরও মধুর করে তুলতে আমরা অঙ্গীকারবদ্ধ।
            </p>
            <div className="flex flex-col gap-3.5">
              {feats.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                  <span className="font-bold text-sm text-gray-900 dark:text-white">{f}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#menu" className="btn-primary btn-shine text-sm">🧁 মেন্যু দেখুন</a>
              <a href="https://wa.me/8801764411168" target="_blank" rel="noopener"
                className="px-5 py-2.5 rounded-full border border-gray-200 dark:border-slate-700 text-sm font-bold text-gray-700 dark:text-gray-300 hover:border-rose-300 dark:hover:border-rose-700 transition-colors">
                💬 যোগাযোগ করুন
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
