import { useState } from 'react'
import { useCartStore, useUIStore } from '@/lib/store'
import { CAKE_FLAVORS, CAKE_WEIGHTS } from '@/lib/data'
import { toBn, fmtPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

const MESSAGE_IDEAS = [
  'Happy Birthday 🎂', 'শুভ জন্মদিন 💖', 'Happy Anniversary ❤️',
  'Congratulations! 🎉', 'I Love You 💕', 'Best Wishes ✨',
]

export function CustomCakeSection() {
  const [flavor, setFlavor] = useState(CAKE_FLAVORS[0])
  const [weight, setWeight] = useState(CAKE_WEIGHTS[1])
  const [message, setMessage] = useState('')
  const [step, setStep] = useState(1)
  const addItem = useCartStore((s) => s.addItem)
  const setCheckoutOpen = useUIStore((s) => s.setCheckoutOpen)

  const total = weight.price + flavor.price

  const handleAdd = () => {
    addItem({
      id: `custom-${flavor.id}-${weight.id}-${Date.now()}`,
      name: `কাস্টম: ${flavor.name} কেক${message ? ` ("${message}")` : ''}`,
      category: 'custom',
      price: total,
      rating: 5,
      reviews: 0,
      tag: 'কাস্টম',
      weight: weight.name,
      image: 'https://images.pexels.com/photos/19651268/pexels-photo-19651268.jpeg?auto=compress&cs=tinysrgb&w=600',
      description: `${flavor.name} ফ্লেভার, ${weight.name}`,
      approved: true,
      badges: ['হালাল ✓', 'Custom'],
    }, 1, message || undefined)
    toast.success('কাস্টম কেক কার্টে যোগ হয়েছে! 🎂')
    setMessage('')
    setStep(1)
  }

  return (
    <section id="custom" className="py-20 relative overflow-hidden bg-gradient-to-br from-rose-50 via-pink-50/60 to-purple-50/40 dark:from-slate-950 dark:via-rose-950/20 dark:to-purple-950/10">
      {/* BG blobs */}
      <div className="absolute top-10 right-0 w-80 h-80 bg-pink-200/30 dark:bg-pink-900/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-64 h-64 bg-violet-200/30 dark:bg-violet-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl mx-auto px-4 relative">
        <div className="text-center mb-12">
          <span className="section-label">✨ কাস্টম অর্ডার</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mt-3 mb-2">নিজের মতো কেক বানান</h2>
          <div className="section-divider" />
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-4">ফ্লেভার ও সাইজ বেছে নিন, আমরা বাকিটা করব।</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {[1, 2, 3].map((s, i) => (
            <div key={s} className="flex items-center">
              <button onClick={() => s < step && setStep(s)}
                className={`w-8 h-8 rounded-full text-xs font-black flex items-center justify-center transition-all ${
                  step === s ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 scale-110'
                  : s < step ? 'bg-rose-200 dark:bg-rose-800 text-rose-700 dark:text-rose-200 cursor-pointer'
                  : 'bg-gray-200 dark:bg-slate-700 text-gray-400'
                }`}>
                {s < step ? '✓' : toBn(s)}
              </button>
              {i < 2 && <div className={`w-12 sm:w-20 h-0.5 transition-all ${s < step ? 'bg-rose-400' : 'bg-gray-200 dark:bg-slate-700'}`} />}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-8 px-1">
          <span className={step >= 1 ? 'text-rose-500' : ''}>ফ্লেভার</span>
          <span className={step >= 2 ? 'text-rose-500' : ''}>সাইজ ও মেসেজ</span>
          <span className={step >= 3 ? 'text-rose-500' : ''}>কনফার্ম</span>
        </div>

        <div className="card p-6 sm:p-8 shadow-xl shadow-rose-500/5">
          {/* Step 1: Flavor */}
          {step === 1 && (
            <div className="animate-fade-in-up space-y-6">
              <h3 className="font-bold text-base dark:text-white flex items-center gap-2">🍰 ফ্লেভার বেছে নিন</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CAKE_FLAVORS.map((f) => (
                  <button key={f.id} onClick={() => setFlavor(f)}
                    className={`group relative p-4 rounded-2xl text-center transition-all duration-200 border-2 ${
                      flavor.id === f.id
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/30 shadow-lg shadow-rose-500/20 scale-105'
                        : 'border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 hover:border-rose-200 dark:hover:border-rose-800'
                    }`}>
                    {flavor.id === f.id && <span className="absolute top-2 right-2 text-[10px] text-rose-500">✓</span>}
                    <div className="text-3xl mb-2">{f.emoji}</div>
                    <div className="text-xs font-bold dark:text-white">{f.name}</div>
                    {f.price > 0 && <div className="text-[10px] text-rose-500 font-bold mt-0.5">+{fmtPrice(f.price)}</div>}
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(2)}
                className="w-full btn-primary py-3 btn-shine justify-center">
                পরের ধাপ →
              </button>
            </div>
          )}

          {/* Step 2: Weight + Message */}
          {step === 2 && (
            <div className="animate-fade-in-up space-y-6">
              <div>
                <h3 className="font-bold text-base dark:text-white flex items-center gap-2 mb-4">⚖️ সাইজ বেছে নিন</h3>
                <div className="grid grid-cols-3 gap-2">
                  {CAKE_WEIGHTS.map((w) => (
                    <button key={w.id} onClick={() => setWeight(w)}
                      className={`p-3 rounded-xl text-center transition-all border-2 ${
                        weight.id === w.id
                          ? 'border-rose-500 bg-rose-500 text-white shadow-md shadow-rose-500/25'
                          : 'border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 hover:border-rose-200 dark:text-white'
                      }`}>
                      <div className="text-xs font-bold">{w.name}</div>
                      <div className={`text-[10px] font-bold ${weight.id === w.id ? 'text-white/80' : 'text-rose-500'}`}>{fmtPrice(w.price)}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-base dark:text-white flex items-center gap-2 mb-3">💬 কেকে লেখা <span className="text-xs font-normal text-gray-400">(ঐচ্ছিক)</span></h3>
                <input className="input mb-2" maxLength={50}
                  placeholder="যেমন: Happy Birthday Rafi 🎂"
                  value={message} onChange={(e) => setMessage(e.target.value)} />
                {message && <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">{toBn(message.length)}/৫০ অক্ষর</p>}
                <div className="flex flex-wrap gap-1.5">
                  {MESSAGE_IDEAS.map((idea) => (
                    <button key={idea} onClick={() => setMessage(idea)}
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/30 hover:bg-rose-100 transition-colors">
                      {idea}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="px-5 py-3 rounded-full border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 text-sm font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                  ← আগে
                </button>
                <button onClick={() => setStep(3)} className="flex-1 btn-primary py-3 btn-shine justify-center">
                  পর্যালোচনা করুন →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div className="animate-fade-in-up space-y-5">
              <h3 className="font-bold text-base dark:text-white">✅ অর্ডার পর্যালোচনা</h3>

              <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/10 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-rose-100 dark:border-rose-800/30">
                  <span className="text-3xl">{flavor.emoji}</span>
                  <div>
                    <p className="font-bold dark:text-white">{flavor.name} কেক</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{weight.name}</p>
                  </div>
                </div>
                {message && (
                  <div className="flex items-center gap-2 text-sm dark:text-gray-300">
                    <span>✍️</span>
                    <span className="italic">"{message}"</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400">মোট মূল্য</span>
                  <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{fmtPrice(total)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button onClick={handleAdd} className="w-full btn-primary py-3 btn-shine justify-center text-base">
                  🛒 কার্টে যোগ করুন
                </button>
                <button onClick={() => { handleAdd(); setCheckoutOpen(true) }}
                  className="w-full py-3 rounded-full border-2 border-rose-400 dark:border-rose-600 text-rose-600 dark:text-rose-400 text-sm font-bold hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                  ⚡ সরাসরি অর্ডার করুন
                </button>
                <button onClick={() => setStep(2)}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors py-1">
                  ← পরিবর্তন করুন
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
