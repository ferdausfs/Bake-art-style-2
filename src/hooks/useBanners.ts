import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { banners as DEFAULT_BANNERS } from '../lib/data';
import { isSupabaseConfigured, fileToBase64, ls, safeArray } from '../lib/utils';
import type { Banner } from '../types';

const LS_KEY = 'bakeart-banners-v2';

export function useBanners() {
  const [banners, setBanners] = useState<Banner[]>(() => safeArray<Banner>(ls.get(LS_KEY, DEFAULT_BANNERS), DEFAULT_BANNERS));
  const [loading, setLoading] = useState(false);

  const fetchFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('banners').select('*').order('sort_order', { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) {
        const validated = safeArray<Banner>(data);
        setBanners(validated);
        ls.set(LS_KEY, validated);
      }
    } catch (e) { console.warn('Banners fetch failed, using local data:', e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFromSupabase(); }, [fetchFromSupabase]);

  const saveBanner = useCallback(async (banner: Banner) => {
    const updated = banners.find((b) => b.id === banner.id)
      ? banners.map((b) => (b.id === banner.id ? banner : b))
      : [...banners, banner];
    const validated = safeArray<Banner>(updated);
    setBanners(validated);
    ls.set(LS_KEY, validated);
    if (!isSupabaseConfigured()) return;
    await supabase.from('banners').upsert(banner);
  }, [banners]);

  const deleteBanner = useCallback(async (id: string) => {
    const updated = banners.filter((b) => b.id !== id);
    const validated = safeArray<Banner>(updated);
    setBanners(validated);
    ls.set(LS_KEY, validated);
    if (!isSupabaseConfigured()) return;
    await supabase.from('banners').delete().eq('id', id);
  }, [banners]);

  const uploadBannerImage = useCallback(async (file: File): Promise<string> => {
    if (!isSupabaseConfigured()) return fileToBase64(file);
    const ext = file.name.split('.').pop();
    const path = `banners/${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage.from('banner-images').upload(path, file);
    if (error || !data) return fileToBase64(file);
    const { data: urlData } = supabase.storage.from('banner-images').getPublicUrl(path);
    return urlData.publicUrl;
  }, []);

  return { banners, loading, saveBanner, deleteBanner, uploadBannerImage, refetch: fetchFromSupabase };
}
