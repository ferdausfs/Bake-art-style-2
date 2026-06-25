import { useEffect, useMemo, useState } from 'react';
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
import AppErrorBoundary from './components/AppErrorBoundary';

export default function App() {
  const { view, tab, chatOpen } = useUI();
  const { user } = useAuthStore();
  const { settings } = useSettingsStore();

  const [authOpen, setAuthOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    if (isSupabaseConfigured()) {
      useSettingsStore.getState().loadRemoteSettings().finally(() => setSettingsLoading(false));
    } else {
      setSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    pushBrowserRouteState();
    const handlePopState = () => {
      const { history: uiHistory, back: uiBack } = useUI.getState();
      if (uiHistory.length > 0) {
        uiBack();
        pushBrowserRouteState();
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const normalizeEmail = (email?: string) => email?.trim().toLowerCase() ?? '';
  const isAdminUser = useMemo(() => {
    if (settingsLoading) return false;
    const userEmail = normalizeEmail(user?.email);
    const allowed = [settings.adminEmail, 'umuhammadiswa@gmail.com'];
    return !!userEmail && allowed.some((e) => normalizeEmail(e) === userEmail);
  }, [user?.email, settings.adminEmail, settingsLoading]);

  const activeTab = view.name === 'tabs' ? view.tab : tab;

  // Expose tab for debug
  useEffect(() => {
    (window as any).__BAKEART_TAB__ = activeTab;
  }, [activeTab]);

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
    <AppErrorBoundary>
      <div className="h-[100dvh] w-full flex flex-col bg-cream overflow-hidden">
        <main className="flex-1 min-h-0 relative overflow-hidden">
          {view.name === 'splash' && <SplashScreen />}
          {view.name === 'tabs' && activeTab === 'home' && (
            <HomeScreen onLogoTap={() => {}} onNotificationsOpen={() => setNotificationsOpen(true)} />
          )}
          {view.name === 'tabs' && activeTab === 'categories' && <CategoriesScreen />}
          {view.name === 'tabs' && activeTab === 'orders' && (
            user ? <OrdersScreen /> : (
              <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                <div className="text-5xl mb-4">📋</div>
                <h2 className="font-bold text-lg mb-2">Sign in to view orders</h2>
                <button onClick={() => setAuthOpen(true)} className="px-6 py-3 rounded-2xl bg-coral text-white font-bold text-sm">
                  Sign In
                </button>
              </div>
            )
          )}
          {view.name === 'tabs' && activeTab === 'profile' && (
            <ProfileScreen onAuthOpen={() => setAuthOpen(true)} isAdmin={isAdminUser} />
          )}
          {view.name === 'product' && <ProductScreen />}
          {view.name === 'customize' && <CustomizeScreen />}
          {view.name === 'cart' && <CartScreen />}
          {view.name === 'checkout' && <CheckoutScreen />}
          {view.name === 'success' && <SuccessScreen />}
          {view.name === 'wishlist' && <WishlistScreen />}
          {view.name === 'tracking' && <TrackingScreen />}
          {view.name === 'admin' && <AdminScreen />}
        </main>

        {showTabBar && <BottomTabBar />}

        <NotificationsSheet open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
        <AuthSheet open={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    </AppErrorBoundary>
  );
}
