import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { App } from '../App';
import { AuthProvider } from '../auth/AuthProvider';
import { ThemeProvider } from '../theme/ThemeProvider';

export function renderApp(route = '/') {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

// Rule 02 envelopes, as the API sends them.
export function ok(data) {
  return { success: true, data, error: null, timestamp: new Date().toISOString() };
}

export function fail(code, message) {
  return { success: false, data: null, error: { code, message }, timestamp: new Date().toISOString() };
}

// Stub global fetch with a handler: (url, init) => [status, body]
export function mockFetch(handler) {
  const fn = vi.fn(async (url, init) => {
    const [status, body] = handler(url, init);
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}
