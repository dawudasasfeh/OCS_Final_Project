import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="section">
      <div className="container notfound">
        <p className="notfound-code">404</p>
        <h1>We couldn&apos;t find that page</h1>
        <p className="muted">
          The link may be out of date, or the listing may have been taken off
          the market.
        </p>
        <div className="notfound-actions">
          <Link to="/houses" className="btn btn-primary">Browse properties</Link>
          <Link to="/" className="btn btn-outline">Go home</Link>
        </div>
      </div>
    </section>
  );
}
