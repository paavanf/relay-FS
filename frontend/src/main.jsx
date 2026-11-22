// Entry point. Takes any sign-in Supabase sent back in the address (and
// clears it from the address bar) before anything else runs, then renders
// the App into #root. The stylesheets: Relay's own fonts and their sized
// stand-ins (assets/fonts/), then the design system.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { captureAuthRedirect } from './lib/auth/authRedirect.js';
import './assets/fonts/fonts.css';
import './assets/fonts/fallbacks.css';
import './index.css';

captureAuthRedirect();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
