import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore, useOrders as useOrdersStore, useUI } from '../lib/store';
import { isSupabaseConfigured, playBeep } from '../lib/utils';
import type { Order } from '../types';

type DbOrderRow = {
  id: string;
  user_id?: string | null;
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
  userId: o.user_id || undefined,
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
  }, [setOrders]);

  const fetchMyOrders = useCallback(async () => {
    if (!isSupabaseConfigured() || !user?.id) return;

    setLoading(true);

    try {
      let userContact: string | null = null;
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('contact')
          .eq('id', user.id)
          .single();
        if (profile?.contact) {
          userContact = profile.contact;
        }
      } catch (profileErr) {
        console.warn('Profile fetch failed, continuing without profile correlation:', profileErr);
      }

      let query = supabase.from('orders').select('*');
      if (userContact) {
        query = query.or(`user_id.eq.${user.id},customer_phone.eq.${userContact}`);
      } else {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const fetchedOrders = data.map((row) => mapDbOrder(row as DbOrderRow));
        const localOrders = useOrdersStore.getState().orders;
        
        const merged = [...localOrders];
        fetchedOrders.forEach((fo) => {
          const idx = merged.findIndex((o) => o.id === fo.id);
          if (idx > -1) {
            merged[idx] = fo;
          } else {
            merged.push(fo);
          }
        });
        
        merged.sort((a, b) => b.createdAt - a.createdAt);
        setOrders(merged);
      }
    } catch (e) {
      console.warn('My orders fetch failed, using local orders:', e);
    } finally {
      setLoading(false);
    }
  }, [setOrders, user?.id]);

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

    let channel: any = null;
    const channelName = `new-orders-admin-${Date.now()}`;

    try {
      channel = supabase
        .channel(channelName)
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
    } catch (e) {
      console.warn('Realtime subscription failed:', e);
    }

    const timer = window.setInterval(fetchOrders, 10000);

    return () => {
      window.clearInterval(timer);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchOrders, incrementNewOrders]);

  return {
    orders: Array.isArray(orders) ? orders : [],
    loading,
    fetchOrders,
    fetchMyOrders,
    updateStatus,
    subscribeToNewOrders,
  };
}
