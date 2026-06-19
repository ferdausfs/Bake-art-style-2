import React from 'react';
import { MapPin, AlertCircle, CheckCircle2, MessageCircle, Loader2, Navigation } from 'lucide-react';
import { useLocationGate } from '../../hooks/useLocationGate';

interface LocationGateProps {
  onAllowed: (district: string, lat: number, lng: number) => void;
}

export const LocationGate: React.FC<LocationGateProps> = ({ onAllowed }) => {
  const loc = useLocationGate();

  // Auto-proceed when allowed
  React.useEffect(() => {
    if (loc.status === 'allowed' && loc.district && loc.lat && loc.lng) {
      onAllowed(loc.district, loc.lat, loc.lng);
    }
  }, [loc.status]);

  const openWhatsApp = () => {
    const num = loc.whatsappNumber.replace(/\D/g, '');
    const msg = encodeURIComponent(
      `আসসালামু আলাইকুম! আমি ${loc.district || 'আমার এলাকা'} থেকে কেক অর্ডার করতে চাই।`
    );
    window.open(`https://wa.me/${num}?text=${msg}`, '_blank');
  };

  return (
    <div className="location-gate-overlay">
      <div className="location-gate-card">
        {/* Logo / Brand */}
        <div className="gate-brand">
          <div className="gate-cake-icon">🎂</div>
          <h1>বেক আর্ট স্টাইল</h1>
          <p className="gate-tagline">ভালোবাসা দিয়ে বানানো, আনন্দ দিয়ে পরিবেশন</p>
        </div>

        {/* Idle — welcome state */}
        {loc.status === 'idle' && (
          <div className="gate-content">
            <div className="gate-icon-wrap gate-icon-pink">
              <MapPin size={32} />
            </div>
            <h2>ডেলিভারি এলাকা যাচাই</h2>
            <p>
              আপনার এলাকায় ডেলিভারি আছে কিনা জানতে আপনার location দিন।
              আমরা শুধুমাত্র নির্দিষ্ট জেলায় ডেলিভারি করি।
            </p>
            <button className="btn-primary-gate" onClick={loc.requestLocation}>
              <Navigation size={18} />
              আমার Location দিন
            </button>
          </div>
        )}

        {/* Requesting GPS */}
        {loc.status === 'requesting' && (
          <div className="gate-content gate-center">
            <Loader2 size={48} className="gate-spinner" />
            <h2>Location নেওয়া হচ্ছে...</h2>
            <p>Browser এর permission popup এ <strong>Allow</strong> করুন</p>
          </div>
        )}

        {/* Detecting district */}
        {loc.status === 'detecting_district' && (
          <div className="gate-content gate-center">
            <Loader2 size={48} className="gate-spinner" />
            <h2>এলাকা শনাক্ত হচ্ছে...</h2>
            <p>একটু অপেক্ষা করুন</p>
          </div>
        )}

        {/* ✅ Allowed */}
        {loc.status === 'allowed' && (
          <div className="gate-content gate-center">
            <CheckCircle2 size={48} className="gate-success-icon" />
            <h2>আপনার এলাকায় ডেলিভারি আছে! 🎉</h2>
            <p>
              <strong>{loc.district}</strong> তে আমরা ডেলিভারি করি।
            </p>
            <div className="gate-loading-bar">
              <div className="gate-loading-bar-fill" />
            </div>
            <p className="gate-small">অর্ডার পেজে যাচ্ছি...</p>
          </div>
        )}

        {/* ❌ Out of zone */}
        {loc.status === 'out_of_zone' && (
          <div className="gate-content">
            <div className="gate-icon-wrap gate-icon-orange">
              <AlertCircle size={32} />
            </div>
            <h2>দুঃখিত!</h2>
            <p>
              <strong>{loc.district || 'আপনার এলাকায়'}</strong> তে এখনো আমাদের ডেলিভারি নেই।
            </p>
            <p className="gate-subtext">
              তবে চিন্তা নেই — WhatsApp এ যোগাযোগ করলে আমরা ব্যবস্থা করার চেষ্টা করব।
            </p>

            <button className="btn-whatsapp" onClick={openWhatsApp}>
              <MessageCircle size={20} />
              WhatsApp এ অর্ডার করুন
            </button>

            <div className="gate-allowed-list">
              <p className="gate-small-label">আমরা এখন ডেলিভারি করি:</p>
              <div className="gate-tags">
                {loc.allowedDistricts.map(d => (
                  <span key={d} className="gate-tag">{d}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {loc.status === 'error' && (
          <div className="gate-content">
            <div className="gate-icon-wrap gate-icon-red">
              <AlertCircle size={32} />
            </div>
            <h2>Location পাওয়া যায়নি</h2>
            <p>{loc.errorMsg}</p>
            <button className="btn-primary-gate" onClick={loc.requestLocation}>
              আবার চেষ্টা করুন
            </button>
            <button className="btn-skip" onClick={openWhatsApp}>
              <MessageCircle size={16} />
              WhatsApp এ যোগাযোগ করুন
            </button>
          </div>
        )}
      </div>

      <style>{`
        .location-gate-overlay {
          position: fixed;
          inset: 0;
          background: linear-gradient(135deg, #fff0f3 0%, #ffe4ec 50%, #ffd6e7 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }
        .location-gate-card {
          background: white;
          border-radius: 28px;
          padding: 40px 36px;
          max-width: 420px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(188, 30, 80, 0.12);
          text-align: center;
        }
        .gate-brand { margin-bottom: 32px; }
        .gate-cake-icon { font-size: 48px; margin-bottom: 8px; }
        .gate-brand h1 {
          font-size: 24px;
          font-weight: 800;
          color: #b01453;
          margin: 0 0 6px;
          font-family: 'Noto Serif Bengali', serif;
        }
        .gate-tagline {
          color: #888;
          font-size: 13px;
          margin: 0;
          font-family: 'Noto Sans Bengali', sans-serif;
        }
        .gate-content { display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .gate-center { text-align: center; }
        .gate-icon-wrap {
          width: 72px; height: 72px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
        }
        .gate-icon-pink { background: #fff0f3; color: #c41458; }
        .gate-icon-orange { background: #fff7ed; color: #ea6c00; }
        .gate-icon-red { background: #fff0f0; color: #dc2626; }
        .gate-content h2 {
          font-size: 20px; font-weight: 700; color: #1a1a1a; margin: 0;
          font-family: 'Noto Serif Bengali', serif;
        }
        .gate-content p {
          color: #555; font-size: 14px; line-height: 1.7; margin: 0;
          font-family: 'Noto Sans Bengali', sans-serif;
        }
        .gate-subtext { color: #777; font-size: 13px !important; }
        .btn-primary-gate {
          display: flex; align-items: center; gap: 10px;
          background: linear-gradient(135deg, #c41458, #e91e87);
          color: white; border: none; border-radius: 14px;
          padding: 14px 28px; font-size: 15px; font-weight: 700;
          cursor: pointer; width: 100%; justify-content: center;
          font-family: 'Noto Sans Bengali', sans-serif;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .btn-primary-gate:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(196,20,88,0.3); }
        .btn-whatsapp {
          display: flex; align-items: center; gap: 10px;
          background: #25d366; color: white; border: none; border-radius: 14px;
          padding: 14px 28px; font-size: 15px; font-weight: 700;
          cursor: pointer; width: 100%; justify-content: center;
          font-family: 'Noto Sans Bengali', sans-serif;
          transition: transform 0.15s;
        }
        .btn-whatsapp:hover { transform: translateY(-2px); }
        .btn-skip {
          display: flex; align-items: center; gap: 8px;
          background: none; border: 1.5px solid #e0e0e0; border-radius: 12px;
          padding: 11px 20px; font-size: 13px; color: #666; cursor: pointer;
          font-family: 'Noto Sans Bengali', sans-serif;
          width: 100%; justify-content: center;
        }
        .gate-spinner { animation: spin 1s linear infinite; color: #c41458; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .gate-success-icon { color: #16a34a; }
        .gate-loading-bar {
          width: 100%; height: 4px; background: #f0f0f0; border-radius: 2px; overflow: hidden;
        }
        .gate-loading-bar-fill {
          height: 100%; background: linear-gradient(90deg, #c41458, #e91e87);
          border-radius: 2px; animation: loadbar 1.5s ease forwards;
        }
        @keyframes loadbar { from { width: 0% } to { width: 100% } }
        .gate-small { color: #999; font-size: 12px !important; }
        .gate-allowed-list { width: 100%; text-align: left; }
        .gate-small-label { font-size: 12px; color: #999; margin-bottom: 8px; }
        .gate-tags { display: flex; flex-wrap: wrap; gap: 8px; }
        .gate-tag {
          background: #fff0f3; color: #c41458; border-radius: 8px;
          padding: 4px 12px; font-size: 13px; font-weight: 600;
          font-family: 'Noto Sans Bengali', sans-serif;
        }
      `}</style>
    </div>
  );
};

export default LocationGate;
