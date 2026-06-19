import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ls, isSupabaseConfigured, fileToBase64 } from '@/lib/utils'
import type { GalleryItem } from '@/types'

const LS_KEY = 'bake-gallery'

export function useGallery() {
  const [gallery, setGallery] = useState<GalleryItem[]>(() => ls.get(LS_KEY, []))
  const [loading, setLoading] = useState(false)

  const fetchGallery = useCallback(async () => {
    if (!isSupabaseConfigured()) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('gallery_items')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      if (data) { setGallery(data as GalleryItem[]); ls.set(LS_KEY, data) }
    } catch (e) {
      console.warn('Gallery fetch failed:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const saveGalleryItem = useCallback(async (item: GalleryItem) => {
    const updated = gallery.find((g) => g.id === item.id)
      ? gallery.map((g) => (g.id === item.id ? item : g))
      : [item, ...gallery]
    setGallery(updated)
    ls.set(LS_KEY, updated)
    if (!isSupabaseConfigured()) return
    await supabase.from('gallery_items').upsert(item)
  }, [gallery])

  const deleteGalleryItem = useCallback(async (id: string) => {
    const updated = gallery.filter((g) => g.id !== id)
    setGallery(updated)
    ls.set(LS_KEY, updated)
    if (!isSupabaseConfigured()) return
    await supabase.from('gallery_items').delete().eq('id', id)
  }, [gallery])

  const uploadGalleryImage = useCallback(async (file: File): Promise<string> => {
    if (!isSupabaseConfigured()) return fileToBase64(file)
    const ext = file.name.split('.').pop()
    const path = `gallery/${Date.now()}.${ext}`
    const { data, error } = await supabase.storage.from('gallery').upload(path, file)
    if (error || !data) return fileToBase64(file)
    const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(path)
    return urlData.publicUrl
  }, [])

  return { gallery, loading, fetchGallery, saveGalleryItem, deleteGalleryItem, uploadGalleryImage }
}
