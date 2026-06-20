import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { products as DEFAULT_PRODUCTS } from '../lib/data';
import { isSupabaseConfigured, fileToBase64 } from '../lib/utils';
import type { Product } from '../types';

const LS_KEY = 'bakeart-products';
const REMOTE_KEY = 'products_v2';

const lsGet = <T>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) as T : fallback;
  } catch {
    return fallback;
  }
};

const lsSet = <T>(key: string, val: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
};

async function readRemoteProducts(): Promise<Product[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', REMOTE_KEY)
      .maybeSingle();

    if (error) throw error;
    return (data?.value as Product[]) ?? null;
  } catch (e) {
    console.warn('Products remote fetch failed, using local data:', e);
    return null;
  }
}

async function writeRemoteProducts(products: Product[]) {
  if (!isSupabaseConfigured()) return;
  try {
    const { error } = await supabase
      .from('app_settings')
      .upsert(
        { key: REMOTE_KEY, value: products, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

    if (error) throw error;
  } catch (e) {
    console.warn('Products remote save failed:', e);
  }
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(() => lsGet(LS_KEY, DEFAULT_PRODUCTS));
  const [loading, setLoading] = useState(false);

  const fetchFromSupabase = useCallback(async () => {
    setLoading(true);
    try {
      const remote = await readRemoteProducts();

      if (remote && remote.length > 0) {
        setProducts(remote);
        lsSet(LS_KEY, remote);
      } else if (isSupabaseConfigured()) {
        await writeRemoteProducts(lsGet(LS_KEY, DEFAULT_PRODUCTS));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFromSupabase();
  }, [fetchFromSupabase]);

  const saveProduct = useCallback(async (product: Product) => {
    const updated = products.find((p) => p.id === product.id)
      ? products.map((p) => (p.id === product.id ? product : p))
      : [...products, product];

    setProducts(updated);
    lsSet(LS_KEY, updated);
    await writeRemoteProducts(updated);
  }, [products]);

  const deleteProduct = useCallback(async (id: string) => {
    const updated = products.filter((p) => p.id !== id);

    setProducts(updated);
    lsSet(LS_KEY, updated);
    await writeRemoteProducts(updated);
  }, [products]);

  const uploadProductImage = useCallback(async (file: File): Promise<string> => {
    if (!isSupabaseConfigured()) return fileToBase64(file);

    const ext = file.name.split('.').pop();
    const path = `products/${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage.from('product-images').upload(path, file);
    if (error || !data) return fileToBase64(file);

    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
    return urlData.publicUrl;
  }, []);

  return {
    products,
    loading,
    saveProduct,
    deleteProduct,
    uploadProductImage,
    refetch: fetchFromSupabase,
  };
}
