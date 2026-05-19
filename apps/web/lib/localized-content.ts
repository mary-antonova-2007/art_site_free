import type { Locale } from "@/lib/i18n/config";
import type { SiteBlockRecord, SitePageRecord } from "./content";

type LocalizedData = {
  i18n?: Partial<Record<Locale, Record<string, unknown>>>;
};

export function localizePage(page: SitePageRecord, locale: Locale): SitePageRecord {
  return {
    ...page,
    blocks: page.blocks.map((block) => localizeBlock(block, locale))
  };
}

export function localizeBlock<TBlock extends SiteBlockRecord>(block: TBlock, locale: Locale): TBlock {
  return {
    ...block,
    data: localizeBlockData(block.data as Record<string, unknown>, locale) as TBlock["data"]
  };
}

export function localizeBlockData<TData extends Record<string, unknown>>(data: TData, locale: Locale): TData {
  const localized = (data as LocalizedData).i18n?.[locale];

  if (!localized || typeof localized !== "object") {
    return data;
  }

  return {
    ...data,
    ...localized
  };
}

export function getLocalizedBlockNavigationLabel(block: SiteBlockRecord, locale: Locale) {
  const data = localizeBlockData(block.data as Record<string, unknown>, locale);

  if (!data.showInNavigation) {
    return null;
  }

  const candidates = [data.title, data.eyebrow, data.caption, data.quote, data.author, data.buttonText];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}
