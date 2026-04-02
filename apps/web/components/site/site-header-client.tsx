"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { useEditor } from "@/components/editor/editor-provider";
import { LocaleSwitcher } from "@/components/site/locale-switcher";
import { SitePageMenu } from "@/components/site/site-page-menu";

function measureNavContentWidth(nav: HTMLElement) {
  const styles = window.getComputedStyle(nav);
  const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
  const items = Array.from(nav.children) as HTMLElement[];

  return items.reduce((total, item, index) => {
    const nextTotal = total + item.getBoundingClientRect().width;
    return index === 0 ? nextTotal : nextTotal + gap;
  }, 0);
}

export function SiteHeaderClient({
  currentSlug,
  pages,
  currentPath,
  editorEnabled,
  kicker,
  primaryNavLabel,
  blockItems
}: {
  currentSlug: string;
  pages: Array<{ id: string; slug: string; title: string }>;
  currentPath: string;
  editorEnabled: boolean;
  kicker: string;
  primaryNavLabel: string;
  blockItems: Array<{ id: string; label: string }>;
}) {
  const { compactNavigation, setCompactNavigation } = useEditor();
  const headerRef = useRef<HTMLElement | null>(null);
  const brandRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const controlsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 920px)");
    let frameId: number | null = null;

    const updateOverflow = () => {
      const header = headerRef.current;
      const brand = brandRef.current;
      const nav = navRef.current;
      const controls = controlsRef.current;

      if (!header || !brand || !nav) {
        return;
      }

      if (media.matches) {
        setCompactNavigation(true);
        return;
      }

      const headerWidth = header.clientWidth;
      const brandWidth = brand.offsetWidth;
      const controlsWidth = controls?.offsetWidth ?? 0;
      const navWidth = measureNavContentWidth(nav);
      const availableWidth = headerWidth - brandWidth - controlsWidth - 88;
      const pageNavOverflow = availableWidth <= 0 || navWidth > availableWidth + 4;
      const blockTrack = document.querySelector<HTMLElement>("[data-block-nav-track='true']");
      const blockNavOverflow = blockTrack
        ? blockTrack.scrollWidth > blockTrack.clientWidth + 4
        : false;
      const nextCompact = pageNavOverflow || blockNavOverflow;

      setCompactNavigation((current) => (current === nextCompact ? current : nextCompact));
    };

    const scheduleUpdate = () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        updateOverflow();
      });
    };

    scheduleUpdate();

    const resizeObserver = new ResizeObserver(scheduleUpdate);

    if (headerRef.current) {
      resizeObserver.observe(headerRef.current);
    }

    if (brandRef.current) {
      resizeObserver.observe(brandRef.current);
    }

    if (controlsRef.current) {
      resizeObserver.observe(controlsRef.current);
    }

    const blockTrack = document.querySelector<HTMLElement>("[data-block-nav-track='true']");

    if (blockTrack) {
      resizeObserver.observe(blockTrack);
      Array.from(blockTrack.children).forEach((child) => resizeObserver.observe(child));
    }

    window.addEventListener("resize", scheduleUpdate);
    media.addEventListener("change", scheduleUpdate);

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleUpdate);
      media.removeEventListener("change", scheduleUpdate);
    };
  }, [blockItems, setCompactNavigation]);

  return (
    <header ref={headerRef} className="site-header" data-compact-nav={compactNavigation}>
      <div ref={brandRef} className="site-brand">
        <span className="site-brand-kicker">{kicker}</span>
        <Link href="/" className="site-brand-title">
          ArtSite
        </Link>
      </div>
      <nav
        ref={navRef}
        className="site-nav"
        aria-label={primaryNavLabel}
        data-hidden={compactNavigation}
      >
        {pages.map((page) => (
          <Link
            key={page.id}
            className="site-nav__link"
            href={page.slug === "home" ? "/" : `/${page.slug}`}
            data-current={page.slug === currentSlug}
          >
            {page.title}
          </Link>
        ))}
      </nav>
      <div ref={controlsRef} className="site-header__controls">
        {editorEnabled ? <LocaleSwitcher currentPath={currentPath} /> : null}
      </div>
      <SitePageMenu currentSlug={currentSlug} pages={pages} blockItems={blockItems} />
    </header>
  );
}
