import { useState, useRef } from 'react'
import { useCartStore, useUIStore, useSettingsStore, useAuthStore, useLocationStore } from '@/lib/store'
import { useOrders } from '@/hooks/useOrders'
import { toBn, fmtPrice, isValidPhone, genOrderId, waLink, fileToBase64 } from '@/lib/utils'
import type { Order } from '@/types'
import toast from 'react-hot-toast'

const STEPS = ['তথ্য দিন', 'পেমেন্ট', 'কনফার্ম']

export function CheckoutModal() {
  const { items, total, clearCart } = useCartStore()
  const { checkoutOpen, setCheckoutOpen, promoDiscount, clearPromo, setTrackingOpen } = useUIStore()
  const settings = useSettingsStore((s) => s.settings)
  const { saveOrder } = useOrders()
  const user = useAuthStore((s) => s.user)
  const { customerDistrict, customerLat, customerLng, locationVerified } = useLocationStore()

  const [step, setStep] = useState(0)
  const [orderId, setOrderId] = useState('')
  const [promoInput, setPromoInput] = useState('')
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [screenshotLoading, setScreenshotLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [info, setInfo] = useState(() => ({
    name: user?.name || '',
    phone: '',
    address: '',
    date: '',
    time: 'সকাল ১০টা - দুপুর ১টা',
    payment: 'cod' as Order['payment_method'],
  }))

  const subtotal = total()
  const discount = Math.round(subtotal * promoDiscount / 100)
  const grandTotal = subtotal - discount + settings.deliveryFee

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase()
    // Check coupons list first
    if (settings.coupons && settings.coupons.length > 0) {
      const coupon = settings.coupons.find(
        (c) => c.active && c.code.toUpperCase() === code &&
          (c.maxUses === 0 || c.usedCount < c.maxUses) &&
          (!c.expiresAt || new Date(c.expiresAt) > new Date())
      )
      if (coupon) {
        useUIStore.getState().applyPromo(coupon.discount)
        toast.success(`${toBn(coupon.discount)}% ছাড় যুক্ত হলো! 🎉`)
        return
      }
    }
    // Fallback single promo code
    if (code === settings.promoCode.toUpperCase() && settings.promoEnabled) {
      useUIStore.getState().applyPromo(settings.promoPercent)
      toast.success(`${toBn(settings.promoPercent)}% ছাড় যুক্ত হলো! 🎉`)
    } else {
      toast.error('অকার্যকর প্রোমো কোড!')
    }
  }

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('শুধু ছবি আপলোড করুন!'); return }
    setScreenshotLoading(true)
    try {
      const b64 = await fileToBase64(file)
      setScreenshot(b64)
      toast.success('স্ক্রিনশট আপলোড হয়েছে!')
    } catch {
      toast.error('আপলোড ব্যর্থ হয়েছে!')
    } finally {
      setScreenshotLoading(false)
    }
  }

  const next = () => {
    if (step === 0) {
      if (!info.name || !info.phone || !info.address || !info.date) {
        toast.error('সকল তথ্য পূরণ করুন!')
        return
      }
      if (!isValidPhone(info.phone)) {
        toast.error('সঠিক মোবাইল নম্বর দিন! (যেমন: 01712345678)')
        return
      }
      setStep(1)
    } else if (step === 1) {
      if ((info.payment === 'bkash' || info.payment === 'nagad') && !screenshot) {
        toast.error('পেমেন্ট স্ক্রিনশট আপলোড করুন!')
        return
      }
      const oid = genOrderId()
      setOrderId(oid)

      const order: Order = {
        id: oid,
        customer_name: info.name,
        customer_phone: info.phone,
        customer_address: info.address,
        delivery_date: info.date,
        delivery_time: info.time,
        payment_method: info.payment,
        payment_screenshot: screenshot ?? undefined,
        items: items.map((i) => ({
          product_id: i.id,
          name: i.name + (i.selected_weight ? ` (${i.selected_weight})` : ''),
          price: i.price,
          quantity: i.quantity,
          cake_message: i.cake_message,
          selected_weight: i.selected_weight,
        })),
        subtotal,
        discount,
        delivery_fee: settings.deliveryFee,
        total: grandTotal,
        status: 'pending',
        promo_code: promoDiscount > 0 ? settings.promoCode : undefined,
        created_at: new Date().toISOString(),
        district: customerDistrict,
        gps_lat: customerLat,
        gps_lng: customerLng,
        location_verified: locationVerified,
      }

      saveOrder(order)

      const payLabel = info.payment === 'cod' ? 'ক্যাশ অন ডেলিভারি'
        : info.payment === 'bkash' ? 'বিকাশ' : 'নগদ'

      const waMsg =
        `🎂 নতুন অর্ডার!\n\n` +
        `📋 ID: ${oid}\n👤 নাম: ${info.name}\n📞 ফোন: ${info.phone}\n` +
        `📍 ঠিকানা: ${info.address}\n📅 ডেলিভারি: ${info.date} (${info.time})\n` +
        `💰 মোট: ${grandTotal}৳ (${payLabel})\n` +
        (screenshot ? `📸 পেমেন্ট স্ক্রিনশট দেওয়া হয়েছে\n` : '') +
        `\n🛒 আইটেম:\n${items.map((c) => `• ${c.name}${c.selected_weight ? ` (${c.selected_weight})` : ''} x${c.quantity} = ${c.price * c.quantity}৳`).join('\n')}\n\n🙏 বেক আর্ট স্টাইল`

      window.open(waLink(settings.whatsappNumber, waMsg), '_blank')
      clearCart()
      clearPromo()
      setStep(2)
    }
  }

  const close = () => {
    setCheckoutOpen(false)
    setStep(0)
    setPromoInput('')
    setScreenshot(null)
  }

  if (!checkoutOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={close} />
      <div className="fixed inset-x-4 bottom-4 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md z-50 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b dark:border-slate-700 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20">
          <div>
            <h2 className="font-bold text-lg dark:text-white">অর্ডার করুন</h2>
            {step < 2 && (
              <div className="flex gap-2 mt-1">
                {STEPS.map((s, i) => (
                  <div key={i} className={`flex items-center gap-1 text-xs ${i <= step ? 'text-rose-600 font-bold' : 'text-gray-400'}`}>
                    <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${i <= step ? 'bg-rose-500 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-500'}`}>{i + 1}</span>
                    {s}
                    {i < STEPS.length - 1 && <span className="text-gray-300">›</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={close} className="w-8 h-8 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800 flex items-center justify-center text-gray-500 dark:text-gray-400">✕</button>
        </div>

        <div className="p-5 max-h-[65vh] overflow-y-auto">
          {/* Step 0: Info */}
          {step === 0 && (
            <div className="space-y-3">
              <input className="input" placeholder="আপনার নাম *" value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} />
              <input className="input" placeholder="মোবাইল নম্বর * (01XXXXXXXXX)" value={info.phone} onChange={(e) => setInfo({ ...info, phone: e.target.value })} type="tel" />
              <textarea className="input resize-none" rows={2} placeholder="ডেলিভারি ঠিকানা *" value={info.address} onChange={(e) => setInfo({ ...info, address: e.target.value })} />
              <input className="input" type="date" value={info.date} min={new Date().toISOString().split('T')[0]} onChange={(e) => setInfo({ ...info, date: e.target.value })} />
              <select className="input" value={info.time} onChange={(e) => setInfo({ ...info, time: e.target.value })}>
                {['সকাল ১০টা - দুপুর ১টা', 'দুপুর ১টা - বিকেল ৪টা', 'বিকেল ৪টা - সন্ধ্যা ৭টা'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {/* Promo */}
              {settings.promoEnabled && (
                <div className="flex gap-2">
                  <input className="input flex-1" placeholder="প্রোমো কোড" value={promoInput} onChange={(e) => setPromoInput(e.target.value)} />
                  <button onClick={applyPromo} className="px-4 py-2 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-sm font-bold rounded-xl hover:bg-rose-200 transition-colors">প্রয়োগ</button>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Payment */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="font-bold text-sm dark:text-white mb-3">পেমেন্ট পদ্ধতি বেছে নিন</p>
              {[
                { id: 'cod', label: 'ক্যাশ অন ডেলিভারি', icon: '💵', note: 'ডেলিভারির সময় দিন' },
                { id: 'bkash', label: 'বিকাশ', icon: '📱', note: settings.bkashNumber },
                { id: 'nagad', label: 'নগদ', icon: '💳', note: settings.nagadNumber },
              ].map((pm) => (
                <div key={pm.id}>
                  <button
                    onClick={() => setInfo({ ...info, payment: pm.id as Order['payment_method'] })}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${info.payment === pm.id ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20' : 'border-gray-200 dark:border-slate-700 hover:border-rose-200'}`}>
                    <span className="text-2xl">{pm.icon}</span>
                    <div className="text-left flex-1">
                      <p className="font-bold text-sm dark:text-white">{pm.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{pm.note}</p>
                    </div>
                    {info.payment === pm.id && <span className="text-rose-500">✓</span>}
                  </button>

                  {/* Screenshot upload for bkash/nagad */}
                  {info.payment === pm.id && (pm.id === 'bkash' || pm.id === 'nagad') && (
                    <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                      <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-2">
                        📱 {pm.note} নম্বরে পাঠান → স্ক্রিনশট আপলোড করুন
                      </p>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleScreenshotUpload}
                      />
                      {screenshot ? (
                        <div className="relative">
                          <img src={screenshot} alt="screenshot" className="w-full max-h-32 object-contain rounded-xl border border-amber-200" />
                          <button
                            onClick={() => setScreenshot(null)}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                          >✕</button>
                          <p className="text-[10px] text-green-600 dark:text-green-400 mt-1 text-center font-bold">✅ স্ক্রিনশট আপলোড হয়েছে</p>
                        </div>
                      ) : (
                        <button
                          onClick={() => fileRef.current?.click()}
                          disabled={screenshotLoading}
                          className="w-full py-2.5 border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-xl text-xs text-amber-700 dark:text-amber-400 font-bold hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                        >
                          {screenshotLoading ? '⏳ আপলোড হচ্ছে...' : '📸 স্ক্রিনশট আপলোড করুন *'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Summary */}
              <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-3 space-y-1 mt-4">
                <div className="flex justify-between text-xs dark:text-gray-300"><span>সাবটোটাল</span><span>{fmtPrice(subtotal)}</span></div>
                {discount > 0 && <div className="flex justify-between text-xs text-green-600 dark:text-green-400"><span>ছাড়</span><span>−{fmtPrice(discount)}</span></div>}
                <div className="flex justify-between text-xs dark:text-gray-300"><span>ডেলিভারি</span><span>{fmtPrice(settings.deliveryFee)}</span></div>
                <div className="flex justify-between font-bold text-sm dark:text-white border-t dark:border-slate-600 pt-1 mt-1"><span>সর্বমোট</span><span className="text-rose-600">{fmtPrice(grandTotal)}</span></div>
              </div>
            </div>
          )}

          {/* Step 2: Confirmed */}
          {step === 2 && (
            <div className="text-center py-6">
              <div className="text-6xl mb-4 animate-bounce-soft">🎉</div>
              <h3 className="text-xl font-black text-gray-800 dark:text-white mb-2">অর্ডার কনফার্ম!</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে।</p>
              <div className="bg-rose-50 dark:bg-rose-900/20 rounded-2xl px-4 py-3 mb-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">অর্ডার ID</p>
                <p className="font-mono font-bold text-rose-600 dark:text-rose-400 text-lg">{orderId}</p>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">WhatsApp-এ বিস্তারিত পাঠানো হয়েছে।</p>
              <div className="flex gap-2">
                <button
                  onClick={() => { close(); setTrackingOpen(true) }}
                  className="flex-1 py-2.5 rounded-2xl border-2 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 font-bold text-sm hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                >
                  📦 ট্র্যাক করুন
                </button>
                <button onClick={close} className="flex-1 btn-primary">ঠিক আছে ✓</button>
              </div>
            </div>
          )}
        </div>

        {step < 2 && (
          <div className="p-4 border-t dark:border-slate-700 flex gap-2">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} className="btn-ghost flex-1">← পেছনে</button>
            )}
            <button onClick={next} className="btn-primary flex-1">
              {step === 1 ? '✅ অর্ডার দিন' : 'পরবর্তী →'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
