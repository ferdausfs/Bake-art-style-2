import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore, useSettingsStore, useOrders as useOrdersStore, useUI } from '../lib/store';
import { isSupabaseConfigured, playBeep } from '../lib/utils';
import type { Order } from '../types';

export function useOrdersHook() {
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((s) => s.user);
  const settings = useSettingsStore((s) => s.settings);
  const { orders, setOrderStatus } = useOrdersStore();
  const incrementNewOrders = useUI((s) => s.incrementNewOrders);

  const fetchOrders = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('orders').select('*').order('createdAt', { ascending: false }).limit(200);
      if (error) throw error;
    } catch (e) {
      console.warn('Orders fetch failed, using local:', e);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, settings.adminEmail]);

  const updateStatus = useCallback(async (id: string, status: Order['status']) => {
    setOrderStatus(id, status);
    if (!isSupabaseConfigured()) return;
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) console.error('Status update error:', error);
  }, [setOrderStatus]);

  const subscribeToNewOrders = useCallback(() => {
    if (!isSupabaseConfigured()) return () => {};
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    const channel = supabase
      .channel('new-orders-admin')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
        playBeep();
        incrementNewOrders();
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🎂 New Order!', { body: 'A new order has been placed.' });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [incrementNewOrders]);

  return { orders, loading, fetchOrders, updateStatus, subscribeToNewOrders };
}
