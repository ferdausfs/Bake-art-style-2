import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ls, isSupabaseConfigured } from '@/lib/utils'
import type { Review } from '@/types'

const LS_KEY = 'bake-reviews'

export function useReviews(productId?: string) {
  const [reviews, setReviews] = useState<Review[]>(() => {
    const all = ls.get<Review[]>(LS_KEY, [])
    return productId ? all.filter((r) => r.product_id === productId && r.approved) : all
  })
  const [loading, setLoading] = useState(false)

  const fetchReviews = useCallback(async (pid?: string) => {
    if (!isSupabaseConfigured()) return
    setLoading(true)
    try {
      let query = supabase.from('reviews').select('*').order('created_at', { ascending: false })
      if (pid) query = query.eq('product_id', pid).eq('approved', true)
      const { data, error } = await query
      if (error) throw error
      if (data) {
        setReviews(data as Review[])
        if (!pid) ls.set(LS_KEY, data)
      }
    } catch (e) {
      console.warn('Reviews fetch failed:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const saveReview = useCallback(async (review: Review) => {
    const all = ls.get<Review[]>(LS_KEY, [])
    const updated = [review, ...all]
    ls.set(LS_KEY, updated)
    setReviews((prev) => [review, ...prev])
    if (!isSupabaseConfigured()) return
    await supabase.from('reviews').insert(review)
  }, [])

  const approveReview = useCallback(async (id: string, approved: boolean) => {
    const all = ls.get<Review[]>(LS_KEY, [])
    const updated = all.map((r) => (r.id === id ? { ...r, approved } : r))
    ls.set(LS_KEY, updated)
    setReviews(updated)
    if (!isSupabaseConfigured()) return
    await supabase.from('reviews').update({ approved }).eq('id', id)
  }, [])

  const deleteReview = useCallback(async (id: string) => {
    const all = ls.get<Review[]>(LS_KEY, [])
    const updated = all.filter((r) => r.id !== id)
    ls.set(LS_KEY, updated)
    setReviews(updated)
    if (!isSupabaseConfigured()) return
    await supabase.from('reviews').delete().eq('id', id)
  }, [])

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0

  return { reviews, loading, fetchReviews, saveReview, approveReview, deleteReview, avgRating }
}
