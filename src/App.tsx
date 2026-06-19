import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { Navbar } from '@/components/Navbar'
import { CartDrawer } from '@/components/CartDrawer'
import { CheckoutModal } from '@/components/CheckoutModal'
import { MobileOrderBar } from '@/components/MobileOrderBar'
import { AuthModal } from '@/components/AuthModal'
import { CustomerDashboard } from '@/components/CustomerDashboard'
import { AdminPanel } from '@/pages/AdminPanel'
import { HomePage } from '@/pages/HomePage'
import { ChatBot } from '@/components/ChatBot'
import { OrderTrackingModal } from '@/components/OrderTrackingModal'
import { LocationGate } from '@/components/location/LocationGate'
import { useUIStore, useAuthStore, useSettingsStore, useLocationStore } from '@/lib/store'

export default function App() {
  const darkMode = useUIStore((s) => s.darkMode)
  const user = useAuthStore((s) => s.user)
  const settings = useSettingsStore((s) => s.settings)
  const isAdmin = user?.email === settings.adminEmail
  const locationVerified = useLocationStore((s) => s.locationVerified)
  const setCustomerLocation = useLocationStore((s) => s.setCustomerLocation)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  // আগে থেকে লগইন করা admin সরাসরি দোকানে ঢুকবে, location gate এ আটকাবে না।
  // নতুন customer (বা প্রথমবার login করা admin) প্রথমে এলাকা যাচাই করবে।
  if (!locationVerified && !isAdmin) {
    return (
      <LocationGate
        onAllowed={(district, lat, lng) => setCustomerLocation(district, lat, lng)}
      />
    )
  }

  return (
    <div className="min-h-screen font-siliguri bg-gradient-to-br from-rose-50/30 via-pink-50/40 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-rose-950 transition-colors duration-500 overflow-x-hidden">
      <Navbar />
      <main>
        <HomePage />
      </main>
      <CartDrawer />
      <CheckoutModal />
      <MobileOrderBar />
      <AuthModal />
      <CustomerDashboard />
      <OrderTrackingModal />
      {isAdmin && <AdminPanel />}
      <ChatBot />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: { fontFamily: 'Hind Siliguri, sans-serif', fontSize: '14px', borderRadius: '12px' },
          success: { style: { background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3' } },
          error: { style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' } },
        }}
      />
    </div>
  )
}
