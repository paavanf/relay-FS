// Top-level App component. Wraps the router in all the providers.
// Order matters: toasts must exist before auth, because auth errors show toasts.
// Pages load on demand, so the router sits inside a Suspense boundary that
// covers the very first load; the banner tells people when the server is
// waking up.
import { Suspense } from 'react';
import { RouterProvider } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { router } from './app/router.jsx';
import { queryClient } from './lib/queryClient.js';
import { AuthProvider } from './features/auth/AuthProvider.jsx';
import { ToastProvider } from './components/ui/toast/ToastProvider.jsx';
import { ThemeProvider } from './features/theme/ThemeProvider.jsx';
import { FullScreenLoader } from './components/ui/FullScreenLoader.jsx';
import { ServerWakingBanner } from './components/layout/ServerWakingBanner.jsx';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <Suspense fallback={<FullScreenLoader />}>
              <RouterProvider router={router} />
            </Suspense>
          </AuthProvider>
          <ServerWakingBanner />
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
