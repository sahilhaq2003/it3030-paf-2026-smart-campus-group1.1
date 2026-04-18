import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { GOOGLE_CLIENT_ID } from './constants/googleAuth'
import './index.css'
import App from './App.jsx'

// Optimized QueryClient with retry logic and better defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Retry up to 2 times for network/5xx errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
      staleTime: 1 * 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 1, // Retry mutations once
      retryDelay: 1000,
    },
  },
});

const appTree = (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <App />
      <Toaster position="top-right" />
    </AuthProvider>
  </QueryClientProvider>
)

createRoot(document.getElementById('root')).render(
  GOOGLE_CLIENT_ID ? (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID} locale="en">
      {appTree}
    </GoogleOAuthProvider>
  ) : (
    appTree
  ),
)