import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <>
      <Navbar />

      <main>
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container">
          <p style={{ margin: 0 }}>© 2026 Beytak — Property rentals across Jordan.</p>
        </div>
      </footer>
    </>
  );
}