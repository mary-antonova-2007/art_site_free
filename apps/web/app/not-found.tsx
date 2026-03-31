import Link from "next/link";

export default function NotFound() {
  return (
    <div className="site-frame">
      <section className="site-section section-stack width-medium">
        <p className="eyebrow">404</p>
        <h1 className="section-title">This page is not in the archive.</h1>
        <p className="section-description">
          The live system will eventually route real pages from the database. For now, go back
          to the home page.
        </p>
        <Link href="/" className="pill-link">
          Return home
        </Link>
      </section>
    </div>
  );
}
