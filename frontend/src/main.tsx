import { StrictMode, Suspense, Component, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './i18n/config'
import '@/shared/styles/index.css'
import App from '@/app/App'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Simple Error Boundary to catch runtime errors
class RootErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ROOT ERROR BOUNDARY:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red' }}>
          <h1>Runtime Error</h1>
          <pre>{this.state.error?.message}</pre>
          <pre>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

console.log('[main.tsx] Starting render...');
console.log('[main.tsx] GOOGLE_CLIENT_ID:', GOOGLE_CLIENT_ID ? 'set' : 'EMPTY');

const rootEl = document.getElementById('root');
console.log('[main.tsx] root element:', rootEl ? 'found' : 'NOT FOUND');

createRoot(rootEl!).render(
  <StrictMode>
    <RootErrorBoundary>
      <Suspense fallback={<div className="loading-fallback" />}>
        {GOOGLE_CLIENT_ID ? (
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <App />
          </GoogleOAuthProvider>
        ) : (
          <App />
        )}
      </Suspense>
    </RootErrorBoundary>
  </StrictMode>,
)

console.log('[main.tsx] render() called');
