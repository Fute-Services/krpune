import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { installOfflineBootstrap } from '@/offline/offlineBootstrap'

// Subscribes to auth; does nothing at all until a session exists. No service
// worker is registered and no media is fetched for a logged-out visitor.
installOfflineBootstrap();

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
