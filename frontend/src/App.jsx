// Top-level App component. Wraps the router in all the providers.
// Order matters: toasts must exist before auth, because auth errors show toasts.
import { RouterProvider } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { router } from './app/router.jsx';
import { queryClient } from './lib/queryClient.js';
import { AuthProvider } from './features/auth/AuthProvider.jsx';
import { ToastProvider } from './components/ui/toast/ToastProvider.jsx';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
