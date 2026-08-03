import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { installOfflineBootstrap } from '@/offline/offlineBootstrap'
import { captureInstallPrompt } from '@/offline/installPromptStore'

// Subscribes to auth; does nothing at all until a session exists. No service
// worker is registered and no media is fetched for a logged-out visitor.
installOfflineBootstrap();

// Listens for `beforeinstallprompt` from here on. It fires once, on Chrome's
// own schedule — typically while the visitor is still on the login screen —
// and the install card mounts far too late to catch it. Registers no worker
// and caches nothing, so the logged-out contract above is unaffected.
captureInstallPrompt();

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
