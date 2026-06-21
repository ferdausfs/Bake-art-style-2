import { useEffect, useMemo, useRef, useState } from 'react';
import { useUI, useAuthStore, useSettingsStore } from './lib/store';
import { isSupabaseConfigured } from './lib/utils';
import PhoneFrame from './components/PhoneFrame';
import BottomTabBar from './components/BottomTabBar';
import SplashScreen from './screens/SplashScreen';
import HomeScreen from './screens/HomeScreen';
import CategoriesScreen from './screens/CategoriesScreen';
import OrdersScreen from './screens/OrdersScreen';
import ProfileScreen from './screens/ProfileScreen';
import ProductScreen from './screens/ProductScreen';
import CustomizeScreen from './screens/CustomizeScreen';
import CartScreen from './screens/CartScreen';
import CheckoutScreen from './screens/CheckoutScreen';
import SuccessScreen from './screens/SuccessScreen';
import { AuthSheet } from './components/AuthSheet';
import { AdminPanel } from './components/AdminPanel';
import NotificationsSheet from './components/NotificationsSheet';
import WishlistScreen from './screens/WishlistScreen';
import TrackingScreen from './screens/TrackingScreen';
import AdminScreen from './screens/AdminScreen';

export default function App() {
  const { view, tab, chatOpen } = useUI();
  const { user } = useAuthStore();
  const { settings } = useSettingsStore();

  const [authOpen, setAuthOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [pendingAdminUnlock, setPendingAdminUnlock] = useState(false);
  const tapCount = useRef(0);
  const logoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isSupabaseConfigured()) {
      useSettingsStore.getState().loadRemoteSettings();
    }
  }, []);

  const normalizeEmail = (email?: string) => email?.trim().toLowerCase() ?? '';
  const isAdminUser = useMemo(() => {
    const userEmail = normalizeEmail(user?.email);
    const allowedAdminEmails = [settings.adminEmail, 'umuhammadiswa@gmail.com'];
    return !!userEmail && allowedAdminEmails.some((email) => normalizeEmail(email) === userEmail);
  }, [user?.email, settings.adminEmail]);

  useEffect(() => {
    if (!pendingAdminUnlock || !user) return;

    setPendingAdminUnlock(false);
    if (isAdminUser) {
      setAuthOpen(false);
      setAdminOpen(true);
    } else {
      console.log('Not admin email');
    }
  }, [pendingAdminUnlock, user, isAdminUser]);

  // 5-tap logo → admin. Before login it opens auth; after admin email login it unlocks.
  const handleLogoTap = () => {
    tapCount.current += 1;
    if (logoTimer.current) clearTimeout(logoTimer.current);
    if (tapCount.current >= 5) {
      tapCount.current = 0;
      // Admin email check
      if (isAdminUser) {
        setAdminOpen(true);
      } else if (!user) {
        // Not logged in — open auth first, then auto-unlock only for admin email.
        setPendingAdminUnlock(true);
        setAuthOpen(true);
      } else {
        // Wrong email — silent ignore
        console.log('Not admin email');
      }
    } else {
      logoTimer.current = setTimeout(() => { tapCount.current = 0; }, 3000);
    }
  };

  const activeTab = view.name === 'tabs' ? view.tab : tab;

  const screenKey = [
    view.name,
    view.name === 'tabs' ? activeTab : '',
    view.name === 'product' ? view.productId : '',
    view.name === 'customize' ? (view.productId ?? 'custom') : '',
    view.name === 'success' ? view.orderId : '',
    view.name === 'tracking' ? (view.orderId ?? '') : '',
    view.name === 'admin' ? (view.tab ?? 'dashboard') : '',
  ].join('-');

  const showTabBar = view.name === 'tabs' && !chatOpen && !authOpen && !adminOpen && !notificationsOpen;

  return (
    <PhoneFrame onLogoTap={handleLogoTap}>
      <div className="relative h-full w-full">
        <div key={screenKey} className="anim-fade h-full">
          {view.name === 'splash'                             && <SplashScreen />}
          {view.name === 'tabs' && activeTab === 'home'       && (
            <HomeScreen onLogoTap={handleLogoTap} onNotificationsOpen={() => setNotificationsOpen(true)} />
          )}
          {view.name === 'tabs' && activeTab === 'categories' && <CategoriesScreen />}
          {view.name === 'tabs' && activeTab === 'orders'     && (
            user ? <OrdersScreen /> : (
              <div className="flex flex-col h-full items-center justify-center gap-4 p-8 text-center">
                <div className="text-5xl">📋</div>
                <p className="font-bold text-ink text-lg">Sign in to view orders</p>
                <button onClick={() => setAuthOpen(true)}
                  className="px-6 py-3 rounded-2xl bg-coral text-white font-bold text-sm">
                  Sign In
                </button>
              </div>
            )
          )}
          {view.name === 'tabs' && activeTab === 'profile'    && (
            <ProfileScreen onAuthOpen={() => setAuthOpen(true)} />
          )}
          {view.name === 'product'   && <ProductScreen />}
          {view.name === 'customize' && <CustomizeScreen />}
          {view.name === 'cart'      && (
            user ? <CartScreen /> : (
              <div className="flex flex-col h-full items-center justify-center gap-4 p-8 text-center">
                <div className="text-5xl">🛒</div>
                <p className="font-bold text-ink text-lg">Sign in to view cart</p>
                <button onClick={() => setAuthOpen(true)}
                  className="px-6 py-3 rounded-2xl bg-coral text-white font-bold text-sm">
                  Sign In
                </button>
              </div>
            )
          )}
          {view.name === 'checkout'  && (
            user ? <CheckoutScreen /> : (
              <div className="flex flex-col h-full items-center justify-center gap-4 p-8 text-center bg-cream">
                <div className="text-5xl">🛍️</div>
                <p className="font-bold text-ink text-lg">Sign in to continue</p>
                <button onClick={() => setAuthOpen(true)}
                  className="px-6 py-3 rounded-2xl bg-coral text-white font-bold text-sm">
                  Sign In
                </button>
              </div>
            )
          )}
          {view.name === 'success'   && <SuccessScreen />}
          {view.name === 'wishlist'  && <WishlistScreen />}
          {view.name === 'tracking'  && <TrackingScreen />}
          {view.name === 'admin'     && <AdminScreen />}
        </div>

        {showTabBar && <BottomTabBar />}
        <NotificationsSheet open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
      </div>

      <AuthSheet open={authOpen} onClose={() => setAuthOpen(false)} onSuccess={() => setPendingAdminUnlock(true)} />
      {adminOpen && <AdminPanel onClose={() => setAdminOpen(false)} />}
    </PhoneFrame>
  );
}
