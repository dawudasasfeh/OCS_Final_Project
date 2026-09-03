import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  const linkClass = ({ isActive }) => (isActive ? "nav-link active" : "nav-link");

  return (
    <header className="navbar">
      <div className="container nav-inner">

        <ul className="nav-links">
          <li><NavLink to="/" end className={linkClass}>Home</NavLink></li>
          <li><NavLink to="/houses" className={linkClass}>Properties</NavLink></li>
          <li><NavLink to="/about" className={linkClass}>About</NavLink></li>
          <li><NavLink to="/contact" className={linkClass}>Contact</NavLink></li>
        </ul>

        <Link to="/" className="nav-logo">
          <span className="nav-logo-mark">BEYTAK</span>
          <span className="nav-logo-sub">Jordan Rentals</span>
        </Link>

        <div className="nav-actions">
          {user ? (
            <>
              <span className="nav-user">Hi, {user.name}</span>
              <button type="button" className="btn btn-outline" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Login</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </>
          )}
        </div>

      </div>
    </header>
  );
}