import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// Sets <html lang> and <html dir> as a side effect of loading, before the
// first render, so the page never flashes in the wrong direction.
import './i18n'
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
