import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { products as DEFAULT_PRODUCTS } from '../lib/data';
import { isSupabaseConfigured, fileToBase64, ls, safeArray } from '../lib/utils';
import type { Product } from '../types';

const LS_KEY = 'bakeart-products-v2';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(() => safeArray<Product>(ls.get(LS_KEY, DEFAULT_PRODUCTS), DEFAULT_PRODUCTS));
  const [loading, setLoading] = useState(false);

  // 2A — use the `data` jsonb column as the single source of truth.
  const fetchFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, data') // only need id and the data jsonb column
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) {
        // Use the full product from data jsonb, fall back to a minimal object if data is null
        const products = safeArray<Product>(
          data.map((row: { id: string; data: unknown }) =>
            row.data ? (row.data as Product) : ({ id: row.id } as Product)
          )
        );
        if (products.length > 0) {
          setProducts(products);
          ls.set(LS_KEY, products);
        }
      }
    } catch (e) {
      console.warn('Products fetch failed, using local:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFromSupabase(); }, [fetchFromSupabase]);

  // 2D — realtime: when ANY client saves/deletes a product, all connected
  // devices refresh automatically.
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const channel = supabase
      .channel(`products-live-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchFromSupabase();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchFromSupabase]);

  // 2B — upsert: standard columns for the DB + the FULL Product object in `data`.
  const saveProduct = useCallback(async (product: Product) => {
    const all = safeArray<Product>(products, DEFAULT_PRODUCTS);
    const updated = all.find((p) => p.id === product.id)
      ? all.map((p) => (p.id === product.id ? product : p))
      : [...all, product];
    const validated = safeArray<Product>(updated);
    setProducts(validated);
    ls.set(LS_KEY, validated);

    if (!isSupabaseConfigured()) return;

    const { error } = await supabase.from('products').upsert({
      id: product.id,
      name: product.name,
      category: product.occasion || 'birthday',
      price: Math.round(product.price),
      rating: product.rating ?? 4.5,
      reviews: product.reviews ?? 0,
      tag: product.tags?.[0] ?? null,
      image: product.image ?? null,
      description: product.description ?? null,
      approved: product.inStock !== false,
      data: product, // ← store the FULL TypeScript Product object here
    }, { onConflict: 'id' });

    if (error) console.warn('Product save error:', error.message);
  }, [products]);

  // 2C — deleteProduct (unchanged, already correct)
  const deleteProduct = useCallback(async (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    const validated = safeArray<Product>(updated);
    setProducts(validated);
    ls.set(LS_KEY, validated);
    if (!isSupabaseConfigured()) return;
    await supabase.from('products').delete().eq('id', id);
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

  return { products, loading, saveProduct, deleteProduct, uploadProductImage, refetch: fetchFromSupabase };
}
