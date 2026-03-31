import { isAdminPasswordConfigured } from "@/lib/auth";
import { getServerI18n } from "@/lib/i18n";

export default async function SignInPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const resolvedSearch = await searchParams;
  const { t } = await getServerI18n();
  const next = resolvedSearch.next ?? "/?editor=1";
  const passwordConfigured = isAdminPasswordConfigured();

  return (
    <div className="site-frame">
      <section className="site-section width-narrow">
        <div className="section-stack">
          <span className="eyebrow">{t("auth.eyebrow")}</span>
          <h1 className="section-title">{t("auth.title")}</h1>
          <p className="hero-subtitle">{t("auth.description")}</p>

          <form
            action="/auth/login"
            method="post"
            className="section-stack"
            style={{ maxWidth: "28rem" }}
          >
            <input type="hidden" name="next" value={next} />
            <label className="editor-field">
              <span>{t("auth.passwordLabel")}</span>
              <input type="password" name="password" placeholder={t("auth.passwordPlaceholder")} required />
            </label>
            <button type="submit" className="pill-link" disabled={!passwordConfigured}>
              {t("auth.submit")}
            </button>
          </form>

          {!passwordConfigured ? (
            <p className="mini-note">{t("auth.missingSetup")}</p>
          ) : null}

          {resolvedSearch.error === "password" ? (
            <p className="mini-note">{t("auth.passwordRequired")}</p>
          ) : null}
          {resolvedSearch.error === "invalid-password" ? (
            <p className="mini-note">{t("auth.invalidPassword")}</p>
          ) : null}
          {resolvedSearch.error === "missing-password" ? (
            <p className="mini-note">{t("auth.missingPassword")}</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
