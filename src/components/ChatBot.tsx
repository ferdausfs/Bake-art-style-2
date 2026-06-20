import { useEffect, useRef, useState } from 'react';
import { Phone, Send } from 'lucide-react';
import { useSettingsStore } from '../lib/store';
import { useProducts } from '../hooks/useProducts';
import { waLink } from '../lib/utils';

interface Message {
  role: 'user' | 'bot';
  text: string;
  time: Date;
}

const QUICK_REPLIES = [
  { q: 'তুমি কী করতে পারো?', label: '🤖 কী পারো?' },
  { q: 'কেক মেনু দেখাও', label: '🧁 মেনু' },
  { q: 'অর্ডার কীভাবে করবো?', label: '🛒 অর্ডার' },
  { q: 'ডেলিভারি কোথায় দাও?', label: '🚗 জোন' },
  { q: 'অর্ডার ট্র্যাক করবো কীভাবে?', label: '📦 ট্র্যাক' },
  { q: 'মানুষের সাথে কথা বলতে চাই', label: '💬 সাপোর্ট' },
];

const formatBDT = (n: number) => `৳${n.toLocaleString('en-BD')}`;

interface Props {
  embedded?: boolean;
}

export function ChatBot({ embedded = false }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuick, setShowQuick] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { settings } = useSettingsStore();
  const { products } = useProducts();

  useEffect(() => {
    if (embedded) setTimeout(() => inputRef.current?.focus(), 200);
  }, [embedded]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const addBot = (text: string) => {
    setMessages((m) => [...m, { role: 'bot', text, time: new Date() }]);
  };

  const normalize = (text: string) =>
    text
      .toLowerCase()
      .replace(/[?.,!।…]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const has = (text: string, words: string[]) => words.some((w) => text.includes(w));

  const supportText = () => {
    const digits = settings.whatsappNumber.replace(/\D/g, '');
    if (digits.length < 10) {
      return 'WhatsApp number এখনো সেট করা নেই। Admin Panel → Settings থেকে WhatsApp Number দিন, তারপর আমি সরাসরি WhatsApp link দেখাতে পারবো।';
    }
    const link = waLink(settings.whatsappNumber, 'হ্যালো! আমার একটা প্রশ্ন আছে কেক অর্ডার নিয়ে।');
    return `আমাদের টিমের সাথে সরাসরি কথা বলতে পারেন 👋\nWhatsApp: ${link}\n\nসাধারণত সকাল ৯টা থেকে রাত ৯টা পর্যন্ত সাপোর্ট পাওয়া যায়।`;
  };

  const menuText = () => {
    const list = products
      .slice(0, 6)
      .map((p, i) => `${i + 1}. ${p.name} — ${formatBDT(p.price)}\n   ${p.tagline}`)
      .join('\n');
    return `আমাদের জনপ্রিয় কেকগুলো 🎂\n\n${list}\n\nআরও দেখতে Shop/Browse tab খুলুন। কোনো কেক পছন্দ হলে Add to cart বা Customize করতে পারবেন।`;
  };

  const appGuideText = () =>
    `আমি Bake Bot 🤖 — Bake Art Style app-এর সহকারী। আমি এগুলোতে সাহায্য করতে পারি:\n\n` +
    `• কেক মেনু, দাম ও বেস্টসেলার দেখানো\n` +
    `• কাস্টম কেক অর্ডার করার ধাপ বলা\n` +
    `• ডেলিভারি জোন/সময়/চার্জ বোঝানো\n` +
    `• bKash, Nagad, Cash payment info দেওয়া\n` +
    `• Cart, Wishlist, Checkout, Order tracking বুঝিয়ে দেওয়া\n` +
    `• সমস্যা হলে WhatsApp support link দেওয়া\n\n` +
    `আপনি সাধারণভাবেও কথা বলতে পারেন — যেমন “kemon aso”, “ki koro”, “order korte chai” 🙂`;

  const adminGuideText = () =>
    `Admin Panel-এ যা আছে 🔐\n\n` +
    `• Dashboard: revenue, pending order, today order, products\n` +
    `• Orders: অর্ডার দেখা, status দেখা, CSV export\n` +
    `• Products: cake add/edit/delete, image upload\n` +
    `• Gallery: gallery photo add/delete\n` +
    `• Reviews: review approve/delete\n` +
    `• Customers: customer list, total spent, order count\n` +
    `• Zones: delivery zone add/remove, zone gating on/off\n` +
    `• Settings: admin email/PIN, WhatsApp, delivery fee, promo, Gemini API key\n\n` +
    `Admin খুলতে Home logo ৫ বার tap করুন → admin email দিয়ে login → PIN দিন।`;

  const orderText = () =>
    `অর্ডার করার ধাপ 🛒\n\n` +
    `1. Shop/Browse থেকে কেক সিলেক্ট করুন\n` +
    `2. Size, flavour, topping বা message customize করুন\n` +
    `3. Add to cart চাপুন\n` +
    `4. Cart → Checkout এ নাম, ফোন, ঠিকানা দিন\n` +
    `5. Payment select করে order confirm করুন\n\n` +
    `অর্ডার হলে Order ID পাবেন, তারপর Tracking screen থেকে status দেখতে পারবেন।`;

  const zoneText = () => {
    const zones = (settings.allowedZones ?? []).join(', ');
    return `বর্তমান delivery zones 🚗\n${zones || 'এখনো zone সেট করা নেই'}\n\nCheckout-এর আগে location check করা যায়। আপনার এলাকা না থাকলে WhatsApp-এ কথা বলুন — admin চাইলে zone add করতে পারবেন।`;
  };

  const paymentText = () => {
    const minPrice = products.length ? Math.min(...products.map((p) => p.price)) : 0;
    return `Payment options 💳\n• bKash\n• Nagad\n• Cash on Delivery\n\nদাম শুরু ${formatBDT(minPrice)} থেকে। Delivery fee ${formatBDT(settings.deliveryFee)}। ${settings.promoEnabled ? `Promo code ${settings.promoCode} দিলে ${settings.promoPercent}% discount পেতে পারেন।` : ''}`;
  };

  const ruleBasedReply = (question: string): { text: string; matched: boolean } => {
    const q = normalize(question);

    if (has(q, ['hi', 'hello', 'hey', 'হাই', 'হ্যালো', 'সালাম', 'আসসালামু'])) {
      return { text: 'হ্যালো! 😊 আমি Bake Bot। কেক অর্ডার, দাম, ডেলিভারি, tracking বা app ব্যবহার নিয়ে যা জানতে চান বলুন।', matched: true };
    }

    if (has(q, ['kemon aso', 'কেমন আছ', 'kamon acho', 'kmn aso', 'how are you'])) {
      return { text: 'আমি ভালো আছি, ধন্যবাদ! 😊 আপনি কেমন আছেন? আজ কি কোনো birthday/anniversary cake লাগবে, নাকি শুধু app নিয়ে সাহায্য চান?', matched: true };
    }

    if (has(q, ['ki koro', 'কি কর', 'ki korte paro', 'কী করতে পারো', 'what can you do', 'tumi ki', 'তুমি কে', 'who are you'])) {
      return { text: appGuideText(), matched: true };
    }

    if (has(q, ['thanks', 'thank you', 'ধন্যবাদ', 'tnx', 'thx'])) {
      return { text: 'স্বাগতম! 😊 আর কিছু জানতে চাইলে বলুন — আমি আছি।', matched: true };
    }

    if (has(q, ['bye', 'good night', 'বিদায়', 'আল্লাহ হাফেজ'])) {
      return { text: 'আল্লাহ হাফেজ! ভালো থাকবেন 😊 কেক লাগলে আবার Knock করবেন 🎂', matched: true };
    }

    if (has(q, ['admin', 'অ্যাডমিন', 'panel', 'প্যানেল', 'dashboard', 'ড্যাশবোর্ড'])) {
      return { text: adminGuideText(), matched: true };
    }

    if (has(q, ['menu', 'মেনু', 'cake', 'কেক', 'product', 'প্রোডাক্ট', 'দেখাও'])) {
      return { text: menuText(), matched: true };
    }

    if (has(q, ['bestsell', 'popular', 'বেস্ট', 'জনপ্রিয়', 'ভালো কোন', 'recommend', 'সাজেস্ট'])) {
      const top = products.find((p) => p.bestseller) ?? products[0];
      return {
        text: top
          ? `আমার suggestion: ${top.name} ⭐\nদাম ${formatBDT(top.price)} — ${top.tagline}\n\nBirthday/anniversary হলে এটা safe choice। চাইলে Customize করে message/topping দিতে পারবেন।`
          : 'এখনো product list load হয়নি। একটু পরে আবার চেষ্টা করুন।',
        matched: true,
      };
    }

    if (has(q, ['order', 'অর্ডার', 'kinbo', 'kivabe kinbo', 'কিনব', 'checkout', 'cart', 'কার্ট'])) {
      return { text: orderText(), matched: true };
    }

    if (has(q, ['custom', 'customize', 'কাস্টম', 'কাস্টমাইজ', 'design', 'ডিজাইন', 'message', 'নাম লিখ'])) {
      return { text: `Custom cake করতে পারবেন ✨\n\nProduct খুলুন → Customize চাপুন → size/flavour/topping/message দিন → cart এ add করুন।\n\nআপনি চাইলে cake-এর ওপর নাম/ছোট message লিখতে পারেন।`, matched: true };
    }

    if (has(q, ['delivery', 'ডেলিভারি', 'zone', 'জোন', 'area', 'এলাকা', 'কোথায়', 'kothay', 'লোকেশন'])) {
      return { text: zoneText(), matched: true };
    }

    if (has(q, ['time', 'সময়', 'কতক্ষণ', 'kotokkhon', 'delivery estimate'])) {
      return { text: `ডেলিভারি estimate: ${settings.deliveryEstimate} 🚗\n\nসময় এলাকা, অর্ডার rush এবং cake customization অনুযায়ী বদলাতে পারে। Same-day order চাইলে যত দ্রুত সম্ভব checkout করুন।`, matched: true };
    }

    if (has(q, ['price', 'দাম', 'tk', 'টাকা', 'payment', 'পেমেন্ট', 'bkash', 'bikash', 'nagad', 'cash'])) {
      return { text: paymentText(), matched: true };
    }

    if (has(q, ['track', 'tracking', 'ট্র্যাক', 'status', 'স্ট্যাটাস', 'order id'])) {
      return { text: `Order tracking 📦\n\nOrder confirm হলে যে Order ID পাবেন, সেটি Tracking screen-এ লিখুন। Orders page থেকেও “Open tracking” চাপতে পারবেন। Status: placed → confirmed → baking → ready → out → delivered।`, matched: true };
    }

    if (has(q, ['wishlist', 'wish', 'heart', 'পছন্দ', 'save'])) {
      return { text: `Wishlist ব্যবহার করতে cake card-এর ❤️ চাপুন। পরে Wishlist screen থেকে saved cake দেখতে, remove করতে বা cart-এ add করতে পারবেন।`, matched: true };
    }

    if (has(q, ['support', 'help', 'সাহায্য', 'মানুষ', 'human', 'whatsapp', 'contact', 'যোগাযোগ'])) {
      return { text: supportText(), matched: true };
    }

    if (has(q, ['cancel', 'refund', 'বাতিল', 'রিফান্ড'])) {
      return { text: `Order cancel/refund বিষয়ে দ্রুত support-এ কথা বলাই ভালো। Cake preparation শুরু হয়ে গেলে cancel policy আলাদা হতে পারে।\n\n${supportText()}`, matched: true };
    }

    return {
      text:
        `আমি পুরোপুরি বুঝতে পারিনি, তবে সাহায্য করতে পারি 😊\n\n` +
        `আপনি লিখতে পারেন:\n` +
        `• “কেক মেনু দেখাও”\n` +
        `• “অর্ডার কীভাবে করবো”\n` +
        `• “ডেলিভারি কোথায় দাও”\n` +
        `• “admin panel এ কী আছে”\n` +
        `• “মানুষের সাথে কথা বলতে চাই”`,
      matched: false,
    };
  };

  const callGemini = async (userMsg: string): Promise<string> => {
    const productList = products.map((p) => `• ${p.name} — ${formatBDT(p.price)}: ${p.tagline}`).join('\n');
    const zones = (settings.allowedZones ?? []).join(', ');
    const systemPrompt = `তুমি "Bake Bot" 🎂, Bake Art Style বেকারির friendly AI assistant। বাংলা/Banglish-এ short helpful উত্তর দাও। সাধারণ কথাও naturally বলবে, কিন্তু business/app info ভুল বানাবে না।\n\nApp features:\n- Shop/Browse products, Wishlist, Cart, Checkout, Order tracking\n- Custom cake: size, flavour, topping, message\n- Admin: 5 tap logo unlock, dashboard, orders, products, gallery, reviews, customers, zones, settings\n\nStore info:\n- Currency: BDT (৳)\n- Delivery estimate: ${settings.deliveryEstimate}, fee: ৳${settings.deliveryFee}\n- Zones: ${zones}\n- Payment: bKash, Nagad, Cash on Delivery\n${settings.promoEnabled ? `- Promo: ${settings.promoCode} = ${settings.promoPercent}% off` : ''}\n\nProducts:\n${productList}\n\nউত্তর 2-6 লাইনের মধ্যে রাখো।`;
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${settings.geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nUser: ${userMsg}` }] }] }),
    });
    if (!res.ok) throw new Error('Gemini API failed');
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response');
    return text;
  };

  const send = async (msg?: string) => {
    const text = (msg ?? input).trim();
    if (!text) return;

    setInput('');
    setShowQuick(false);
    setMessages((m) => [...m, { role: 'user', text, time: new Date() }]);
    setLoading(true);

    try {
      // First use strong local knowledge. If it is still generic and Gemini key exists, try Gemini.
      const local = ruleBasedReply(text);
      if (local.matched || !settings.geminiApiKey) {
        await new Promise((r) => setTimeout(r, 300));
        addBot(local.text);
        if (!local.matched) setShowQuick(true);
        return;
      }

      try {
        const reply = await callGemini(text);
        addBot(reply);
      } catch {
        addBot(local.text);
        setShowQuick(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!embedded) return null;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white" style={{ height: 420, boxShadow: '0 1px 2px rgba(26,19,17,.02), 0 8px 24px -16px rgba(26,19,17,.16)' }}>
      <div className="flex flex-shrink-0 items-center gap-2 bg-coral px-4 py-3 text-white">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-lg">🎂</div>
        <div>
          <p className="text-sm font-bold">Bake Bot সহায়তা</p>
          <p className="text-[10px] text-white/70">কেক, অর্ডার, tracking বা সাধারণ প্রশ্ন করুন</p>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.length === 0 && (
          <div className="py-4 text-center text-xs text-ink/40">
            হ্যালো! আমি Bake Bot 😊 লিখুন “ki koro” বা নিচের option বেছে নিন।
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${m.role === 'user' ? 'rounded-br-sm bg-coral text-white' : 'rounded-bl-sm bg-cream text-ink'}`}>
              {m.text.split('\n').map((line, j, arr) => (
                <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
              ))}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-cream px-3 py-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-coral" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {showQuick && (
        <div className="flex flex-shrink-0 flex-wrap gap-1.5 px-3 pb-2">
          {QUICK_REPLIES.map((qr) => (
            <button
              key={qr.label}
              onClick={() => send(qr.q)}
              className="rounded-full border border-coral/20 bg-coral/10 px-2.5 py-1 text-[10px] font-bold text-coral"
            >
              {qr.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-shrink-0 items-center gap-2 border-t border-ink/8 px-3 py-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="মেসেজ লিখুন..."
          className="flex-1 rounded-full bg-ink/5 px-3 py-2 text-xs text-ink focus:outline-none"
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || loading}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-coral text-white disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>

      <a
        href={settings.whatsappNumber.replace(/\D/g, '').length >= 10 ? waLink(settings.whatsappNumber, 'হ্যালো! আমার একটা প্রশ্ন আছে।') : '#'}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          if (settings.whatsappNumber.replace(/\D/g, '').length < 10) e.preventDefault();
        }}
        className="flex flex-shrink-0 items-center justify-center gap-2 bg-green-50 py-2.5 text-xs font-bold text-green-700"
      >
        <Phone className="h-3.5 w-3.5" /> সরাসরি WhatsApp-এ কথা বলুন
      </a>
    </div>
  );
}
