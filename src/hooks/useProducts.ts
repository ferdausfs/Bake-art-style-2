import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { DEFAULT_PRODUCTS } from '@/lib/data'
import { ls, isSupabaseConfigured, fileToBase64 } from '@/lib/utils'
import type { Product } from '@/types'

const LS_KEY = 'bake-products'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(() => ls.get(LS_KEY, DEFAULT_PRODUCTS))
  const [loading, setLoading] = useState(false)

  const fetchFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured()) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      if (data && data.length > 0) {
        setProducts(data as Product[])
        ls.set(LS_KEY, data)
      }
    } catch (e) {
      console.warn('Supabase fetch failed, using local data:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchFromSupabase() }, [fetchFromSupabase])

  const saveProduct = useCallback(async (product: Product) => {
    const updated = products.find((p) => p.id === product.id)
      ? products.map((p) => (p.id === product.id ? product : p))
      : [...products, product]
    setProducts(updated)
    ls.set(LS_KEY, updated)
    if (!isSupabaseConfigured()) return
    const { error } = await supabase.from('products').upsert(product)
    if (error) console.error('Supabase save error:', error)
  }, [products])

  const deleteProduct = useCallback(async (id: string) => {
    const updated = products.filter((p) => p.id !== id)
    setProducts(updated)
    ls.set(LS_KEY, updated)
    if (!isSupabaseConfigured()) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) console.error('Supabase delete error:', error)
  }, [products])

  // Upload product image - Supabase Storage or base64 fallback
  const uploadProductImage = useCallback(async (file: File): Promise<string> => {
    if (!isSupabaseConfigured()) return fileToBase64(file)
    const ext = file.name.split('.').pop()
    const path = `products/${Date.now()}.${ext}`
    const { data, error } = await supabase.storage.from('product-images').upload(path, file)
    if (error || !data) return fileToBase64(file)
    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path)
    return urlData.publicUrl
  }, [])

  return { products, loading, saveProduct, deleteProduct, uploadProductImage, refetch: fetchFromSupabase }
}
