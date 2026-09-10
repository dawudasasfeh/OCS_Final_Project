import heroImg from "../assets/hero-amman.jpg";

/**
 * The split shell behind Log in and Create account.
 *
 * Shared rather than written twice so the two pages cannot drift — they were
 * already diverging, with Register carrying a hint line that Login did not.
 * Each page supplies its own heading and points, because what is worth saying
 * to someone returning is not what is worth saying to someone signing up.
 *
 * The panel is decorative: it disappears below 1024px rather than stacking, so
 * a phone gets the form immediately instead of scrolling past a photo.
 *
 * It carries no logo. The form beside it already shows one, and two lockups on
 * one screen made the page look like two pages next to each other.
 */
export default function AuthLayout({ title, points, children }) {
  return (
    <div className="auth-split">
      <aside
        className="auth-aside"
        style={{ "--auth-img": `url(${heroImg})` }}
        aria-hidden="true"
      >
        <div className="auth-aside-inner">
          <h2 className="auth-aside-title">{title}</h2>

          <ul className="auth-points">
            {points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="auth-main">{children}</main>
    </div>
  );
}
