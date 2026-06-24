import { useEffect, useMemo, useState } from 'react';
import { Package } from 'lucide-react';
import { useUI, useAuthStore, useSettingsStore, pushBrowserRouteState } from './lib/store';
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
import NotificationsSheet from './components/NotificationsSheet';
import WishlistScreen from './screens/WishlistScreen';
import TrackingScreen from './screens/TrackingScreen';
import AdminScreen from './screens/AdminScreen';

export default function App() {
  const { view, tab, chatOpen } = useUI();
  const { user } = useAuthStore();
  const { settings } = useSettingsStore();

  const [authOpen, setAuthOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    if (isSupabaseConfigured()) {
      useSettingsStore.getState().loadRemoteSettings().finally(() => {
        setSettingsLoading(false);
      });
    } else {
      setSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1. Initial push to trap history
    pushBrowserRouteState();

    // 2. Popstate listener to handle back gestures
    const handlePopState = () => {
      const { history: uiHistory, back: uiBack } = useUI.getState();

      if (uiHistory.length > 0) {
        uiBack();
        pushBrowserRouteState();
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const normalizeEmail = (email?: string) => email?.trim().toLowerCase() ?? '';
  const isAdminUser = useMemo(() => {
    if (settingsLoading) return false;
    const userEmail = normalizeEmail(user?.email);
    const allowedAdminEmails = [settings.adminEmail, 'umuhammadiswa@gmail.com'];
    return !!userEmail && allowedAdminEmails.some((email) => normalizeEmail(email) === userEmail);
  }, [user?.email, settings.adminEmail, settingsLoading]);

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

  const showTabBar = view.name === 'tabs' && !chatOpen && !authOpen && !notificationsOpen;

  return (
    <PhoneFrame>
      <div className="relative h-full w-full">
        <div key={screenKey} className="anim-fade h-full">
          {view.name === 'splash'                             && <SplashScreen />}
          {view.name === 'tabs' && activeTab === 'home'       && (
            <HomeScreen onNotificationsOpen={() => setNotificationsOpen(true)} />
          )}
          {view.name === 'tabs' && activeTab === 'categories' && <CategoriesScreen />}
          {view.name === 'tabs' && activeTab === 'orders'     && (
            user ? <OrdersScreen /> : (
              <div className="flex flex-col h-full items-center justify-center gap-4 p-8 text-center">
                <div className="text-ink-200 opacity-60">
                  <Package size={48} strokeWidth={1.5} />
                </div>
                <p className="font-bold text-ink text-lg">Sign in to view orders</p>
                <button onClick={() => setAuthOpen(true)}
                  className="px-6 py-3 rounded-2xl bg-coral text-white font-bold text-sm">
                  Sign In
                </button>
              </div>
            )
          )}
          {view.name === 'tabs' && activeTab === 'profile'    && (
            <ProfileScreen onAuthOpen={() => setAuthOpen(true)} isAdmin={isAdminUser} />
          )}
          {view.name === 'product'   && <ProductScreen />}
          {view.name === 'customize' && <CustomizeScreen />}
          {view.name === 'cart'      && <CartScreen />}
          {view.name === 'checkout'  && <CheckoutScreen />}
          {view.name === 'success'   && <SuccessScreen />}
          {view.name === 'wishlist'  && <WishlistScreen />}
          {view.name === 'tracking'  && <TrackingScreen />}
          {view.name === 'admin'     && <AdminScreen />}
        </div>

        {showTabBar && <BottomTabBar />}
        <NotificationsSheet open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
      </div>

      <AuthSheet open={authOpen} onClose={() => setAuthOpen(false)} />
    </PhoneFrame>
  );
}
