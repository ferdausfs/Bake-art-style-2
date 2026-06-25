import React from 'react';

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; error: Error | null; errorInfo: React.ErrorInfo | null; }

export default class AppErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AppErrorBoundary caught:', error, errorInfo);
    this.setState({ error, errorInfo });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: '#fff0f3', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', wordBreak: 'break-word' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '48px' }}>🚨</div>
            <h2 style={{ color: '#d32f2f', margin: '10px 0' }}>App Crash Detected</h2>
            <p style={{ color: '#666', fontSize: '14px' }}>Screenshot this page and send it to fix the bug.</p>
          </div>
          <div style={{ background: '#fff', border: '2px solid #d32f2f', borderRadius: '12px', padding: '15px', marginBottom: '15px' }}>
            <h3 style={{ color: '#d32f2f', margin: '0 0 10px 0', fontSize: '14px' }}>🔴 Error Message</h3>
            <pre style={{ background: '#ffebee', padding: '10px', borderRadius: '8px', overflow: 'auto', fontSize: '12px', color: '#c62828', margin: 0 }}>
              {this.state.error?.name}: {this.state.error?.message}
            </pre>
          </div>
          <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '12px', padding: '15px', marginBottom: '15px' }}>
            <h3 style={{ color: '#333', margin: '0 0 10px 0', fontSize: '14px' }}>📍 Stack Trace (screenshot this)</h3>
            <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '8px', overflow: 'auto', fontSize: '11px', color: '#333', maxHeight: '200px', margin: 0 }}>
              {this.state.error?.stack || 'No stack trace'}
            </pre>
          </div>
          <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '12px', padding: '15px' }}>
            <h3 style={{ color: '#333', margin: '0 0 10px 0', fontSize: '14px' }}>🧩 Component Stack</h3>
            <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '8px', overflow: 'auto', fontSize: '11px', color: '#333', maxHeight: '150px', margin: 0 }}>
              {this.state.errorInfo?.componentStack || 'No component info'}
            </pre>
          </div>
          <button onClick={() => window.location.reload()} style={{ display: 'block', width: '100%', marginTop: '20px', padding: '15px', background: '#d32f2f', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
            🔄 Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
