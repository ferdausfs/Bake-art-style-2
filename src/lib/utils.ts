// Bengali digit conversion
export const toBn = (num: number | string): string =>
  String(num).replace(/\d/g, (w) => '০১২৩৪৫৬৭৮৯'[+w])

// Simple hash for password
export const hashPass = (s: string): string => {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i)
  return (h >>> 0).toString(36)
}

// BD phone validator
export const isValidPhone = (p: string): boolean =>
  /^(\+?880)?01[3-9]\d{8}$/.test(p.replace(/[\s\-]/g, ''))

// WhatsApp link builder
export const waLink = (number: string, msg: string): string =>
  `https://wa.me/${number}?text=${encodeURIComponent(msg)}`

// Format price in Bengali
export const fmtPrice = (n: number): string => `${toBn(n)}৳`

// LocalStorage helpers
export const ls = {
  get: <T>(key: string, fallback: T): T => {
    try {
      const v = localStorage.getItem(key)
      return v ? (JSON.parse(v) as T) : fallback
    } catch {
      return fallback
    }
  },
  set: <T>(key: string, val: T): void => {
    try { localStorage.setItem(key, JSON.stringify(val)) } catch { /* quota */ }
  },
  remove: (key: string): void => localStorage.removeItem(key),
}

// Generate order ID
export const genOrderId = (): string =>
  'BAS-' + Math.floor(10000 + Math.random() * 90000)

// Clamp number
export const clamp = (n: number, min: number, max: number): number =>
  Math.min(Math.max(n, min), max)

// Export orders as CSV
export const exportOrdersCSV = (orders: import('@/types').Order[]): void => {
  const headers = ['Order ID', 'Customer', 'Phone', 'Address', 'Date', 'Time', 'Items', 'Subtotal', 'Discount', 'Delivery', 'Total', 'Status', 'Payment', 'Created']
  const rows = orders.map((o) => [
    o.id,
    o.customer_name,
    o.customer_phone,
    `"${o.customer_address}"`,
    o.delivery_date,
    o.delivery_time,
    `"${o.items.map((i) => `${i.name}×${i.quantity}`).join('; ')}"`,
    o.subtotal,
    o.discount,
    o.delivery_fee,
    o.total,
    o.status,
    o.payment_method,
    new Date(o.created_at).toLocaleString('bn-BD'),
  ])
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// Play notification beep
export const playBeep = (): void => {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3)
    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.4)
  } catch { /* audio not supported */ }
}

// Convert file to base64
export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('ফাইল পড়তে ব্যর্থ'))
    reader.readAsDataURL(file)
  })

// Check if Supabase is configured
export const isSupabaseConfigured = (): boolean =>
  !!(import.meta.env.VITE_SUPABASE_URL &&
     import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co')
