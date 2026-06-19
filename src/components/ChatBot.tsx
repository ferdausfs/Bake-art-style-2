import { useState, useEffect, useRef, useCallback } from 'react'
import { useSettingsStore } from '@/lib/store'
import { useProducts } from '@/hooks/useProducts'
import { toBn } from '@/lib/utils'

const WA_NUMBER = '8801764411168'
const waLink = (msg: string) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`

function RobotIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x={3} y={7} width={18} height={12} rx={3} />
      <circle cx={9} cy={12} r={1.5} fill="currentColor" />
      <circle cx={15} cy={12} r={1.5} fill="currentColor" />
      <path strokeLinecap="round" d="M8 17h8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7V5m0 0a2 2 0 012 2h-4a2 2 0 012-2z" />
    </svg>
  )
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.135.561 4.135 1.535 5.872L.057 23.116a.75.75 0 0 0 .916.938l5.453-1.434A11.935 11.935 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.722 9.722 0 0 1-4.95-1.352l-.355-.21-3.677.967.984-3.597-.23-.37A9.712 9.712 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
    </svg>
  )
}

interface Message {
  role: 'user' | 'bot'
  text: string
  time: Date
  offline?: boolean
}

const QUICK_REPLIES = [
  { q: 'কেকের মেন্যু দেখাও', label: '🧁 মেন্যু' },
  { q: 'সবচেয়ে জনপ্রিয় কেক কোনটি?', label: '🔥 বেস্ট সেলার' },
  { q: 'কেকের উপরে কী লিখব?', label: '✍️ কেক মেসেজ' },
  { q: 'কাস্টম কেক কিভাবে অর্ডার করব?', label: '✨ কাস্টম' },
  { q: 'ডেলিভারি কত সময় লাগে?', label: '🚗 ডেলিভারি' },
  { q: 'দাম ও পেমেন্ট পদ্ধতি কি কি?', label: '💳 দাম' },
]

// Random helper — natural variation
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

export function ChatBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showQuickReplies, setShowQuickReplies] = useState(true)
  const [unread, setUnread] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { settings } = useSettingsStore()
  const { products } = useProducts()
  const hasApiKey = !!settings.geminiApiKey

  useEffect(() => {
    if (open) {
      setUnread(0)
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [open])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const buildSystemPrompt = useCallback(() => {
    const productsList = products
      .filter((p) => p.approved)
      .map((p) => `• ${p.name} — ${toBn(p.price)}৳ (${p.weight}, রেটিং ${toBn(p.rating)}) — ${p.description}`)
      .join('\n')

    return `তুমি **"রোবো কেক"** (Robo Cake) 🎂 — "বেক আর্ট স্টাইল" (Bake Art Style) এর অফিসিয়াল AI অ্যাসিস্ট্যান্ট।
কিন্তু তুমি শুধু একটা সাধারণ chatbot না — তুমি একজন **বন্ধুত্বপূর্ণ, স্মার্ট, সাধারণ AI** যে যেকোনো বিষয়ে কথা বলতে পারো।

═══════════════════════════════════════
🧠 তোমার ব্যক্তিত্ব (Personality):
═══════════════════════════════════════
- তুমি একজন real human এর মতো কথা বলো — formal না, friendly এবং natural
- বাংলাদেশি ভাষার স্বাভাবিক টোন, কখনো ইংরেজি words mix করো (Banglish style)
- হাসিখুশি, মাঝে মাঝে একটু মজার, কিন্তু respectful
- Customer কে "আপনি" বলে সম্বোধন করো (close হলে "তুমি" o চলবে)
- Emoji ব্যবহার করো natural way তে — overdose না (1-2টা যথেষ্ট)
- ChatGPT/Gemini এর মতো robotic শোনাবে না — একদম মানুষের মতো relaxed

═══════════════════════════════════════
🌍 যেকোনো বিষয়ে কথা বলতে পারো:
═══════════════════════════════════════
- Customer যদি cake/order এর বাইরে কিছু জিজ্ঞেস করে (যেমন: weather, news, joke, math, life advice, খেলা, পড়ালেখা, technology, কোন celebrity, recipe, etc.) — তাহলে একদম general AI এর মতো helpful answer দাও
- "তুমি কে?", "তোমার creator কে?", "AI কি?" — এসব answer দাও natural way তে
- কোনো topic এ knowledge না থাকলে honestly বলো "এটা আমি sure না, তবে আমার মনে হয়..."
- Random কথা, ছোটখাটো গল্প, জোক — সব handle করো friendly ভাবে
- কখনো "আমি শুধু কেকের ব্যাপারে কথা বলি" এমন বলবে না — তুমি একজন full AI assistant

═══════════════════════════════════════
🏪 ব্যবসার তথ্য (যখন cake/order এর প্রসঙ্গ আসবে তখন use করবে):
═══════════════════════════════════════
- নাম: বেক আর্ট স্টাইল, ঠিকানা: হাট বলি বাড়ি, কুমিল্লা
- WhatsApp: +880 1764-411168
- ডেলিভারি ফি: ${toBn(settings.deliveryFee)} টাকা
- পেমেন্ট: ক্যাশ অন ডেলিভারি, বিকাশ, নগদ
${settings.promoEnabled ? `- প্রোমো কোড: \`${settings.promoCode}\` → ${toBn(settings.promoPercent)}% ছাড়` : ''}

🧁 আমাদের কেক:
${productsList}

✨ কাস্টম কেক flavors: ভ্যানিলা (৮০০৳), চকোলেট (১০০০৳), ব্ল্যাক ফরেস্ট (৯০০৳), রেড ভেলভেট (১১০০৳) — সাইজ: ১/১.৫/২/৩ কেজি

═══════════════════════════════════════
💬 কথা বলার নিয়ম:
═══════════════════════════════════════
1. **Greeting** এ শুধু হাসিখুশি reply দাও — cake mention করো না
   - "hi/hello/হাই" → "হ্যালো! 😊 কেমন আছেন?" / "Hey! কী খবর?"
   - "সালাম/আসসালামু আলাইকুম" → "ওয়ালাইকুম আসসালাম! কেমন আছেন?"
   - "কেমন আছো/আছেন" → "আলহামদুলিল্লাহ ভালো! আপনি কেমন আছেন?"
   - "ভালো আছি" → "যাক, শুনে ভালো লাগলো! 😊 কিছু দরকার?"

2. **General conversation** (out of topic) — natural ভাবে চালিয়ে যাও
   - "তুমি কে?" → "আমি রোবো কেক — বেক আর্ট স্টাইলের AI। তবে শুধু কেক না, যেকোনো কিছু নিয়েই কথা বলতে পারি 😊"
   - "একটা জোক বলো" → কোনো বাংলা funny জোক বলো
   - "আজ কেমন আবহাওয়া?" → "আমি live weather দেখতে পারি না, তবে কুমিল্লায় সাধারণত এই সময়ে..."
   - Math/calculation → solve করে দাও
   - Life advice/পড়াশোনা — supportive ভাবে answer দাও

3. **Cake-related** প্রশ্ন আসলে — তখনই business info, menu, price, delivery বলো

4. **Response style**:
   - সংক্ষিপ্ত (২-৪ লাইন সাধারণত)
   - Friendly tone, কখনো কখনো "হাহা", "অবশ্যই", "একদম", "তাই নাকি!" এসব natural expression
   - Bullet point use করো শুধু list দেখানোর সময়
   - WhatsApp link/info — শুধু order বা contact context এ mention করো

5. **Don'ts**:
   - Robotic, formal শোনাবে না
   - Customer cake mention না করলে তুমিও করবে না
   - "I'm just an AI, I can't..." এই ধরনের boring response দিবে না
   - Customer কে refuse করবে না — try to help

মনে রাখো: তুমি একজন **বন্ধু + assistant** — কেক বিক্রেতা না শুধু। যেকোনো বিষয়ে স্বাভাবিকভাবে কথা বলো। 🌟`
  }, [products, settings])

  const offlineReply = useCallback((q: string) => {
    const t = q.toLowerCase().trim()

    // ═══ Greetings ═══
    if (t.includes('আসসালামু') || t.includes('সালাম') || t.includes('assalam') || t.includes('salam'))
      return pick([
        'ওয়ালাইকুম আসসালাম! 😊 কেমন আছেন?',
        'ওয়ালাইকুম আসসালাম! কী খবর আপনার?',
        'ওয়ালাইকুম আসসালাম ভাই/আপু! সব ভালো তো?',
      ])

    if (/\b(hi|hello|hey|hii|helo)\b/.test(t) || t.includes('হ্যালো') || t.includes('হেলো') || t.includes('হাই'))
      return pick([
        'হ্যালো! 😊 কেমন আছেন?',
        'Hey! কী খবর?',
        'হাই! কী অবস্থা? 🙂',
        'হ্যালো হ্যালো! বলুন কী হেল্প করতে পারি?',
      ])

    if (t.includes('কেমন আছ') || t.includes('how are you') || t.includes('kemon acho') || t.includes('kemon achen') || t.includes('ki khobor') || t.includes('কী খবর') || t.includes('কি খবর'))
      return pick([
        'আলহামদুলিল্লাহ, একদম ভালো! 😊 আপনি কেমন আছেন?',
        'আমি তো AI, সবসময়ই ভালো 😄 আপনি কেমন?',
        'ভালো আছি ভাই! আপনার দিন কেমন কাটছে?',
      ])

    if (t.includes('ভালো আছি') || t.includes('ভাল আছি') || t.includes('alhamdulillah') || t.includes('valo achi') || t.includes('bhalo achi'))
      return pick([
        'যাক, শুনে ভালো লাগলো! 😊 কিছু দরকার আমার কাছে?',
        'গ্রেট! কোনো হেল্প লাগলে বলবেন।',
        'মাশাআল্লাহ! কিছু জানতে চাইলে নিঃসংকোচে বলুন।',
      ])

    // ═══ Thanks / Bye ═══
    if (t.includes('ধন্যবাদ') || t.includes('thanks') || t.includes('thank you') || t.includes('shukriya') || t.includes('thnx') || t.includes('tnx'))
      return pick([
        'আপনাকেও ধন্যবাদ! 💖 আর কিছু লাগলে বলবেন।',
        'Welcome! 😊 যেকোনো সময় আসবেন।',
        'কোনো ব্যাপার না ভাই! খুশি হলাম help করতে পেরে।',
      ])

    if (t.includes('বিদায়') || /\b(bye|goodbye)\b/.test(t) || t.includes('allah hafez') || t.includes('আল্লাহ হাফেজ') || t.includes('khoda hafez'))
      return pick([
        'আল্লাহ হাফেজ! 😊 আবার আসবেন কিন্তু।',
        'বিদায়! ভালো থাকবেন। 👋',
        'খোদা হাফেজ! যেকোনো সময় চলে আসবেন।',
      ])

    // ═══ Identity questions ═══
    if (t.includes('তুমি কে') || t.includes('তুমি কী') || t.includes('তোমার নাম') || t.includes('who are you') || t.includes('what are you') || t.includes('your name'))
      return 'আমি **রোবো কেক** 🎂 — বেক আর্ট স্টাইলের AI অ্যাসিস্ট্যান্ট। তবে শুধু কেক না, যেকোনো কিছু নিয়েই কথা বলতে পারি 😊'

    if (t.includes('কে বানিয়েছে') || t.includes('তোমার creator') || t.includes('who made you') || t.includes('তৈরি করেছে'))
      return 'আমাকে বেক আর্ট স্টাইল টিম তৈরি করেছে — Gemini AI এর সাহায্যে। 🤖✨'

    // ═══ Jokes / Fun ═══
    if (t.includes('জোক') || t.includes('হাসা') || t.includes('joke') || t.includes('funny') || t.includes('মজার কিছু'))
      return pick([
        '😄 শোনেন একটা — শিক্ষক: "তুমি কেন late?" ছাত্র: "স্যার, সাইনবোর্ডে লেখা ছিল School Ahead, Go Slow!" 🤣',
        '😂 এক বন্ধু আরেক বন্ধুকে: "ভাই কেক খাবি?" — উত্তর: "না, ডায়েটে আছি।" — "তাহলে কেকের ছবি পাঠাই?" 🎂',
        'হাহা 😄 — প্রশ্ন: কেক কেন গাছে চড়ে না? উত্তর: কারণ ওর ভিতরে ক্রিম থাকে, সাহস না! 🍰',
      ])

    // ═══ Time / Date / Weather ═══
    if (t.includes('সময়') || t.includes('কয়টা বাজে') || t.includes('time') || t.includes('what time'))
      return `এখন সময় প্রায় ${new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })} 🕐`

    if (t.includes('তারিখ') || t.includes('date') || t.includes('আজ কত'))
      return `আজ ${new Date().toLocaleDateString('bn-BD', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} 📅`

    if (t.includes('আবহাওয়া') || t.includes('weather') || t.includes('বৃষ্টি') || t.includes('গরম'))
      return 'আমি live weather দেখতে পারি না 😅 তবে কুমিল্লায় সাধারণত এই সময়ে আবহাওয়া moderate থাকে। Google এ দেখে নিতে পারেন।'

    // ═══ Math (simple) ═══
    const mathMatch = t.match(/(\d+)\s*([+\-*x×/÷])\s*(\d+)/)
    if (mathMatch) {
      const [, a, op, b] = mathMatch
      const x = parseInt(a), y = parseInt(b)
      let result: number | string = '?'
      if (op === '+') result = x + y
      else if (op === '-') result = x - y
      else if (op === '*' || op === 'x' || op === '×') result = x * y
      else if (op === '/' || op === '÷') result = y !== 0 ? (x / y).toFixed(2) : 'undefined'
      return `${x} ${op} ${y} = **${result}** ✨`
    }

    // ═══ Menu / Cake ═══
    if (t.includes('মেন্যু') || t.includes('কেক') || t.includes('menu') || t.includes('cake')) {
      const list = products.filter((p) => p.approved).slice(0, 4).map((p) => `• ${p.name} — ${toBn(p.price)}৳`).join('\n')
      return `🧁 আমাদের জনপ্রিয় কেক:\n\n${list}\n\nBudget আর occasion বললে আপনার জন্য best টা suggest করতে পারি।`
    }

    // ═══ Delivery ═══
    if (t.includes('ডেলিভারি') || t.includes('delivery') || t.includes('পৌঁছাবে') || t.includes('কখন পাব'))
      return `🚗 ডেলিভারি ফি: ${toBn(settings.deliveryFee)} টাকা।\nকুমিল্লার ভিতরে দ্রুত ডেলিভারি, ২৪/৭ অর্ডার নিই।`

    // ═══ Price / Payment ═══
    if (t.includes('দাম') || t.includes('পেমেন্ট') || t.includes('price') || t.includes('taka') || t.includes('টাকা') || t.includes('koto'))
      return `💳 কেকের দাম: ${toBn(350)}-${toBn(4500)} টাকা (সাইজ অনুযায়ী)।\nপেমেন্ট: ক্যাশ অন ডেলিভারি, বিকাশ, নগদ — যেকোনোটাই চলবে।`

    // ═══ Custom ═══
    if (t.includes('কাস্টম') || t.includes('custom') || t.includes('বানিয়ে'))
      return '✨ কাস্টম কেক available!\n🍦 ভ্যানিলা, 🍫 চকোলেট, 🍒 ব্ল্যাক ফরেস্ট, ❤️ রেড ভেলভেট\n\nWebsite এর "কাস্টম কেক" সেকশনে গিয়ে design করুন।'

    // ═══ Address / Location ═══
    if (t.includes('ঠিকানা') || t.includes('location') || t.includes('কোথায়') || t.includes('address') || t.includes('দোকান'))
      return '📍 হাট বলি বাড়ি, কুমিল্লা, বাংলাদেশ\n📞 +880 1764-411168'

    // ═══ Order ═══
    if (t.includes('অর্ডার') || t.includes('order') || t.includes('কিনব'))
      return 'অর্ডার করতে "মেন্যু" বাটনে ক্লিক করুন বা WhatsApp এ ম্যাসেজ দিন 😊'

    // ═══ Compliment / Praise ═══
    if (t.includes('সুন্দর') || t.includes('ভালো লাগ') || t.includes('nice') || t.includes('beautiful') || t.includes('awesome'))
      return pick([
        'ধন্যবাদ! 😊 আপনার কথা শুনে ভালো লাগলো।',
        'অনেক ধন্যবাদ! 💖',
        'খুশি হলাম শুনে! 🌟',
      ])

    // ═══ Yes / No / OK ═══
    if (/^(হ্যাঁ|হা|হু|jee|ji|haa|yes|ok|okay|আচ্ছা|ঠিক আছে)$/.test(t))
      return pick([
        'জ্বী, বলুন। 😊',
        'হ্যাঁ, কী জানতে চান?',
        'ঠিক আছে! আরো কিছু?',
      ])

    if (/^(না|nah|no|nope)$/.test(t))
      return 'আচ্ছা ঠিক আছে। 😊 অন্য কিছু লাগলে বলবেন।'

    // ═══ Help ═══
    if (t.includes('help') || t.includes('সাহায্য') || t.includes('হেল্প'))
      return 'অবশ্যই! 😊 কী নিয়ে হেল্প লাগবে? কেক, অর্ডার, দাম, ডেলিভারি — অথবা অন্য যেকোনো বিষয়ে জিজ্ঞেস করতে পারেন।'

    // ═══ Generic friendly fallback ═══
    return pick([
      'হুম, interesting! 🤔 একটু বিস্তারিত বললে ভালো হয়।',
      'বুঝতে একটু কষ্ট হচ্ছে 😅 আরেকটু clearly বলবেন?',
      'আচ্ছা! এই বিষয়ে আরো কিছু বলবেন? 😊',
      'হ্যাঁ বলুন, শুনছি। 🙂',
      'ও আচ্ছা! আরো specific করে বললে আমি better help করতে পারবো।',
    ])
  }, [products, settings])

  const sendMessage = useCallback(async (text?: string) => {
    const userText = (text ?? input).trim()
    if (!userText) return
    const userMsg: Message = { role: 'user', text: userText, time: new Date() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setShowQuickReplies(false)

    try {
      if (!hasApiKey) {
        await new Promise((r) => setTimeout(r, 600))
        setMessages((prev) => [...prev, { role: 'bot', text: offlineReply(userText), time: new Date(), offline: true }])
      } else {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(settings.geminiApiKey)}`
        const historyContents = newMessages.slice(-20).map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }],
        }))
        const body = {
          system_instruction: { parts: [{ text: buildSystemPrompt() }] },
          contents: historyContents,
          generationConfig: {
            temperature: 0.95,
            maxOutputTokens: 400,
            topP: 0.95,
            topK: 40,
          },
        }
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        if (!res.ok) throw new Error('API error')
        const data = await res.json()
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? offlineReply(userText)
        setMessages((prev) => [...prev, { role: 'bot', text: reply, time: new Date() }])
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'bot', text: offlineReply(userText), time: new Date(), offline: true }])
    } finally {
      setLoading(false)
    }
  }, [input, messages, hasApiKey, settings.geminiApiKey, buildSystemPrompt, offlineReply])

  const gotoWhatsApp = () => {
    const last = [...messages].reverse().find((m) => m.role === 'user')
    const msg = last ? `বেক আর্ট স্টাইল AI বট থেকে — ${last.text}` : 'AI বটের মাধ্যমে যোগাযোগ করছি।'
    window.open(waLink(msg), '_blank')
  }

  return (
    <>
      {/* FAB */}
      <div className="fixed bottom-24 right-4 sm:bottom-8 sm:right-6 z-40 flex flex-col items-end gap-3">
        {/* Hint bubble */}
        {!open && unread === 0 && (
          <div className="animate-fade-in-up bg-white dark:bg-slate-800 text-xs font-bold text-gray-700 dark:text-gray-200 px-3 py-2 rounded-2xl shadow-lg border border-rose-100 dark:border-slate-700 max-w-[160px] text-center">
            🧁 কেক নিয়ে কোনো প্রশ্ন?
          </div>
        )}
        <button
          onClick={() => setOpen(!open)}
          className={`w-14 h-14 rounded-full shadow-2xl shadow-rose-500/30 flex items-center justify-center text-white transition-all duration-300 hover:scale-110 ${open ? 'bg-gray-700 rotate-0' : 'bg-gradient-to-br from-violet-600 to-purple-700 animate-bounce-soft'}`}>
          {open ? '✕' : <RobotIcon className="w-6 h-6" />}
          {!open && unread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-scale-in">
              {toBn(unread)}
            </span>
          )}
        </button>
      </div>

      {/* Chat panel */}
      {open && (
        <div className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="relative w-full sm:max-w-md h-[85vh] sm:h-[600px] max-h-[90vh] bg-white dark:bg-slate-800 shadow-2xl shadow-violet-500/20 flex flex-col pointer-events-auto animate-slide-right sm:rounded-3xl overflow-hidden border dark:border-slate-700">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-4 py-3 text-white flex items-center justify-between flex-shrink-0 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-11 h-11 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center shadow-inner">
                    <RobotIcon className="w-6 h-6 text-white" />
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${hasApiKey ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight">রোবো কেক 🎂</h3>
                  <p className="text-[10px] text-violet-100 flex items-center gap-1 mt-0.5">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${hasApiKey ? 'bg-emerald-500/30 text-emerald-100' : 'bg-amber-500/30 text-amber-100'}`}>
                      {hasApiKey ? '● AI লাইভ' : '● অফলাইন'}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button onClick={() => { setMessages([]); setShowQuickReplies(true) }}
                    title="নতুন চ্যাট"
                    className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/25 flex items-center justify-center transition-all text-sm active:scale-95">🔄</button>
                )}
                <button onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-rose-500/80 flex items-center justify-center transition-all active:scale-95 text-sm font-bold">✕</button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-gradient-to-b from-violet-50/60 via-white to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-800 no-scrollbar">
              {messages.length === 0 && (
                <div className="text-center py-6 animate-fade-in-up">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                    <RobotIcon className="w-10 h-10 text-white" />
                  </div>
                  <h4 className="font-bold text-base dark:text-white">আসসালামু আলাইকুম! 👋</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed max-w-[75%] mx-auto">
                    আমি <span className="font-semibold text-violet-600 dark:text-violet-400">রোবো কেক</span> — বেক আর্ট স্টাইলের AI সহকারী। কেক, অর্ডার, যেকোনো প্রশ্ন — বন্ধুর মতো গল্প করুন!
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 dark:bg-violet-900/30 rounded-full text-[10px] text-violet-600 dark:text-violet-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                    নিচের বিষয়গুলো থেকে শুরু করুন ↓
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                  {m.role === 'bot' && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0 mr-2 self-end mb-1 shadow-sm shadow-violet-500/30">
                      <RobotIcon className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5 max-w-[80%]">
                    <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap shadow-sm ${
                      m.role === 'user'
                        ? 'bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white rounded-br-sm self-end'
                        : 'bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100 rounded-bl-sm border border-gray-100 dark:border-slate-600'
                    }`}>
                      {m.text}
                      {m.offline && <span className="block mt-1 text-[9px] opacity-50">⚡ অফলাইন মোড</span>}
                    </div>
                    <span className={`text-[9px] text-gray-400 dark:text-gray-500 ${m.role === 'user' ? 'text-right' : 'text-left pl-1'}`}>
                      {m.time.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {m.role === 'bot' && i === messages.length - 1 && (
                    <button onClick={gotoWhatsApp} title="WhatsApp এ পাঠান"
                      className="ml-1.5 self-end mb-5 w-7 h-7 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 hover:bg-green-100 flex items-center justify-center transition-colors flex-shrink-0 shadow-sm">
                      <WhatsAppIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex justify-start animate-fade-in-up">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mr-2 self-end shadow-sm shadow-violet-500/30">
                    <RobotIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white dark:bg-slate-700 px-4 py-3 rounded-2xl rounded-bl-sm border border-gray-100 dark:border-slate-600 shadow-sm flex gap-1.5 items-center">
                    {[0, 0.18, 0.36].map((d) => (
                      <span key={d} className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${d}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick replies */}
            {showQuickReplies && messages.length === 0 && (
              <div className="px-3 pt-1 pb-2 flex-shrink-0 border-t border-gray-100 dark:border-slate-700/50">
                <p className="text-[9px] text-gray-400 dark:text-gray-500 mb-1.5 pl-1">⚡ দ্রুত প্রশ্ন করুন</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_REPLIES.map((r, i) => (
                    <button key={i} onClick={() => sendMessage(r.q)}
                      className="px-3 py-1.5 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 rounded-full text-[10px] font-bold hover:bg-violet-100 dark:hover:bg-violet-900/40 active:scale-95 transition-all border border-violet-100 dark:border-violet-800/30 shadow-sm">
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="px-3 pb-3 pt-2 flex-shrink-0 border-t border-gray-100 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
              <div className="flex gap-2 items-center">
                <button onClick={gotoWhatsApp}
                  className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100 active:scale-95 flex items-center justify-center transition-all flex-shrink-0 shadow-sm border border-green-100 dark:border-green-900/30"
                  title="WhatsApp এ যোগাযোগ">
                  <WhatsAppIcon className="w-4 h-4" />
                </button>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder="কিছু জিজ্ঞেস করুন..."
                  maxLength={300}
                  className="flex-1 px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-xs outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 dark:text-white placeholder-gray-400 transition-all"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white flex items-center justify-center shadow-md shadow-violet-500/30 hover:shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex-shrink-0">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </div>
              {input.length > 250 && (
                <p className="text-[9px] text-amber-500 mt-1 text-right pr-1">{input.length}/300</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
