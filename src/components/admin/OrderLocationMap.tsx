import React, { useState, useEffect, useRef } from 'react';
import { MapPin, List, Map as MapIcon, RefreshCw, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface OrderLocation {
  id: string;
  order_number?: string;
  customer_name: string;
  district: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  total_amount: number;
  status: string;
  created_at: string;
}

interface DistrictStat {
  district: string;
  count: number;
  total: number;
}

type ViewMode = 'map' | 'list' | 'stats';

export const OrderLocationMap: React.FC = () => {
  const [orders, setOrders] = useState<OrderLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('stats');
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (viewMode === 'map' && orders.length > 0) {
      initMap();
    }
  }, [viewMode, orders]);

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('id, customer_name, district, gps_lat, gps_lng, total_amount, status, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    setOrders((data as OrderLocation[]) || []);
    setLoading(false);
  };

  const initMap = async () => {
    if (!mapRef.current || leafletMapRef.current) return;

    // Dynamically load Leaflet
    if (!window.L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
      document.head.appendChild(link);

      await new Promise<void>((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
        script.onload = () => resolve();
        document.head.appendChild(script);
      });
    }

    const L = window.L;
    const map = L.map(mapRef.current).setView([23.685, 90.356], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    // Custom pink marker
    const pinkIcon = L.divIcon({
      html: `<div style="
        width: 32px; height: 32px; background: #c41458;
        border-radius: 50% 50% 50% 0; transform: rotate(-45deg);
        border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      className: '',
    });

    // Add markers for orders with GPS
    orders.forEach(order => {
      if (order.gps_lat && order.gps_lng) {
        L.marker([order.gps_lat, order.gps_lng], { icon: pinkIcon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family: 'Noto Sans Bengali', sans-serif; min-width: 160px;">
              <strong>${order.customer_name}</strong><br/>
              <span style="color: #c41458">${order.district || 'অজানা'}</span><br/>
              ৳${order.total_amount}<br/>
              <small style="color: #888">${new Date(order.created_at).toLocaleDateString('bn-BD')}</small>
            </div>
          `);
      }
    });

    leafletMapRef.current = map;
    setMapLoaded(true);
  };

  // District statistics
  const districtStats = React.useMemo<DistrictStat[]>(() => {
    const map = new Map<string, { count: number; total: number }>();
    orders.forEach(o => {
      const key = o.district || 'অজানা';
      const existing = map.get(key) || { count: 0, total: 0 };
      map.set(key, {
        count: existing.count + 1,
        total: existing.total + (o.total_amount || 0),
      });
    });
    return Array.from(map.entries())
      .map(([district, data]) => ({ district, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [orders]);

  const ordersWithGPS = orders.filter(o => o.gps_lat && o.gps_lng).length;

  return (
    <div className="olm-root">
      {/* Header */}
      <div className="olm-header">
        <div>
          <h2>অর্ডার লোকেশন</h2>
          <p>{orders.length} টি অর্ডার · {ordersWithGPS} টিতে GPS আছে</p>
        </div>
        <div className="olm-actions">
          <div className="olm-view-tabs">
            <button
              className={`olm-tab ${viewMode === 'stats' ? 'olm-tab-active' : ''}`}
              onClick={() => setViewMode('stats')}
            >
              <TrendingUp size={15} /> পরিসংখ্যান
            </button>
            <button
              className={`olm-tab ${viewMode === 'map' ? 'olm-tab-active' : ''}`}
              onClick={() => setViewMode('map')}
            >
              <MapIcon size={15} /> ম্যাপ
            </button>
            <button
              className={`olm-tab ${viewMode === 'list' ? 'olm-tab-active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List size={15} /> তালিকা
            </button>
          </div>
          <button className="olm-refresh" onClick={fetchOrders}>
            <RefreshCw size={16} className={loading ? 'olm-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="olm-loading">
          <div className="olm-spinner" />
          <p>লোড হচ্ছে...</p>
        </div>
      ) : (
        <>
          {/* Stats View */}
          {viewMode === 'stats' && (
            <div className="olm-stats">
              <div className="olm-stat-grid">
                <div className="olm-stat-card">
                  <span className="olm-stat-num">{orders.length}</span>
                  <span className="olm-stat-label">মোট অর্ডার</span>
                </div>
                <div className="olm-stat-card">
                  <span className="olm-stat-num">{districtStats.length}</span>
                  <span className="olm-stat-label">জেলা থেকে</span>
                </div>
                <div className="olm-stat-card">
                  <span className="olm-stat-num">{ordersWithGPS}</span>
                  <span className="olm-stat-label">GPS সহ অর্ডার</span>
                </div>
                <div className="olm-stat-card">
                  <span className="olm-stat-num">
                    ৳{orders.reduce((s, o) => s + (o.total_amount || 0), 0).toLocaleString('bn-BD')}
                  </span>
                  <span className="olm-stat-label">মোট বিক্রয়</span>
                </div>
              </div>

              <div className="olm-district-table">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>জেলা</th>
                      <th>অর্ডার</th>
                      <th>বিক্রয়</th>
                      <th>শেয়ার</th>
                    </tr>
                  </thead>
                  <tbody>
                    {districtStats.map((stat, i) => (
                      <tr key={stat.district}>
                        <td className="olm-rank">{i + 1}</td>
                        <td>
                          <div className="olm-district-cell">
                            <MapPin size={13} />
                            {stat.district}
                          </div>
                        </td>
                        <td><strong>{stat.count}</strong></td>
                        <td>৳{stat.total.toLocaleString()}</td>
                        <td>
                          <div className="olm-bar-wrap">
                            <div
                              className="olm-bar"
                              style={{ width: `${(stat.count / orders.length) * 100}%` }}
                            />
                            <span>{Math.round((stat.count / orders.length) * 100)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Map View */}
          {viewMode === 'map' && (
            <div className="olm-map-container">
              <div ref={mapRef} className="olm-map" />
              {!mapLoaded && (
                <div className="olm-map-loading">
                  <div className="olm-spinner" />
                  <p>ম্যাপ লোড হচ্ছে...</p>
                </div>
              )}
              <div className="olm-map-note">
                {ordersWithGPS === 0
                  ? '⚠️ কোনো অর্ডারে GPS location নেই'
                  : `📍 ${ordersWithGPS} টি অর্ডার ম্যাপে দেখানো হচ্ছে`}
              </div>
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="olm-list">
              {orders.map(order => (
                <div key={order.id} className="olm-order-row">
                  <div className="olm-order-info">
                    <strong>{order.customer_name}</strong>
                    <span className={`olm-status olm-status-${order.status}`}>{order.status}</span>
                  </div>
                  <div className="olm-order-location">
                    <MapPin size={13} />
                    {order.district || 'অজানা এলাকা'}
                    {order.gps_lat && (
                      <span className="olm-gps-badge">GPS ✓</span>
                    )}
                  </div>
                  <div className="olm-order-meta">
                    <span>৳{order.total_amount}</span>
                    <span>{new Date(order.created_at).toLocaleDateString('bn-BD')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <style>{`
        .olm-root { display: flex; flex-direction: column; gap: 20px; }
        .olm-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
        .olm-header h2 { font-size: 20px; font-weight: 800; color: #1a1a1a; margin: 0 0 4px; font-family: 'Noto Sans Bengali', sans-serif; }
        .olm-header p { font-size: 13px; color: #888; margin: 0; font-family: 'Noto Sans Bengali', sans-serif; }
        .olm-actions { display: flex; gap: 10px; align-items: center; }
        .olm-view-tabs { display: flex; background: #f5f5f5; border-radius: 10px; padding: 4px; gap: 2px; }
        .olm-tab {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 8px; border: none; background: none;
          font-size: 13px; color: #666; cursor: pointer; font-family: 'Noto Sans Bengali', sans-serif;
          transition: all 0.15s;
        }
        .olm-tab-active { background: white; color: #c41458; font-weight: 700; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
        .olm-refresh {
          width: 38px; height: 38px; border-radius: 10px;
          border: 1.5px solid #e8e8e8; background: white; cursor: pointer;
          display: flex; align-items: center; justify-content: center; color: #666;
        }
        .olm-spin { animation: olmSpin 1s linear infinite; }
        @keyframes olmSpin { to { transform: rotate(360deg); } }
        .olm-loading { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px; color: #888; }
        .olm-spinner {
          width: 36px; height: 36px; border: 3px solid #f0e0e8;
          border-top-color: #c41458; border-radius: 50%;
          animation: olmSpin 0.8s linear infinite;
        }
        .olm-stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
        @media (max-width: 600px) { .olm-stat-grid { grid-template-columns: repeat(2, 1fr); } }
        .olm-stat-card {
          background: white; border: 1.5px solid #f0e0e8; border-radius: 14px;
          padding: 20px; display: flex; flex-direction: column; gap: 6px;
        }
        .olm-stat-num { font-size: 24px; font-weight: 800; color: #c41458; }
        .olm-stat-label { font-size: 12px; color: #888; font-family: 'Noto Sans Bengali', sans-serif; }
        .olm-district-table { background: white; border-radius: 14px; border: 1.5px solid #f0e0e8; overflow: hidden; }
        .olm-district-table table { width: 100%; border-collapse: collapse; }
        .olm-district-table th {
          background: #fff8fa; padding: 12px 16px; text-align: left;
          font-size: 12px; color: #888; font-weight: 600;
          font-family: 'Noto Sans Bengali', sans-serif; border-bottom: 1px solid #f0e0e8;
        }
        .olm-district-table td {
          padding: 12px 16px; font-size: 14px; color: #333;
          border-bottom: 1px solid #f8f0f4; font-family: 'Noto Sans Bengali', sans-serif;
        }
        .olm-district-table tr:last-child td { border-bottom: none; }
        .olm-district-table tr:hover td { background: #fff8fa; }
        .olm-rank { color: #bbb; font-weight: 700; }
        .olm-district-cell { display: flex; align-items: center; gap: 6px; color: #c41458; font-weight: 600; }
        .olm-bar-wrap { display: flex; align-items: center; gap: 8px; }
        .olm-bar { height: 6px; background: linear-gradient(90deg, #c41458, #e91e87); border-radius: 3px; min-width: 2px; max-width: 120px; }
        .olm-bar-wrap span { font-size: 12px; color: #888; }
        .olm-map-container { position: relative; border-radius: 16px; overflow: hidden; }
        .olm-map { height: 480px; width: 100%; border-radius: 16px; }
        .olm-map-loading {
          position: absolute; inset: 0; background: rgba(255,255,255,0.9);
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;
        }
        .olm-map-note {
          background: white; padding: 10px 16px; font-size: 13px; color: #666;
          font-family: 'Noto Sans Bengali', sans-serif; border-top: 1px solid #f0e0e8;
        }
        .olm-list { display: flex; flex-direction: column; gap: 1px; }
        .olm-order-row {
          background: white; border: 1.5px solid #f0e0e8; border-radius: 12px;
          padding: 14px 16px; display: flex; align-items: center; gap: 16px;
          flex-wrap: wrap;
        }
        .olm-order-info { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 140px; font-family: 'Noto Sans Bengali', sans-serif; }
        .olm-order-location { display: flex; align-items: center; gap: 6px; color: #c41458; font-size: 13px; font-family: 'Noto Sans Bengali', sans-serif; }
        .olm-order-meta { display: flex; gap: 16px; font-size: 13px; color: #888; font-family: 'Noto Sans Bengali', sans-serif; }
        .olm-status { padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; }
        .olm-status-pending { background: #fff7ed; color: #ea6c00; }
        .olm-status-confirmed { background: #f0fdf4; color: #16a34a; }
        .olm-status-delivered { background: #eff6ff; color: #2563eb; }
        .olm-gps-badge { background: #f0fdf4; color: #16a34a; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px; }
      `}</style>
    </div>
  );
};

declare global {
  interface Window { L: any; }
}

export default OrderLocationMap;
