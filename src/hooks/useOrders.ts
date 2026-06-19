import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore, useSettingsStore, useUIStore } from '@/lib/store'
import { ls, isSupabaseConfigured, playBeep } from '@/lib/utils'
import type { Order } from '@/types'
import toast from 'react-hot-toast'

const LS_KEY = 'bake-orders'

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>(() => ls.get(LS_KEY, []))
  const [loading, setLoading] = useState(false)
  const user = useAuthStore((s) => s.user)
  const settings = useSettingsStore((s) => s.settings)
  const incrementNewOrders = useUIStore((s) => s.incrementNewOrders)

  const isAdmin = (email?: string) =>
    email === settings.adminEmail

  const fetchOrders = useCallback(async () => {
    if (!isSupabaseConfigured()) return
    setLoading(true)
    try {
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(200)
      if (user && !isAdmin(user.email)) {
        query = query.eq('user_id', user.id)
      }
      const { data, error } = await query
      if (error) throw error
      if (data) { setOrders(data as Order[]); ls.set(LS_KEY, data) }
    } catch (e) {
      console.warn('Orders fetch failed, using local:', e)
    } finally {
      setLoading(false)
    }
  }, [user, settings.adminEmail])

  const saveOrder = useCallback(async (order: Order) => {
    const enriched: Order = { ...order, user_id: user?.id ?? order.user_id }
    const updated = [enriched, ...orders].slice(0, 200)
    setOrders(updated)
    ls.set(LS_KEY, updated)
    if (!isSupabaseConfigured()) return
    const { error } = await supabase.from('orders').insert(enriched)
    if (error) console.error('Order save error:', error)
  }, [orders, user])

  const updateStatus = useCallback(async (id: string, status: Order['status']) => {
    const updated = orders.map((o) => (o.id === id ? { ...o, status } : o))
    setOrders(updated)
    ls.set(LS_KEY, updated)
    if (!isSupabaseConfigured()) return
    const { error } = await supabase.from('orders').update({ status }).eq('id', id)
    if (error) console.error('Status update error:', error)
  }, [orders])

  const getOrderById = useCallback((id: string): Order | undefined => {
    return orders.find((o) => o.id === id)
  }, [orders])

  // Realtime subscription for admin new order notifications
  const subscribeToNewOrders = useCallback(() => {
    if (!isSupabaseConfigured()) return () => {}
    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    const channel = supabase
      .channel('new-orders-admin')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        const newOrder = payload.new as Order
        // Play sound
        playBeep()
        // Increment badge
        incrementNewOrders()
        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🎂 নতুন অর্ডার!', {
            body: `${newOrder.customer_name} — ${newOrder.total}৳`,
            icon: '/icon-192.png',
          })
        }
        // Toast
        toast.success(`নতুন অর্ডার এসেছে! 🎂 ${newOrder.id}`, { duration: 6000 })
        // Refresh
        fetchOrders()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchOrders, incrementNewOrders])

  // Upload payment screenshot
  const uploadPaymentScreenshot = useCallback(async (file: File): Promise<string> => {
    const { fileToBase64: b64 } = await import('@/lib/utils')
    if (!isSupabaseConfigured()) return b64(file)
    const ext = file.name.split('.').pop()
    const path = `payments/${Date.now()}.${ext}`
    const { data, error } = await supabase.storage.from('payment-screenshots').upload(path, file)
    if (error || !data) return b64(file)
    const { data: urlData } = supabase.storage.from('payment-screenshots').getPublicUrl(path)
    return urlData.publicUrl
  }, [])

  return {
    orders, loading, fetchOrders, saveOrder, updateStatus,
    getOrderById, subscribeToNewOrders, uploadPaymentScreenshot,
  }
}
