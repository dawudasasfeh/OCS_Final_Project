import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ListPropertyLink from "../ListPropertyLink";

const initials = (name = "") =>
  name.split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

export default function Navbar() {
  const { user, logout } = useAuth();
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

  // close it whenever the route changes
  useEffect(() => { setOpen(false); setNavOpen(false); }, [pathname]);

  return (
    <header className="navbar">
      <div className="container nav-inner">

        {/* Below 1024px the links move into a drawer. They used to sit in a
            horizontally scrolling strip with the scrollbar hidden, so there was
            nothing to tell anyone the later links existed. */}
        <button
          type="button"
          className="nav-burger"
          aria-label={navOpen ? "Close menu" : "Open menu"}
          aria-expanded={navOpen}
          onClick={() => setNavOpen((v) => !v)}
        >
          <span /><span /><span />
        </button>

        <ul className={navOpen ? "nav-links open" : "nav-links"}>
          <li><NavLink to="/" end className={linkClass}>Home</NavLink></li>
          <li><NavLink to="/houses" className={linkClass}>Properties</NavLink></li>
          <li><NavLink to="/about" className={linkClass}>About</NavLink></li>
          <li><NavLink to="/contact" className={linkClass}>Contact</NavLink></li>
        </ul>

        {navOpen && (
          <button
            type="button"
            className="nav-backdrop"
            aria-label="Close menu"
            onClick={() => setNavOpen(false)}
          />
        )}

        <Link to="/" className="nav-logo">
          <span className="nav-logo-mark">Beytak</span>
          <span className="nav-logo-sub">بيتك</span>
        </Link>

        <div className="nav-actions">
          {/* Shown to guests too — the click is what explains the requirement,
              and sending them to login is more use than hiding the button. */}
          <ListPropertyLink className="btn btn-outline nav-cta" />

          {user ? (
            <div className="account" ref={menuRef}>
              <button
                type="button"
                className="account-btn"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label="Account menu"
              >
                <span className="account-avatar">{initials(user.name)}</span>
                <span className="account-caret" aria-hidden="true">▾</span>
              </button>

              {open && (
                <div className="account-menu" role="menu">
                  <div className="account-menu-head">
                    <span className="account-avatar lg">{initials(user.name)}</span>
                    <div className="account-id">
                      <div className="account-name">{user.name}</div>
                      <div className="account-email">{user.email}</div>
                      <span className="account-role">{user.role}</span>
                    </div>
                  </div>

                  <div className="account-menu-list">
                    <ListPropertyLink role="menuitem" />
                    <Link to="/my-listings" role="menuitem">My listings</Link>
                    <Link to="/subscribe" role="menuitem">Subscription</Link>
                    <Link to="/my-bookings" role="menuitem">My bookings</Link>
                    <Link to="/wishlist" role="menuitem">Saved properties</Link>
                    <Link to="/requests" role="menuitem">Booking requests</Link>
                    {user.role === "Admin" && (
                      <Link to="/admin" role="menuitem">Admin dashboard</Link>
                    )}
                  </div>

                  <div className="account-menu-foot">
                    <button type="button" onClick={logout} role="menuitem">Sign out</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Log in</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </>
          )}
        </div>

      </div>
    </header>
  );
}
