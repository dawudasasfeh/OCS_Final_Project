import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { SubscriptionProvider } from './context/SubscriptionContext.jsx'
import { WishlistProvider } from './context/WishlistContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'

// Toast sits outermost so anything below it, including the other providers,
// can raise a message. Subscription depends on Auth, so it nests inside.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <WishlistProvider>
            <App />
          </WishlistProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </ToastProvider>
  </StrictMode>,
)
