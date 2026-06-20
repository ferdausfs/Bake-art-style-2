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
  payment_method: string;
  items: Order['items'];
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: string;
  created_at: string;
};

const normalizeStatus = (status: string): Order['status'] => {
  if (status === 'pending') return 'placed';
  if (status === 'preparing') return 'baking';
  if (status === 'delivering') return 'out';
  if (status === 'confirmed') return 'confirmed';
  if (status === 'baking') return 'baking';
  if (status === 'ready') return 'ready';
  if (status === 'out') return 'out';
  if (status === 'delivered') return 'delivered';
  if (status === 'cancelled') return 'cancelled';
  return 'placed';
};

const normalizePayment = (payment: string): Order['payment'] => {
  if (payment === 'bkash') return 'bkash';
  if (payment === 'nagad') return 'nagad';
  return 'cash';
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
  payment: normalizePayment(o.payment_method),
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

      setOrders((data ?? []).map((row) => mapDbOrder(row as DbOrderRow)));
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

    fetchOrders();

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
            new Notification('🎂 New Order!', {
              body: 'A new order has been placed.',
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    const timer = window.setInterval(fetchOrders, 10000);

    return () => {
      window.clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [fetchOrders, incrementNewOrders]);

  return {
    orders,
    loading,
    fetchOrders,
    updateStatus,
    subscribeToNewOrders,
  };
}
