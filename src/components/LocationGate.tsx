import { useState } from 'react';
import { MapPin, CheckCircle2, AlertCircle, Loader2, Navigation, MessageCircle, X, Cake } from 'lucide-react';
import { useLocation, useSettingsStore } from '../lib/store';
import { waLink } from '../lib/utils';
import { matchZone } from '../lib/zones';

type Status = 'idle' | 'requesting' | 'detecting' | 'allowed' | 'out_of_zone' | 'error';

interface Props {
  onDismiss: () => void;
}

export function LocationGate({ onDismiss }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [district, setDistrict] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const { settings } = useSettingsStore();
  const { setLocation } = useLocation();

  const requestLocation = async () => {
    setStatus('requesting');
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 })
      );
      setStatus('detecting');
      const { latitude: lat, longitude: lng } = pos.coords;

      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const data = await r.json();
      const city =
        data.address?.city ||
        data.address?.town ||
        data.address?.district ||
        data.address?.county ||
        data.address?.state_district ||
        '';
      const addressText = data.display_name || city;
      const matchedZone = matchZone(addressText, settings.allowedZones ?? []);

      setDistrict(matchedZone || city || 'আপনার এলাকা');
      if (matchedZone || settings.deliveryZonesEnabled === false) {
        setLocation(matchedZone || city || 'Verified area', lat, lng);
        setStatus('allowed');
        setTimeout(onDismiss, 1500);
      } else {
        setStatus('out_of_zone');
      }
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'লোকেশন শনাক্ত করা যায়নি');
      setStatus('error');
    }
  };

  const openWhatsApp = () => {
    const msg = `হ্যালো! আমি ${district || 'আমার এলাকা'} থেকে একটা কেক অর্ডার করতে চাই।`;
    window.open(waLink(settings.whatsappNumber, msg), '_blank');
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #fff0f3 0%, #ffe4ec 50%, #ffd6e7 100%)' }}>
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center relative">
        <button onClick={onDismiss} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/5 flex items-center justify-center">
          <X className="w-4 h-4 text-black/40" />
        </button>

        <div className="flex justify-center text-ink mb-2">
          <Cake size={40} strokeWidth={1.5} />
        </div>
        <h1 className="text-xl font-black text-ink mb-1">Bake Art Style</h1>
        <p className="text-xs text-black/40 mb-6">কুমিল্লা থেকে ভালোবাসা দিয়ে তৈরি</p>

        {status === 'idle' && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-ink-50 flex items-center justify-center mx-auto">
              <MapPin className="w-8 h-8 text-ink" />
            </div>
            <h2 className="font-bold text-ink">ডেলিভারি জোন চেক করুন</h2>
            <p className="text-sm text-ink/60">পেমেন্টের আগে আমরা যাচাই করবো আপনার এলাকায় ডেলিভারি দিতে পারি কিনা।</p>
            <button onClick={requestLocation}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-coral text-white font-bold">
              <Navigation className="w-4 h-4" /> আমার লোকেশন শনাক্ত করুন
            </button>
            <button onClick={onDismiss} className="text-xs text-ink/40">এখন বাদ দিন</button>
          </div>
        )}

        {(status === 'requesting' || status === 'detecting') && (
          <div className="space-y-3">
            <Loader2 className="w-12 h-12 text-ink animate-spin mx-auto" />
            <h2 className="font-bold text-ink">
              {status === 'requesting' ? 'লোকেশন নেওয়া হচ্ছে...' : 'এলাকা শনাক্ত করা হচ্ছে...'}
            </h2>
            <p className="text-sm text-ink/60">ব্রাউজারে লোকেশন অ্যাক্সেস অনুমতি দিন</p>
          </div>
        )}

        {status === 'allowed' && (
          <div className="space-y-3">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <h2 className="font-bold text-ink">আমরা {district}-এ ডেলিভারি দিই!</h2>
            <p className="text-sm text-ink/60">চেকআউটে নিয়ে যাওয়া হচ্ছে...</p>
          </div>
        )}

        {status === 'out_of_zone' && (
          <div className="space-y-4">
            <AlertCircle className="w-12 h-12 text-orange-400 mx-auto" />
            <h2 className="font-bold text-ink">দুঃখিত!</h2>
            <p className="text-sm text-ink/60">
              {settings.outOfZoneMessage || 'আমরা এখনো এই এলাকায় ডেলিভারি দিই না। WhatsApp-এ যোগাযোগ করুন, আমরা সাহায্য করার চেষ্টা করবো!'}
            </p>
            <button onClick={openWhatsApp}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-500 text-white font-bold text-sm">
              <MessageCircle className="w-4 h-4" /> WhatsApp-এ অর্ডার করুন
            </button>
            <div className="text-left">
              <p className="text-[10px] text-ink/40 mb-2">আমরা বর্তমানে ডেলিভারি দিই:</p>
              <div className="flex flex-wrap gap-1.5">
                {(settings.allowedZones ?? []).map((z) => (
                  <span key={z} className="px-2 py-0.5 rounded-full bg-ink-50 text-ink-200 text-[10px] font-bold">{z}</span>
                ))}
              </div>
            </div>
            <button onClick={onDismiss} className="text-xs text-ink/40">তবুও ব্রাউজ করুন</button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
            <h2 className="font-bold text-ink">লোকেশন পাওয়া যায়নি</h2>
            <p className="text-sm text-ink/60">{errorMsg}</p>
            <button onClick={requestLocation}
              className="w-full py-3 rounded-2xl bg-coral text-white font-bold text-sm">
              আবার চেষ্টা করুন
            </button>
            <button onClick={onDismiss} className="text-xs text-ink/40">বাদ দিন</button>
          </div>
        )}
      </div>
    </div>
  );
}
