import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useSubscription } from "../context/SubscriptionContext"

export default function ProtectedRoute({ children, role, requireSubscription }) {
    const { user } = useAuth();
    const { isSubscribed, loading } = useSubscription();

    if (!user) return <Navigate to="/login" replace />

    if (role && user.role !== role) return <Navigate to="/" replace />

    // Admins are exempt, matching HouseService: the gate collects a fee from
    // owners, and an admin is not a customer. Without this the server would
    // accept the listing while the client still refused to show the form.
    if (requireSubscription && user.role !== "Admin") {
        // The subscription is read from the API, so on a cold load it is not
        // known yet. Redirecting during that window would bounce a paying owner
        // to the paywall on every refresh, so wait for the answer first.
        if (loading) return null;
        if (!isSubscribed) return <Navigate to="/subscribe" replace />
    }

    return children;
}
