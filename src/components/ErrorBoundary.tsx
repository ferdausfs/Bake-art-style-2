import React from 'react';

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[BakeArt] Uncaught render error:', error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleResetData = () => {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('bakeart-')) {
          localStorage.removeItem(key);
        }
      });
      window.location.reload();
    } catch (e) {
      console.error('Reset data failed:', e);
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-cream flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center border border-ink/10 shadow-sm">
            <div className="text-6xl mb-4">🎂</div>
            
            <h1 className="font-display text-[22px] font-bold text-ink mb-2 tracking-[-0.01em]">
              কিছু একটা সমস্যা হয়েছে
            </h1>
            
            <p className="text-sm text-ink/70 mb-8 leading-relaxed">
              App-এ একটা ত্রুটি ঘটেছে। Reload করে আবার চেষ্টা করুন।
            </p>

            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full py-3.5 rounded-2xl bg-coral text-white font-bold text-sm active:scale-[0.985] transition-all"
              >
                🔄 Reload App
              </button>

              <button
                onClick={this.handleResetData}
                className="w-full py-3 rounded-2xl border border-ink/20 text-ink font-medium text-sm hover:bg-ink/5 active:bg-ink/10 transition-all"
              >
                🗑️ Reset App Data
              </button>
            </div>

            <p className="mt-4 text-[10px] text-ink/40 leading-snug">
              Reload এও ঠিক না হলে শুধুমাত্র এটা ব্যবহার করুন — এতে cart/wishlist মুছে যাবে।
            </p>

            <button
              onClick={this.reset}
              className="mt-4 text-xs text-coral hover:underline font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
