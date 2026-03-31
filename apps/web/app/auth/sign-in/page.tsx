import { requestMagicLink } from "./actions";

export default async function SignInPage({
  searchParams
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const resolvedSearch = await searchParams;

  return (
    <div className="site-frame">
      <section className="site-section width-narrow">
        <div className="section-stack">
          <span className="eyebrow">Magic link auth</span>
          <h1 className="section-title">Editor sign in happens on the same site.</h1>
          <p className="hero-subtitle">Enter the editor email and request a magic link.</p>
          <form action={requestMagicLink} className="section-stack" style={{ maxWidth: "28rem" }}>
            <label className="editor-field">
              <span>email</span>
              <input type="email" name="email" placeholder="owner@example.com" required />
            </label>
            <button type="submit" className="pill-link">
              Send magic link
            </button>
          </form>
          <p className="mini-note">
            If Supabase env is not configured, this screen falls back to demo mode and redirects
            into `?editor=1`.
          </p>
          {resolvedSearch.sent ? (
            <p className="mini-note">Magic link sent. Check your inbox.</p>
          ) : null}
          {resolvedSearch.error ? (
            <p className="mini-note">Sign-in error: {resolvedSearch.error}</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
