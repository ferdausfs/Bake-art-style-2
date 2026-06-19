import { useState, useEffect } from 'react'
import { useCartStore, useUIStore } from '@/lib/store'
import { useAuth } from '@/hooks/useAuth'
import { toBn } from '@/lib/utils'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [active, setActive] = useState('#hero')
  const [adminTap, setAdminTap] = useState(0)
  const count = useCartStore((s) => s.count())
  const { darkMode, toggleDark, setCartOpen, setAdminOpen, setTrackingOpen, newOrderCount } = useUIStore()
  const { user, signOut } = useAuth()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { entries.forEach((e) => { if (e.isIntersecting) setActive('#' + e.target.id) }) },
      { rootMargin: '-40% 0px -55% 0px' }
    )
    ;['hero', 'menu', 'gallery', 'custom', 'about', 'reviews'].forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  const handleLogoTap = () => {
    const next = adminTap + 1
    setAdminTap(next)
    if (next >= 5) { setAdminOpen(true); setAdminTap(0) }
    setTimeout(() => setAdminTap(0), 3000)
  }

  const openDashboard = () => window.dispatchEvent(new Event('open-customer-dashboard'))
  const openAuth = () => document.getElementById('auth-modal')?.classList.remove('hidden')

  const links: [string, string][] = [
    ['হোম', '#hero'], ['মেন্যু', '#menu'], ['গ্যালারি', '#gallery'],
    ['কাস্টম', '#custom'], ['আমরা', '#about'], ['রিভিউ', '#reviews'],
  ]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl shadow-lg shadow-rose-500/5 py-2.5' : 'bg-white/50 dark:bg-slate-900/50 backdrop-blur-md py-3'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <button onClick={handleLogoTap} className="flex items-center gap-2.5 group flex-shrink-0 select-none">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <span className="text-base sm:text-lg">🎂</span>
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent leading-tight">বেক আর্ট স্টাইল</h1>
              <p className="text-[9px] sm:text-[10px] font-script text-purple-600 dark:text-purple-400 -mt-0.5 font-bold">Bake Art Style</p>
            </div>
          </button>

          {/* Desktop links */}
          <div className="hidden xl:flex items-center gap-0.5 bg-gray-100/60 dark:bg-slate-800/60 rounded-full p-1">
            {links.map(([n, h]) => {
              const isActive = active === h
              return (
                <a key={n} href={h}
                  className={`relative px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isActive ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}>
                  {n}
                  {isActive && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-rose-500" />}
                </a>
              )
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Dark toggle */}
            <button onClick={toggleDark}
              className={`relative w-12 h-7 rounded-full transition-all duration-300 flex items-center px-1 ${darkMode ? 'bg-slate-600' : 'bg-amber-300'}`}>
              <span className="text-xs absolute left-1">🌙</span>
              <span className="text-xs absolute right-1">☀️</span>
              <span className={`relative z-10 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 transform ${darkMode ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>

            {/* Order tracking */}
            <button onClick={() => setTrackingOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors border border-purple-200 dark:border-purple-800">
              📦 ট্র্যাক
            </button>

            {/* User */}
            {user ? (
              <button onClick={openDashboard}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors border border-rose-100 dark:border-rose-800/50">
                <span className="text-base">👤</span>
                <span className="text-xs font-bold text-rose-700 dark:text-rose-400">{user.name.split(' ')[0]}</span>
              </button>
            ) : (
              <button onClick={openAuth}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors border border-rose-200 dark:border-rose-800">
                <span>👤</span> লগইন
              </button>
            )}

            <a href="#menu"
              className="hidden md:inline-flex px-4 py-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xs font-bold shadow-md shadow-rose-500/30 hover:shadow-lg hover:shadow-rose-500/40 hover:-translate-y-0.5 transition-all btn-shine">
              অর্ডার করুন
            </a>

            {/* Cart */}
            <button onClick={() => setCartOpen(true)}
              className="relative w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500 text-white shadow-md shadow-rose-500/30 hover:scale-105 transition-all active:scale-95">
              🛒
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-400 text-gray-900 text-[10px] font-black rounded-full flex items-center justify-center animate-scale-in">
                  {toBn(count)}
                </span>
              )}
              {newOrderCount > 0 && (
                <span className="absolute -bottom-1 -left-1 w-4 h-4 bg-green-500 text-white text-[8px] font-black rounded-full flex items-center justify-center animate-pulse">
                  {toBn(newOrderCount)}
                </span>
              )}
            </button>

            <button onClick={() => setMobileOpen(!mobileOpen)}
              className="xl:hidden w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-700 dark:text-gray-300">
              {mobileOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="xl:hidden mt-3 pb-3 border-t border-gray-100 dark:border-slate-800 animate-fade-in-down">
            <div className="flex flex-col gap-1 pt-3">
              {links.map(([n, h]) => (
                <a key={n} href={h} onClick={() => setMobileOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-slate-800 hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                  {n}
                </a>
              ))}
              <button onClick={() => { setMobileOpen(false); setTrackingOpen(true) }}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors text-left">
                📦 অর্ডার ট্র্যাক করুন
              </button>
              <div className="mt-2 flex gap-2">
                {user ? (
                  <button onClick={() => { setMobileOpen(false); openDashboard() }}
                    className="flex-1 py-2.5 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold text-sm">
                    👤 {user.name.split(' ')[0]} - ড্যাশবোর্ড
                  </button>
                ) : (
                  <button onClick={() => { setMobileOpen(false); openAuth() }}
                    className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-sm shadow-md shadow-rose-500/25">
                    👤 লগইন / রেজিস্টার
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
