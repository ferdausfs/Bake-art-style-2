import React, { useEffect, useState } from 'react';

interface LogEntry { id: number; type: 'error' | 'warn' | 'info' | 'promise'; message: string; detail?: string; time: string; }

export default function DebugOverlay() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [visible, setVisible] = useState(true);
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    let id = 0;
    const addLog = (type: LogEntry['type'], message: string, detail?: string) => {
      id++;
      setLogs(prev => [{ id, type, message: String(message).slice(0, 200), detail: detail ? String(detail).slice(0, 500) : undefined, time: new Date().toLocaleTimeString('en-BD', { hour12: false }) }, ...prev].slice(0, 50));
    };

    const origError = console.error;
    const origWarn = console.warn;
    console.error = (...args: any[]) => { origError.apply(console, args); addLog('error', args[0], args.slice(1).join(' ')); };
    console.warn = (...args: any[]) => { origWarn.apply(console, args); addLog('warn', args[0], args.slice(1).join(' ')); };

    const onError = (e: ErrorEvent) => { addLog('error', `GLOBAL: ${e.message} at ${e.filename}:${e.lineno}`, e.error?.stack); e.preventDefault(); };
    const onUnhandled = (e: PromiseRejectionEvent) => { const r = e.reason; const msg = r instanceof Error ? r.message : String(r); addLog('promise', `UNHANDLED: ${msg}`, r instanceof Error ? r.stack : ''); e.preventDefault(); };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandled);
    addLog('info', 'Debug mode active');

    return () => {
      console.error = origError;
      console.warn = origWarn;
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandled);
    };
  }, []);

  if (!visible) return null;
  const errorCount = logs.filter(l => l.type === 'error' || l.type === 'promise').length;

  return (
    <div style={{ position: 'fixed', top: '8px', right: '8px', zIndex: 99999, maxWidth: collapsed ? 'auto' : '92vw', maxHeight: collapsed ? 'auto' : '70vh', fontFamily: 'system-ui, monospace', fontSize: '12px' }}>
      <button onClick={() => setCollapsed(!collapsed)} style={{ background: errorCount > 0 ? '#d32f2f' : '#333', color: '#fff', border: 'none', borderRadius: '20px', padding: '6px 12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        🐛 {errorCount > 0 ? `${errorCount} ERROR${errorCount > 1 ? 'S' : ''}` : 'DEBUG'}
      </button>

      {!collapsed && (
        <div style={{ marginTop: '8px', background: '#fff', border: '2px solid #333', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          <div style={{ background: '#333', color: '#fff', padding: '8px 12px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🛠️ Live Logs</span>
            <button onClick={() => setLogs([])} style={{ background: 'transparent', border: '1px solid #fff', color: '#fff', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer' }}>Clear</button>
          </div>
          <div style={{ maxHeight: '50vh', overflow: 'auto' }}>
            {logs.length === 0 && <div style={{ padding: '12px', color: '#666', textAlign: 'center' }}>No errors yet ✅</div>}
            {logs.map(log => (
              <div key={log.id} style={{ padding: '8px 12px', borderBottom: '1px solid #eee', background: log.type === 'error' || log.type === 'promise' ? '#ffebee' : '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <span>{log.type === 'error' ? '🔴' : log.type === 'promise' ? '💥' : log.type === 'warn' ? '⚠️' : 'ℹ️'}</span>
                  <span style={{ color: log.type === 'error' || log.type === 'promise' ? '#d32f2f' : log.type === 'warn' ? '#f57c00' : '#666', fontWeight: log.type === 'error' || log.type === 'promise' ? 'bold' : 'normal' }}>{log.message}</span>
                  <span style={{ color: '#999', fontSize: '10px', marginLeft: 'auto' }}>{log.time}</span>
                </div>
                {log.detail && <pre style={{ margin: '4px 0 0 0', padding: '6px', background: '#f5f5f5', borderRadius: '4px', fontSize: '10px', color: '#555', overflow: 'auto', maxHeight: '80px', wordBreak: 'break-word' }}>{log.detail}</pre>}
              </div>
            ))}
          </div>
          <div style={{ padding: '8px 12px', background: '#fafafa', borderTop: '1px solid #eee', fontSize: '10px', color: '#666', textAlign: 'center' }}>
            Tap 🔴 button to hide/show. Screenshot errors & send.
          </div>
        </div>
      )}
    </div>
  );
}
