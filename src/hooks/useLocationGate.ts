import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { BANGLADESH_DISTRICTS, findDistrict } from '../lib/districts';

export type LocationStatus =
  | 'idle'
  | 'requesting'
  | 'detecting_district'
  | 'allowed'
  | 'denied'
  | 'out_of_zone'
  | 'error';

export interface LocationState {
  status: LocationStatus;
  district: string | null;          // Bengali name, e.g. "কুমিল্লা"
  districtEn: string | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
  allowedDistricts: string[];
  whatsappNumber: string;
  errorMsg: string | null;
}

const DEFAULT_WHATSAPP = '8801XXXXXXXXX';

// Reverse geocode using free Nominatim API (no key needed)
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=bn`,
      { headers: { 'User-Agent': 'BakeArtStyle/1.0' } }
    );
    const data = await res.json();
    // Try to extract district from address components
    const addr = data.address || {};
    return addr.county || addr.city_district || addr.state_district || addr.suburb || null;
  } catch {
    return null;
  }
}

// Match raw geocode result to our districts list
function matchDistrict(rawName: string | null): typeof BANGLADESH_DISTRICTS[0] | null {
  if (!rawName) return null;
  const lower = rawName.toLowerCase();
  return BANGLADESH_DISTRICTS.find(d =>
    lower.includes(d.nameEn.toLowerCase()) ||
    lower.includes(d.name) ||
    d.nameEn.toLowerCase().includes(lower)
  ) || null;
}

export function useLocationGate() {
  const [state, setState] = useState<LocationState>({
    status: 'idle',
    district: null,
    districtEn: null,
    lat: null,
    lng: null,
    address: null,
    allowedDistricts: [],
    whatsappNumber: DEFAULT_WHATSAPP,
    errorMsg: null,
  });

  // Load allowed districts + whatsapp from Supabase settings
  const loadSettings = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['allowed_districts', 'whatsapp_number']);

      if (!data) return { allowedDistricts: [], whatsappNumber: DEFAULT_WHATSAPP };

      const settings: Record<string, any> = {};
      data.forEach(row => { settings[row.key] = row.value; });

      return {
        allowedDistricts: (settings.allowed_districts as string[]) || [],
        whatsappNumber: (settings.whatsapp_number as string) || DEFAULT_WHATSAPP,
      };
    } catch {
      return { allowedDistricts: [], whatsappNumber: DEFAULT_WHATSAPP };
    }
  }, []);

  const requestLocation = useCallback(async () => {
    setState(prev => ({ ...prev, status: 'requesting', errorMsg: null }));

    const { allowedDistricts, whatsappNumber } = await loadSettings();

    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        status: 'error',
        allowedDistricts,
        whatsappNumber,
        errorMsg: 'আপনার browser GPS সাপোর্ট করে না।',
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setState(prev => ({
          ...prev,
          status: 'detecting_district',
          lat,
          lng,
          allowedDistricts,
          whatsappNumber,
        }));

        // Reverse geocode
        const rawAddress = await reverseGeocode(lat, lng);
        const matched = matchDistrict(rawAddress);

        const district = matched?.name || null;
        const districtEn = matched?.nameEn || null;

        // Check if in allowed zone
        const isAllowed =
          allowedDistricts.length === 0 || // no restriction set
          (district !== null && allowedDistricts.includes(district));

        setState(prev => ({
          ...prev,
          status: isAllowed ? 'allowed' : 'out_of_zone',
          district,
          districtEn,
          address: rawAddress,
          allowedDistricts,
          whatsappNumber,
        }));
      },
      (err) => {
        let msg = 'Location detect করা যায়নি।';
        if (err.code === 1) msg = 'Location permission দেননি। Settings থেকে allow করুন।';
        else if (err.code === 2) msg = 'Location পাওয়া যায়নি। আবার চেষ্টা করুন।';
        else if (err.code === 3) msg = 'Location timeout। আবার চেষ্টা করুন।';

        setState(prev => ({
          ...prev,
          status: 'error',
          allowedDistricts,
          whatsappNumber,
          errorMsg: msg,
        }));
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, [loadSettings]);

  return { ...state, requestLocation };
}
