"use client";

import Link from "next/link";

import { useTranslations } from "@/lib/i18n/client";

export default function NotFound() {
  const t = useTranslations();

  return (
    <div className="site-frame">
      <section className="site-section section-stack width-medium">
        <p className="eyebrow">404</p>
        <h1 className="section-title">{t("notFound.title")}</h1>
        <p className="section-description">{t("notFound.description")}</p>
        <Link href="/" className="pill-link">
          {t("notFound.returnHome")}
        </Link>
      </section>
    </div>
  );
}
