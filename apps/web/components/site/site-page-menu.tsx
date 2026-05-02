"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { getBlockAnchorId } from "@/lib/block-navigation";

export function SitePageMenu({
  currentSlug,
  pages,
  blockItems,
  compactNavigation
}: {
  currentSlug: string;
  pages: Array<{ id: string; slug: string; title: string }>;
  blockItems: Array<{ id: string; label: string }>;
  compactNavigation: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 920px)");

    const sync = () => {
      setIsCompact(media.matches);
      setIsScrolled(window.scrollY > 72);
    };

    sync();
    window.addEventListener("scroll", sync, { passive: true });
    media.addEventListener("change", sync);

    return () => {
      window.removeEventListener("scroll", sync);
      media.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const visible = isCompact || isScrolled || compactNavigation;

  if (!visible) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className="site-page-menu__button"
        aria-expanded={open}
        aria-label={open ? "Закрыть меню страниц" : "Открыть меню страниц"}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>
      {open ? (
        <div className="site-page-menu__layer" onClick={() => setOpen(false)}>
          <div className="site-page-menu__popover" onClick={(event) => event.stopPropagation()}>
            <div className="site-page-menu__list">
              <div className="site-page-menu__splitter" />
              <div className="site-page-menu__label">Страницы</div>
              <div className="site-page-menu__splitter" />
              {pages.map((page) => (
                <Link
                  key={page.id}
                  href={page.slug === "home" ? "/" : `/${page.slug}`}
                  className="site-page-menu__link"
                  data-current={page.slug === currentSlug}
                  onClick={() => setOpen(false)}
                >
                  {page.title}
                </Link>
              ))}
              {blockItems.length ? <div className="site-page-menu__splitter" /> : null}
              {blockItems.length ? <div className="site-page-menu__label">Разделы</div> : null}
              {blockItems.length ? <div className="site-page-menu__splitter" /> : null}
              {blockItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="site-page-menu__link site-page-menu__link--secondary"
                  onClick={() => {
                    document
                      .getElementById(getBlockAnchorId(item.id))
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                    setOpen(false);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
