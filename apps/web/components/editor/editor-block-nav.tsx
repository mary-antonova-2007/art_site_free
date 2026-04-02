"use client";

import { useEffect, useMemo, useState } from "react";

import { getBlockAnchorId, getBlockNavigationLabel } from "@/lib/block-navigation";

import { useEditor } from "./editor-provider";

export function EditorBlockNav() {
  const { blocks, compactNavigation } = useEditor();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isStuck, setIsStuck] = useState(false);
  const items = useMemo(
    () =>
      blocks
        .map((block) => ({
          id: block.id,
          label: getBlockNavigationLabel(block)
        }))
        .filter((item): item is { id: string; label: string } => Boolean(item.label)),
    [blocks]
  );

  useEffect(() => {
    if (items.length === 0) {
      setActiveId(null);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (visibleEntry) {
          setActiveId(String(visibleEntry.target.id).replace(/^site-block-/, ""));
        }
      },
      {
        rootMargin: "-140px 0px -55% 0px",
        threshold: [0.2, 0.35, 0.5, 0.7]
      }
    );

    items.forEach((item) => {
      const target = document.getElementById(getBlockAnchorId(item.id));

      if (target) {
        observer.observe(target);
      }
    });

    return () => observer.disconnect();
  }, [items]);

  useEffect(() => {
    const handleScroll = () => {
      setIsStuck(window.scrollY > 56);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      className="block-jump-nav"
      aria-label="Block navigation"
      data-stuck={isStuck}
      data-hidden={compactNavigation}
    >
      <div className="block-jump-nav__track" data-block-nav-track="true">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="block-jump-nav__item"
            data-active={activeId === item.id}
            onClick={() => {
              document
                .getElementById(getBlockAnchorId(item.id))
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
