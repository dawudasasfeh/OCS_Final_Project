import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSubscription } from "../context/SubscriptionContext";
import { useToast } from "../context/ToastContext";

/**
 * "List a property", wherever it appears.
 *
 * The label never changes — a button that renames itself to "Subscribe to list"
 * tells people what they cannot do before they have asked to do anything. The
 * check happens on the click instead, and says why.
 *
 * Two different refusals hide behind one button:
 *   - a guest has no account yet, so they go to login
 *   - a signed-in owner without a subscription goes to the paywall
 *
 * Both are only messaging. HouseService refuses the create either way.
 */
export default function ListPropertyLink({ className = "", children, role }) {
  const { user } = useAuth();
  const { isSubscribed } = useSubscription();
  const toast = useToast();
  const navigate = useNavigate();

  function handleClick(e) {
    e.preventDefault();

    if (!user) {
      toast.info("Log in to list a property.");
      // returnTo brings them back here once they are in, so the click is not
      // simply lost.
      navigate("/login?returnTo=/houses/new");
      return;
    }

    if (!isSubscribed) {
      toast.info("Listing a property needs an active subscription.");
      navigate("/subscribe");
      return;
    }

    navigate("/houses/new");
  }

  // A real href, so middle-click and "open in new tab" still behave, while the
  // ordinary click runs the check.
  return (
    <Link to="/houses/new" className={className} role={role} onClick={handleClick}>
      {children ?? "List a property"}
    </Link>
  );
}
