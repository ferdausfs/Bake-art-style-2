import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Save, CheckSquare, Square, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BANGLADESH_DISTRICTS, DIVISIONS, getDistrictsByDivision } from '../../lib/districts';

export const DeliveryZoneSettings: React.FC = () => {
  const [allowedDistricts, setAllowedDistricts] = useState<string[]>([]);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [outOfZoneMsg, setOutOfZoneMsg] = useState('');
  const [zonesEnabled, setZonesEnabled] = useState(true);
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(new Set(['চট্টগ্রাম']));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', ['allowed_districts', 'whatsapp_number', 'delivery_zones_enabled', 'out_of_zone_message']);

    if (data) {
      const map: Record<string, any> = {};
      data.forEach(r => { map[r.key] = r.value; });
      setAllowedDistricts(map.allowed_districts || []);
      setWhatsappNumber(map.whatsapp_number || '');
      setZonesEnabled(map.delivery_zones_enabled !== false);
      setOutOfZoneMsg(map.out_of_zone_message || '');
    }
    setLoading(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    const updates = [
      { key: 'allowed_districts', value: allowedDistricts },
      { key: 'whatsapp_number', value: whatsappNumber },
      { key: 'delivery_zones_enabled', value: zonesEnabled },
      { key: 'out_of_zone_message', value: outOfZoneMsg },
    ];

    for (const update of updates) {
      await supabase
        .from('app_settings')
        .upsert({ key: update.key, value: update.value }, { onConflict: 'key' });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleDistrict = (districtName: string) => {
    setAllowedDistricts(prev =>
      prev.includes(districtName)
        ? prev.filter(d => d !== districtName)
        : [...prev, districtName]
    );
  };

  const toggleDivision = (division: string) => {
    const districts = getDistrictsByDivision(division).map(d => d.name);
    const allSelected = districts.every(d => allowedDistricts.includes(d));
    if (allSelected) {
      setAllowedDistricts(prev => prev.filter(d => !districts.includes(d)));
    } else {
      setAllowedDistricts(prev => [...new Set([...prev, ...districts])]);
    }
  };

  const toggleDivisionExpand = (division: string) => {
    setExpandedDivisions(prev => {
      const next = new Set(prev);
      if (next.has(division)) next.delete(division); else next.add(division);
      return next;
    });
  };

  const selectAll = () => setAllowedDistricts(BANGLADESH_DISTRICTS.map(d => d.name));
  const clearAll = () => setAllowedDistricts([]);

  if (loading) return (
    <div className="dz-loading">
      <div className="dz-spinner" />
      <p>Settings লোড হচ্ছে...</p>
    </div>
  );

  return (
    <div className="dz-root">

      {/* WhatsApp Number */}
      <div className="dz-card">
        <div className="dz-card-header">
          <Phone size={20} className="dz-icon-green" />
          <div>
            <h3>WhatsApp নম্বর</h3>
            <p>Out-of-zone customer দের এই নম্বরে পাঠানো হবে</p>
          </div>
        </div>
        <input
          className="dz-input"
          type="tel"
          placeholder="880XXXXXXXXXX (country code সহ)"
          value={whatsappNumber}
          onChange={e => setWhatsappNumber(e.target.value)}
        />
        <p className="dz-hint">উদাহরণ: 8801712345678</p>
      </div>

      {/* Zone Enable Toggle */}
      <div className="dz-card">
        <div className="dz-card-header">
          <MapPin size={20} className="dz-icon-pink" />
          <div>
            <h3>ডেলিভারি Zone System</h3>
            <p>বন্ধ করলে সব জেলা থেকে অর্ডার করা যাবে</p>
          </div>
          <label className="dz-toggle">
            <input
              type="checkbox"
              checked={zonesEnabled}
              onChange={e => setZonesEnabled(e.target.checked)}
            />
            <span className="dz-toggle-slider" />
          </label>
        </div>
      </div>

      {/* Out of Zone Message */}
      <div className="dz-card">
        <div className="dz-card-header">
          <div>
            <h3>Out-of-zone বার্তা</h3>
            <p>Zone এর বাইরের customer কে কী বলবে</p>
          </div>
        </div>
        <textarea
          className="dz-input dz-textarea"
          value={outOfZoneMsg}
          onChange={e => setOutOfZoneMsg(e.target.value)}
          rows={3}
        />
      </div>

      {/* District Selector */}
      {zonesEnabled && (
        <div className="dz-card">
          <div className="dz-card-header">
            <MapPin size={20} className="dz-icon-pink" />
            <div>
              <h3>ডেলিভারি জেলা নির্বাচন</h3>
              <p>
                <strong>{allowedDistricts.length}</strong> টি জেলা নির্বাচিত
                (মোট ৬৪টি থেকে)
              </p>
            </div>
          </div>

          <div className="dz-bulk-actions">
            <button className="dz-btn-small" onClick={selectAll}>সব নির্বাচন করুন</button>
            <button className="dz-btn-small dz-btn-outline" onClick={clearAll}>সব বাতিল করুন</button>
          </div>

          <div className="dz-selected-preview">
            {allowedDistricts.length === 0 ? (
              <span className="dz-no-selection">কোনো জেলা নির্বাচিত নয়</span>
            ) : (
              allowedDistricts.map(d => (
                <span key={d} className="dz-selected-tag" onClick={() => toggleDistrict(d)}>
                  {d} ✕
                </span>
              ))
            )}
          </div>

          <div className="dz-division-list">
            {DIVISIONS.map(division => {
              const districts = getDistrictsByDivision(division);
              const selectedCount = districts.filter(d => allowedDistricts.includes(d.name)).length;
              const allSelected = selectedCount === districts.length;
              const someSelected = selectedCount > 0 && !allSelected;
              const isExpanded = expandedDivisions.has(division);

              return (
                <div key={division} className="dz-division">
                  <div className="dz-division-header">
                    <button
                      className="dz-division-toggle"
                      onClick={() => toggleDivisionExpand(division)}
                    >
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <span className="dz-division-name">{division} বিভাগ</span>
                      <span className="dz-division-count">
                        {selectedCount}/{districts.length}
                      </span>
                    </button>
                    <button
                      className={`dz-division-select-all ${allSelected ? 'dz-active' : someSelected ? 'dz-partial' : ''}`}
                      onClick={() => toggleDivision(division)}
                    >
                      {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                      {allSelected ? 'সব বাতিল' : 'সব নির্বাচন'}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="dz-district-grid">
                      {districts.map(district => {
                        const isSelected = allowedDistricts.includes(district.name);
                        return (
                          <button
                            key={district.id}
                            className={`dz-district-btn ${isSelected ? 'dz-district-selected' : ''}`}
                            onClick={() => toggleDistrict(district.name)}
                          >
                            {isSelected && <CheckSquare size={14} />}
                            {!isSelected && <Square size={14} />}
                            {district.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Save Button */}
      <button
        className={`dz-save-btn ${saved ? 'dz-saved' : ''}`}
        onClick={saveSettings}
        disabled={saving}
      >
        {saving ? (
          <><div className="dz-btn-spinner" /> সংরক্ষণ হচ্ছে...</>
        ) : saved ? (
          <><CheckSquare size={18} /> সংরক্ষিত হয়েছে!</>
        ) : (
          <><Save size={18} /> পরিবর্তন সংরক্ষণ করুন</>
        )}
      </button>

      <style>{`
        .dz-root { display: flex; flex-direction: column; gap: 20px; max-width: 800px; }
        .dz-loading { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 40px; color: #666; }
        .dz-spinner {
          width: 36px; height: 36px; border: 3px solid #f0f0f0;
          border-top-color: #c41458; border-radius: 50%;
          animation: dzSpin 0.8s linear infinite;
        }
        @keyframes dzSpin { to { transform: rotate(360deg); } }
        .dz-card {
          background: white; border-radius: 16px;
          border: 1.5px solid #f0e0e8; padding: 24px;
          display: flex; flex-direction: column; gap: 16px;
        }
        .dz-card-header {
          display: flex; align-items: flex-start; gap: 14px;
        }
        .dz-card-header h3 {
          font-size: 16px; font-weight: 700; color: #1a1a1a;
          margin: 0 0 4px; font-family: 'Noto Sans Bengali', sans-serif;
        }
        .dz-card-header p {
          font-size: 13px; color: #888; margin: 0;
          font-family: 'Noto Sans Bengali', sans-serif;
        }
        .dz-card-header > div:first-of-type { flex: 1; }
        .dz-icon-pink { color: #c41458; margin-top: 2px; flex-shrink: 0; }
        .dz-icon-green { color: #16a34a; margin-top: 2px; flex-shrink: 0; }
        .dz-input {
          border: 1.5px solid #e8e8e8; border-radius: 10px;
          padding: 12px 14px; font-size: 14px; width: 100%; box-sizing: border-box;
          font-family: 'Noto Sans Bengali', sans-serif; outline: none;
          transition: border-color 0.15s;
        }
        .dz-input:focus { border-color: #c41458; }
        .dz-textarea { resize: vertical; min-height: 80px; }
        .dz-hint { font-size: 12px; color: #aaa; margin: -8px 0 0; font-family: monospace; }
        .dz-toggle { position: relative; display: inline-block; width: 52px; height: 28px; flex-shrink: 0; }
        .dz-toggle input { display: none; }
        .dz-toggle-slider {
          position: absolute; inset: 0; background: #ddd; border-radius: 28px; cursor: pointer;
          transition: background 0.2s;
        }
        .dz-toggle-slider::before {
          content: ''; position: absolute; width: 22px; height: 22px;
          background: white; border-radius: 50%; top: 3px; left: 3px;
          transition: transform 0.2s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.15);
        }
        .dz-toggle input:checked + .dz-toggle-slider { background: #c41458; }
        .dz-toggle input:checked + .dz-toggle-slider::before { transform: translateX(24px); }
        .dz-bulk-actions { display: flex; gap: 10px; }
        .dz-btn-small {
          padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600;
          background: #c41458; color: white; border: none; cursor: pointer;
          font-family: 'Noto Sans Bengali', sans-serif;
        }
        .dz-btn-outline { background: white; color: #c41458; border: 1.5px solid #c41458; }
        .dz-selected-preview {
          display: flex; flex-wrap: wrap; gap: 8px; min-height: 40px;
          background: #fafafa; border-radius: 10px; padding: 12px;
        }
        .dz-no-selection { color: #bbb; font-size: 13px; font-family: 'Noto Sans Bengali', sans-serif; }
        .dz-selected-tag {
          background: #fff0f3; color: #c41458; border-radius: 8px;
          padding: 4px 12px; font-size: 13px; font-weight: 600; cursor: pointer;
          font-family: 'Noto Sans Bengali', sans-serif;
          transition: background 0.15s;
        }
        .dz-selected-tag:hover { background: #ffd6e7; }
        .dz-division-list { display: flex; flex-direction: column; gap: 2px; }
        .dz-division { border-radius: 10px; overflow: hidden; border: 1.5px solid #f0e0e8; }
        .dz-division-header {
          display: flex; align-items: center; background: #fff8fa; padding: 4px 8px;
        }
        .dz-division-toggle {
          flex: 1; display: flex; align-items: center; gap: 8px;
          background: none; border: none; cursor: pointer; padding: 8px; text-align: left;
        }
        .dz-division-name {
          font-size: 14px; font-weight: 700; color: #333;
          font-family: 'Noto Sans Bengali', sans-serif;
        }
        .dz-division-count {
          font-size: 12px; color: #c41458; font-weight: 700;
          background: #fff0f3; padding: 2px 8px; border-radius: 10px;
        }
        .dz-division-select-all {
          display: flex; align-items: center; gap: 6px;
          background: none; border: 1px solid #e8e8e8; border-radius: 8px;
          padding: 6px 10px; font-size: 12px; color: #666; cursor: pointer;
          font-family: 'Noto Sans Bengali', sans-serif;
        }
        .dz-division-select-all.dz-active { color: #c41458; border-color: #c41458; background: #fff0f3; }
        .dz-division-select-all.dz-partial { color: #e87c00; border-color: #e87c00; }
        .dz-district-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 8px; padding: 12px;
        }
        .dz-district-btn {
          display: flex; align-items: center; gap: 6px;
          background: white; border: 1.5px solid #e8e8e8; border-radius: 8px;
          padding: 8px 10px; font-size: 13px; color: #444; cursor: pointer;
          font-family: 'Noto Sans Bengali', sans-serif; transition: all 0.15s;
          text-align: left;
        }
        .dz-district-btn:hover { border-color: #c41458; color: #c41458; }
        .dz-district-selected {
          background: #fff0f3; border-color: #c41458; color: #c41458; font-weight: 600;
        }
        .dz-save-btn {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          background: linear-gradient(135deg, #c41458, #e91e87);
          color: white; border: none; border-radius: 14px;
          padding: 16px; font-size: 16px; font-weight: 700; cursor: pointer;
          font-family: 'Noto Sans Bengali', sans-serif;
          transition: all 0.2s;
        }
        .dz-save-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(196,20,88,0.3); }
        .dz-save-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
        .dz-saved { background: linear-gradient(135deg, #16a34a, #22c55e) !important; }
        .dz-btn-spinner {
          width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.4);
          border-top-color: white; border-radius: 50%;
          animation: dzSpin 0.8s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default DeliveryZoneSettings;
