import Link from "next/link";

import { LocaleSwitcher } from "@/components/site/locale-switcher";
import { getServerI18n } from "@/lib/i18n";

export async function SiteHeader({
  currentSlug,
  pages,
  currentPath
}: {
  currentSlug: string;
  pages: Array<{ id: string; slug: string; title: string }>;
  currentPath: string;
}) {
  const { t } = await getServerI18n();

  return (
    <header className="site-header">
      <div className="site-brand">
        <span className="site-brand-kicker">{t("header.kicker")}</span>
        <Link href="/" className="site-brand-title">
          ArtSite
        </Link>
      </div>
      <nav className="site-nav" aria-label={t("header.primaryNav")}>
        {pages.map((page) => (
          <Link
            key={page.id}
            href={`/${page.slug}`}
            style={{
              opacity: page.slug === currentSlug ? 1 : 0.66
            }}
          >
            {page.title}
          </Link>
        ))}
      </nav>
      <LocaleSwitcher currentPath={currentPath} />
    </header>
  );
}
