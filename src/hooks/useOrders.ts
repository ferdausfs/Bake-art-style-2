import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore, useSettingsStore, useOrders as useOrdersStore, useUI } from '../lib/store';
import { isSupabaseConfigured, playBeep } from '../lib/utils';
import type { Order } from '../types';

type DbOrderRow = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  district?: string | null;
  delivery_date: string;
  delivery_time: string;
  payment_method: Order['payment'] | string;
  items: Order['items'];
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: Order['status'] | 'pending' | 'preparing' | 'delivering';
  created_at: string;
};

const normalizeStatus = (status: DbOrderRow['status']): Order['status'] => {
  if (status === 'pending') return 'placed';
  if (status === 'preparing') return 'baking';
  if (status === 'delivering') return 'out';
  return status as Order['status'];
};

const mapDbOrder = (o: DbOrderRow): Order => ({
  id: o.id,
  items: Array.isArray(o.items) ? o.items : [],
  customer: {
    name: o.customer_name ?? '',
    phone: o.customer_phone ?? '',
    email: '',
    address: o.customer_address ?? '',
    city: o.district ?? '',
    pin: '',
  },
  delivery: {
    date: o.delivery_date ?? '',
    time: o.delivery_time ?? '',
  },
  payment: (['bkash', 'nagad', 'cash'].includes(String(o.payment_method))
    ? o.payment_method
    : 'cash') as Order['payment'],
  subtotal: Number(o.subtotal ?? 0),
  deliveryFee: Number(o.delivery_fee ?? 0),
  total: Number(o.total ?? 0),
  status: normalizeStatus(o.status),
  createdAt: o.created_at ? new Date(o.created_at).getTime() : Date.now(),
});

export function useOrdersHook() {
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((s) => s.user);
  const settings = useSettingsStore((s) => s.settings);
  const { orders, setOrders, setOrderStatus } = useOrdersStore();
  const incrementNewOrders = useUI((s) => s.incrementNewOrders);

  const fetchOrders = useCallback(async () => {
    if (!isSupabaseConfigured()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300);

      if (error) throw error;

      const mapped = (data ?? []).map((row) => mapDbOrder(row as DbOrderRow));
      setOrders(mapped);
    } catch (e) {
      console.warn('Orders fetch failed, using local:', e);
    } finally {
      setLoading(false);
    }
  }, [setOrders, user?.id, settings.adminEmail]);

  const updateStatus = useCallback(async (id: string, status: Order['status']) => {
    setOrderStatus(id, status);

    if (!isSupabaseConfigured()) return;

    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id);

    if (error) console.error('Status update error:', error);
  }, [setOrderStatus]);

  const subscribeToNewOrders = useCallback(() => {
    if (!isSupabaseConfigured()) return () => {};

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const channel = supabase
      .channel('new-orders-admin')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        () => {
          playBeep();
          incrementNewOrders();
          fetchOrders();

          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🎂 New Order!', { body: 'A new order has been placed.' });
          }
        }
      )
      .subscribe();

    // Fallback polling: realtime না চললেও admin panel order পাবে।
    const timer = window.setInterval(fetchOrders, 10000);

    return () => {
      window.clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [fetchOrders, incrementNewOrders]);

  return { orders, loading, fetchOrders, updateStatus, subscribeToNewOrders };
}
