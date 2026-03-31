import { isAdminPasswordConfigured } from "@/lib/auth";

export default async function SignInPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const resolvedSearch = await searchParams;
  const next = resolvedSearch.next ?? "/?editor=1";
  const passwordConfigured = isAdminPasswordConfigured();

  return (
    <div className="site-frame">
      <section className="site-section width-narrow">
        <div className="section-stack">
          <span className="eyebrow">Admin access</span>
          <h1 className="section-title">Editor mode opens only after admin sign in.</h1>
          <p className="hero-subtitle">
            Use the password from <code>.env</code> to unlock inline editing on the live page.
          </p>

          <form
            action="/auth/login"
            method="post"
            className="section-stack"
            style={{ maxWidth: "28rem" }}
          >
            <input type="hidden" name="next" value={next} />
            <label className="editor-field">
              <span>admin password</span>
              <input type="password" name="password" placeholder="Enter admin password" required />
            </label>
            <button type="submit" className="pill-link" disabled={!passwordConfigured}>
              Enter editor
            </button>
          </form>

          {!passwordConfigured ? (
            <p className="mini-note">
              Add <code>ADMIN_PASSWORD</code> to <code>.env</code>, restart Docker, then sign in
              again.
            </p>
          ) : null}

          {resolvedSearch.error === "password" ? (
            <p className="mini-note">Enter the admin password to continue.</p>
          ) : null}
          {resolvedSearch.error === "invalid-password" ? (
            <p className="mini-note">Password is incorrect.</p>
          ) : null}
          {resolvedSearch.error === "missing-password" ? (
            <p className="mini-note">
              <code>ADMIN_PASSWORD</code> is not configured in the environment yet.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
