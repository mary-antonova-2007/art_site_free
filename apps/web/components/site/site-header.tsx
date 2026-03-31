import Link from "next/link";

export function SiteHeader({
  currentSlug,
  pages
}: {
  currentSlug: string;
  pages: Array<{ id: string; slug: string; title: string }>;
}) {

  return (
    <header className="site-header">
      <div className="site-brand">
        <span className="site-brand-kicker">Raw editorial / live publishing</span>
        <Link href="/" className="site-brand-title">
          ArtSite
        </Link>
      </div>
      <nav className="site-nav" aria-label="Primary">
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
    </header>
  );
}
