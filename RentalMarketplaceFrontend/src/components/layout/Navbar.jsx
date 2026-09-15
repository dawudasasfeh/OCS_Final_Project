import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSubscription } from "../../context/SubscriptionContext";
import { useTranslation } from "react-i18next";
import ListPropertyLink from "../ListPropertyLink";
import { IconCaret, IconListHome, IconUser } from "../icons";
import LanguageToggle from "../LanguageToggle";

const initials = (name = "") =>
  name.split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

export default function Navbar() {
  const { user, logout } = useAuth();
  const { isSubscribed, subscription } = useSubscription();
  const { t } = useTranslation();

  // What each role can actually reach, decided once here so the menu, the
  // navbar CTA and the routes cannot disagree.
  //
  // An administrator gets oversight only: no listing, no booking, and so no
  // wishlist or subscription either — a menu that offers a page the server
  // will refuse is worse than no menu at all.
  //
  // Owner pages hang off the subscription rather than the role, because that
  // is what actually decides whether the page has anything on it.
  const isAdmin = user?.role === "Admin";
  const canRent = !isAdmin;

  // Owner pages show while the subscription is active, and go on showing after
  // it lapses. expiresAt is null for someone who has never subscribed and set
  // for someone whose subscription ran out, which is exactly the difference:
  // a renter who never listed does not need these links, but a lapsed owner
  // still has listings and may have a renter waiting on an answer. Hiding
  // Booking requests from them would strand that renter, and the page itself
  // stays reachable for the same reason.
  const hasEverSubscribed = subscription?.expiresAt != null;
  const canOwn = !isAdmin && (isSubscribed || hasEverSubscribed);
  const [open, setOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const menuRef = useRef(null);
  const { pathname } = useLocation();

  const linkClass = ({ isActive }) => (isActive ? "nav-link active" : "nav-link");

  // close the menu when clicking anywhere outside it
  useEffect(() => {
    function onPointerDown(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    function onEscape(e) {
      if (e.key === "Escape") { setOpen(false); setNavOpen(false); }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  // close it whenever the route changes — during render, so the new page is
  // never painted with the old menu still open over it
  const [menuPath, setMenuPath] = useState(pathname);
  if (pathname !== menuPath) {
    setMenuPath(pathname);
    setOpen(false);
    setNavOpen(false);
  }

  return (
    <header className="navbar">
      <div className="container nav-inner">

        {/* Below 1024px the links move into a drawer. They used to sit in a
            horizontally scrolling strip with the scrollbar hidden, so there was
            nothing to tell anyone the later links existed. */}
        <button
          type="button"
          className="nav-burger"
          aria-label={navOpen ? t("nav.closeMenu") : t("nav.openMenu")}
          aria-expanded={navOpen}
          onClick={() => setNavOpen((v) => !v)}
        >
          <span /><span /><span />
        </button>

        <ul className={navOpen ? "nav-links open" : "nav-links"}>
          <li><NavLink to="/" end className={linkClass}>{t("nav.home")}</NavLink></li>
          <li><NavLink to="/houses" className={linkClass}>{t("nav.properties")}</NavLink></li>
          <li><NavLink to="/about" className={linkClass}>{t("nav.about")}</NavLink></li>
          <li><NavLink to="/contact" className={linkClass}>{t("nav.contact")}</NavLink></li>

          {/* Drawer only. On a phone the bar holds the menu, the logo and one
              account control — anything more crowds the logo — so the rest of
              what the desktop bar offers lives here, as full-width rows that
              are easy to hit with a thumb. Hidden on desktop, where the bar
              has the room. */}
          {!isAdmin && (
            <li className="nav-drawer-only nav-drawer-first">
              <ListPropertyLink className="nav-link nav-drawer-row">
                <IconListHome size={18} />
                {t("nav.listProperty")}
              </ListPropertyLink>
            </li>
          )}
          <li className={isAdmin ? "nav-drawer-only nav-drawer-first" : "nav-drawer-only"}>
            <LanguageToggle className="nav-link nav-drawer-row" />
          </li>
          {!user && (
            <li className="nav-drawer-only nav-drawer-auth">
              <Link to="/login" className="btn btn-primary">{t("nav.login")}</Link>
              <Link to="/register" className="btn btn-outline">{t("nav.register")}</Link>
            </li>
          )}
        </ul>

        {navOpen && (
          <button
            type="button"
            className="nav-backdrop"
            aria-label={t("nav.closeMenu")}
            onClick={() => setNavOpen(false)}
          />
        )}

        <Link to="/" className="nav-logo" aria-label={t("nav.homeAria")}>
          <div className="nav-logo-badge">
            <img src="/logo.svg" alt="Beytak" className="logo-svg" />
          </div>
        </Link>

        {/* One filled button at most. There used to be four controls here —
            language, list a property, log in, register — all boxed, all the
            same weight, so none of them read as the thing to do. Now listing is
            a quiet link, language is a small switch, and a guest gets a single
            Sign in: registering is one link away on that page, which is where
            people who have no account go looking for it anyway. */}
        <div className="nav-actions">
          {/* Shown to guests and unsubscribed owners too — the click is what
              explains the requirement, which is more use than hiding it.
              Never to admins, who cannot list at all. */}
          {!isAdmin && (
            <ListPropertyLink className="nav-list-link">
              <IconListHome size={17} />
              {t("nav.listProperty")}
            </ListPropertyLink>
          )}
          <LanguageToggle className="nav-lang" />

          {user ? (
            <div className="account" ref={menuRef}>
              <button
                type="button"
                className="account-btn"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={t("nav.accountMenu")}
              >
                <span className="account-avatar">{initials(user.name)}</span>
                <IconCaret className="account-caret" size={15} />
              </button>

              {open && (
                <div className="account-menu" role="menu">
                  <div className="account-menu-head">
                    <span className="account-avatar lg">{initials(user.name)}</span>
                    <div className="account-id">
                      <div className="account-name">{user.name}</div>
                      <div className="account-email">{user.email}</div>
                      <div className="account-tags">
                        <span className="account-role">
                          {user.role === "Admin" ? t("admin.roleAdmin") : t("admin.roleUser")}
                        </span>
                        {/* Beside the role, because it is the same kind of fact:
                            what this account is allowed to do. It was only a
                            line in the menu below, which said nothing about
                            whether the subscription was actually live — an owner
                            had to open the page to find out. */}
                        {!isAdmin && (
                          <Link
                            to="/subscribe"
                            className={isSubscribed ? "account-sub active" : "account-sub"}
                          >
                            {isSubscribed
                              ? t("nav.subActive")
                              : hasEverSubscribed
                                ? t("nav.subLapsed")
                                : t("nav.subInactive")}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="account-menu-list">
                    {!isAdmin && <ListPropertyLink role="menuitem" />}
                    {canOwn && (
                      <>
                        <Link to="/my-listings" role="menuitem">{t("nav.myListings")}</Link>
                        <Link to="/requests" role="menuitem">{t("nav.bookingRequests")}</Link>
                      </>
                    )}
                    {!isAdmin && (
                      <Link to="/subscribe" role="menuitem">{t("nav.subscription")}</Link>
                    )}
                    {canRent && (
                      <>
                        <Link to="/my-bookings" role="menuitem">{t("nav.myBookings")}</Link>
                        <Link to="/wishlist" role="menuitem">{t("nav.wishlist")}</Link>
                      </>
                    )}
                    {isAdmin && (
                      <Link to="/admin" role="menuitem">{t("nav.adminDashboard")}</Link>
                    )}
                  </div>

                  <div className="account-menu-foot">
                    <button type="button" onClick={logout} role="menuitem">{t("nav.signOut")}</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // The label drops away on the narrowest phones, leaving the icon;
            // the aria-label keeps the name for anyone not reading the screen.
            <Link to="/login" className="btn btn-primary nav-signin" aria-label={t("nav.login")}>
              <IconUser size={17} />
              <span className="nav-signin-label">{t("nav.login")}</span>
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}
