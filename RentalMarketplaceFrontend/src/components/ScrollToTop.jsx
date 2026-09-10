import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Puts a new page at the top.
 *
 * A single-page app does not reload on navigation, so the window keeps whatever
 * scroll position the previous page left behind. Following a footer link from
 * the bottom of a long listings page landed you halfway down About, which reads
 * as a broken page rather than a new one.
 *
 * Back and forward are deliberately excluded. On a POP the browser restores the
 * position you were at, and overriding that would throw away your place in a
 * results list every time you backed out of a listing — the one case where
 * keeping the scroll is the whole point.
 *
 * A hash is excluded too, since it names an element to scroll to instead.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType === "POP" || hash) return;

    // "instant" rather than smooth: a new page animating its way up looks like
    // a bug, and it fights users who scroll immediately after clicking.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash, navigationType]);

  return null;
}
