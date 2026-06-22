import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useOrders } from '../lib/store';
import { isSupabaseConfigured } from '../lib/utils';

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  totalSpent: number;
  orderCount: number;
  lastOrderDate: number;
  source: 'google' | 'otp' | 'guest';
};

export function useCustomers() {
  const { orders } = useOrders();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      if (isSupabaseConfigured()) {
        try {
          const { data } = await supabase.from('profiles').select('*');
          if (alive) setCustomers(aggregateFromOrders(orders, data || []));
        } catch {
          if (alive) setCustomers(aggregateFromOrders(orders));
        } finally {
          if (alive) setLoading(false);
        }
      } else {
        setCustomers(aggregateFromOrders(orders));
        setLoading(false);
      }
    }

    load();
    return () => { alive = false; };
  }, [orders]);

  return { customers, loading };
}

function aggregateFromOrders(orders: any[], profiles: any[] = []): Customer[] {
  const map = new Map<string, Customer>();

  profiles.forEach((p) => {
    map.set(p.id, {
      id: p.id,
      name: p.name || p.email?.split('@')[0] || 'Anonymous',
      email: p.email || '',
      phone: p.phone || p.contact || '',
      avatar: p.avatar || '',
      totalSpent: 0,
      orderCount: 0,
      lastOrderDate: 0,
      source: p.email?.endsWith('@gmail.com') ? 'google' : 'otp',
    });
  });

  orders.forEach((o) => {
    if (!o) return;
    const key = o.userId || o.user_id || o.customer?.phone || `guest-${o.id}`;
    const prev = map.get(key);

    if (prev) {
      prev.totalSpent += o.total || 0;
      prev.orderCount += 1;
      prev.lastOrderDate = Math.max(prev.lastOrderDate, o.createdAt || 0);
      if (o.customer?.name) prev.name = o.customer.name;
      if (o.customer?.email) prev.email = o.customer.email;
      if (o.customer?.phone) prev.phone = o.customer.phone;
    } else {
      map.set(key, {
        id: key,
        name: o.customer?.name || 'Guest',
        email: o.customer?.email || '',
        phone: o.customer?.phone || '',
        avatar: '',
        totalSpent: o.total || 0,
        orderCount: 1,
        lastOrderDate: o.createdAt || Date.now(),
        source: 'guest',
      });
    }
  });

  return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
}
