import { X, Bell, CheckCheck } from 'lucide-react';
import { useUI } from '../lib/store';

export default function NotificationsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { notifications, markAllRead } = useUI();

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-[65] flex items-end justify-center anim-fade">
      <button
        type="button"
        aria-label="Close notifications"
        className="absolute inset-0 bg-ink/40"
        onClick={onClose}
      />
      <div
        className="relative max-h-[76%] w-full overflow-hidden rounded-t-[28px] glass-strong anim-up"
        style={{ boxShadow: '0 -20px 60px -20px rgba(26,19,17,.25)' }}
      >
        <header className="flex items-center justify-between bg-white px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-coral-50 text-coral">
              <Bell className="h-[17px] w-[17px]" />
            </div>
            <div>
              <div className="font-display text-[16px] font-bold text-ink">Notifications</div>
              <div className="text-[11px] text-ink-200">{notifications.length} updates</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {notifications.length > 0 && (
              <button
                onClick={markAllRead}
                className="flex h-9 items-center gap-1 rounded-full px-2.5 text-[11px] font-bold text-coral hover:bg-coral-50"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Read all
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-ink-200 active:scale-90"
            >
              <X className="h-[18px] w-[18px]" />
            </button>
          </div>
        </header>

        <div className="no-scrollbar max-h-[60vh] overflow-y-auto p-4">
          {notifications.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-4xl">🔔</div>
              <p className="mt-2 text-[13px] font-medium text-ink-300">No notifications yet</p>
              <p className="text-[11px] text-ink-200">Order and promo updates will appear here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <article
                  key={n.id}
                  className="rounded-2xl bg-white p-3"
                  style={{ boxShadow: '0 1px 2px rgba(26,19,17,.02), 0 4px 16px -12px rgba(26,19,17,.16)' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="text-[13px] font-bold text-ink">{n.title}</div>
                      <div className="mt-0.5 text-[11.5px] leading-relaxed text-ink-200">{n.body}</div>
                    </div>
                    {!n.read && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-coral" />}
                  </div>
                  <div className="mt-1.5 text-[10px] text-ink-200">
                    {new Date(n.createdAt).toLocaleString('en-BD')}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
