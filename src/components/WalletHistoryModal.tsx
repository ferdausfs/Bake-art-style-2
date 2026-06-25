import { X, Wallet, Users, Gift, ArrowDownLeft, RefreshCw } from 'lucide-react';
import { useWallet, type WalletTx } from '../lib/store';

interface Props {
  open: boolean;
  onClose: () => void;
}

function TxIcon({ type }: { type: WalletTx['type'] }) {
  switch (type) {
    case 'order_earn':
      return <Wallet className="h-4 w-4 text-emerald-500" />;
    case 'referral_earn':
      return <Users className="h-4 w-4 text-emerald-500" />;
    case 'referral_bonus':
      return <Gift className="h-4 w-4 text-emerald-500" />;
    case 'redeem':
      return <ArrowDownLeft className="h-4 w-4 text-coral" />;
    case 'refund':
      return <RefreshCw className="h-4 w-4 text-amber-500" />;
    default:
      return <Wallet className="h-4 w-4 text-emerald-500" />;
  }
}

function TxLabel({ tx }: { tx: WalletTx }) {
  switch (tx.type) {
    case 'order_earn':
      return (
        <div>
          <span className="text-[13px] font-semibold text-ink">Order reward</span>
          {tx.pending && (
            <span className="ml-1 text-[10px] text-ink/40">(pending)</span>
          )}
        </div>
      );
    case 'referral_earn':
      return <span className="text-[13px] font-semibold text-ink">Referral bonus</span>;
    case 'referral_bonus':
      return <span className="text-[13px] font-semibold text-ink">Welcome bonus</span>;
    case 'redeem':
      return <span className="text-[13px] font-semibold text-ink">Redeemed</span>;
    case 'refund':
      return <span className="text-[13px] font-semibold text-ink">Wallet refund</span>;
    default:
      return <span className="text-[13px] font-semibold text-ink">Transaction</span>;
  }
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const day = d.getDate();
  const month = d.toLocaleString('en-BD', { month: 'short' });
  const hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `${day} ${month} · ${h12}:${minutes} ${ampm}`;
}

export default function WalletHistoryModal({ open, onClose }: Props) {
  const { balance, totalEarned, txns } = useWallet();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-5 pt-4 pb-3 border-b border-ink/5">
        <h1 className="font-display text-[18px] font-bold tracking-tight text-ink">Wallet History</h1>
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/5 text-ink transition active:scale-90"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      {/* Summary */}
      <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-ink/5">
        <div className="font-display text-[36px] font-bold tabular text-ink leading-none">
          ৳{balance.toLocaleString()}
        </div>
        <div className="text-[11px] text-ink/40 mt-1">Total balance</div>
        <div className="text-[12px] text-ink/50 mt-2">
          Total earned: <span className="font-bold text-ink/70">৳{totalEarned.toLocaleString()}</span>
        </div>
      </div>

      {/* Transaction list */}
      <div className="flex-1 overflow-y-auto">
        {txns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-ink/30">
            <Wallet className="h-12 w-12 mb-3" strokeWidth={1.5} />
            <div className="text-[14px] font-semibold">No transactions yet</div>
          </div>
        ) : (
          <div className="divide-y divide-ink/5">
            {txns.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/5">
                    <TxIcon type={tx.type} />
                  </div>
                  <div>
                    <TxLabel tx={tx} />
                    <div className="text-[10.5px] text-ink/40 mt-0.5">{formatDate(tx.date)}</div>
                  </div>
                </div>
                <span
                  className={`text-[14px] font-bold tabular ${
                    tx.amount >= 0 ? 'text-emerald-600' : 'text-coral'
                  }`}
                >
                  {tx.amount >= 0 ? '+' : '-'}৳{Math.abs(tx.amount).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
