import { useEffect, useState } from 'react';
import { initMonitoring, trackEvent, trackPageView } from './monitoring';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export default function App() {
  const [lastResponse, setLastResponse] = useState<string>('');

  useEffect(() => {
    initMonitoring({
      pushgatewayUrl: import.meta.env.VITE_PUSHGATEWAY_URL ?? 'http://localhost:9091',
      serviceName: 'web-app',
    });
    void trackPageView(window.location.pathname);
  }, []);

  async function callApi(path: string) {
    const res = await fetch(`${API_URL}${path}`);
    const data = await res.json().catch(() => ({ status: res.status }));
    setLastResponse(JSON.stringify(data, null, 2));
    trackEvent('api_call', { path });
  }

  function simulateError() {
    trackEvent('simulated_error', { source: 'button' });
    setTimeout(() => {
      throw new Error('Simulated frontend error');
    }, 0);
  }

  return (
    <main style={{ fontFamily: 'system-ui', maxWidth: 720, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Observe — React RUM Example</h1>
      <p>Metrics → Pushgateway · Traces → OTel Collector → Tempo</p>

      <section style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '1.5rem 0' }}>
        <button type="button" onClick={() => callApi('/api/test')}>
          Call /api/test
        </button>
        <button type="button" onClick={() => callApi('/api/slow')}>
          Call /api/slow
        </button>
        <button type="button" onClick={() => callApi('/api/error')}>
          Call /api/error
        </button>
        <button type="button" onClick={() => trackEvent('user_signup', { plan: 'pro' })}>
          Track signup event
        </button>
        <button type="button" onClick={simulateError}>
          Simulate error
        </button>
      </section>

      <pre
        style={{
          background: '#111',
          color: '#eee',
          padding: '1rem',
          borderRadius: 8,
          minHeight: 120,
        }}
      >
        {lastResponse || 'Click a button to call the NestJS API.'}
      </pre>

      <p style={{ color: '#666', fontSize: 14 }}>
        Open Grafana → Observe folder. Check Traces, Application, and Pushgateway metrics.
      </p>
    </main>
  );
}
