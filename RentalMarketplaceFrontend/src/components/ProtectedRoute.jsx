import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useSubscription } from "../context/SubscriptionContext"

export default function ProtectedRoute({ children, role, requireSubscription }) {
    const { user } = useAuth();
    const { isSubscribed, loading } = useSubscription();

    if (!user) return <Navigate to="/login" replace />

    if (role && user.role !== role) return <Navigate to="/" replace />

    if (requireSubscription) {
        // The subscription is read from the API, so on a cold load it is not
        // known yet. Redirecting during that window would bounce a paying owner
        // to the paywall on every refresh, so wait for the answer first.
        if (loading) return null;
        if (!isSubscribed) return <Navigate to="/subscribe" replace />
    }

    return children;
}
