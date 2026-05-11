"use client";

import { useEffect, useMemo, useState } from "react";

import type { PrintFormat, SiteCommerceSettings } from "@/lib/content";
import { useTranslations } from "@/lib/i18n/client";

export function ShopSettingsPage({ initialSettings }: { initialSettings: SiteCommerceSettings }) {
  const t = useTranslations();
  const [settings, setSettings] = useState(initialSettings);
  const [status, setStatus] = useState("");
  const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);
  const [editingFormatIndex, setEditingFormatIndex] = useState<number | null>(null);
  const [draftFormat, setDraftFormat] = useState<PrintFormat>({
    id: "",
    widthCm: 30,
    heightCm: 40,
    label: "",
    price: 0
  });

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  const openCreateFormatModal = () => {
    setEditingFormatIndex(null);
    setDraftFormat({
      id: crypto.randomUUID(),
      widthCm: 30,
      heightCm: 40,
      label: "",
      price: 0
    });
    setIsFormatModalOpen(true);
  };

  const openEditFormatModal = (index: number) => {
    const format = settings.printFormats[index];
    if (!format) {
      return;
    }
    setEditingFormatIndex(index);
    setDraftFormat({
      id: format.id,
      widthCm: format.widthCm,
      heightCm: format.heightCm,
      price: format.price ?? 0
    });
    setIsFormatModalOpen(true);
  };

  const saveDraftFormat = () => {
    const nextWidth = Math.max(1, Number(draftFormat.widthCm) || 1);
    const nextHeight = Math.max(1, Number(draftFormat.heightCm) || 1);
    const nextFormat: PrintFormat = {
      id: draftFormat.id || crypto.randomUUID(),
      widthCm: nextWidth,
      heightCm: nextHeight,
      label: formatAutoName(nextWidth, nextHeight, t),
      price: normalizePrice(draftFormat.price)
    };

    const nextSettings = {
      ...settings,
      printFormats:
        editingFormatIndex === null
          ? [...settings.printFormats, nextFormat]
          : settings.printFormats.map((item, itemIndex) => (itemIndex === editingFormatIndex ? nextFormat : item))
    };

    setSettings(nextSettings);
    setIsFormatModalOpen(false);
    setEditingFormatIndex(null);
    void persistSettings(nextSettings);
  };

  const formatCards = useMemo(() => settings.printFormats, [settings.printFormats]);

  const persistSettings = async (nextSettings: SiteCommerceSettings) => {
    setStatus("Сохранение...");
    const response = await fetch("/api/editor/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextSettings)
    });
    const payload = (await response.json()) as { error?: string; settings?: SiteCommerceSettings };

    if (response.ok && payload.settings) {
      setSettings(payload.settings);
      setStatus("Сохранено");
      return;
    }

    setStatus(payload.error ?? "Ошибка");
  };

  const removeFormat = (index: number) => {
    const nextSettings = {
      ...settings,
      printFormats: settings.printFormats.filter((_, itemIndex) => itemIndex !== index)
    };

    setSettings(nextSettings);
    void persistSettings(nextSettings);
  };

  const updateProvider = (
    key: string,
    patch: Partial<{
      enabled: boolean;
      title: string;
      description: string;
      settings: Record<string, string>;
    }>
  ) => {
    setSettings((current) => {
      const provider = current.paymentProviders[key] ?? { enabled: false, title: key, description: "", settings: {} };
      return {
        ...current,
        paymentProviders: {
          ...current.paymentProviders,
          [key]: {
            ...provider,
            ...patch,
            settings: patch.settings ? { ...provider.settings, ...patch.settings } : provider.settings
          }
        }
      };
    });
  };

  return (
    <main className="site-section section-stack width-wide">
      <div className="shop-settings-hero">
        <span className="eyebrow">Editor mode</span>
        <h1 className="hero-title">Настройки магазина</h1>
        <p className="section-description">
          Здесь создаются общие форматы печати и стандартные цены. На странице медиа можно включить изображение
          как товар, выбрать доступные форматы и при необходимости поставить свою цену для конкретного изображения.
        </p>
        <div className="shop-settings-hero__actions">
          <a className="editor-button" href="/media?editor=1">
            Назначить форматы изображениям
          </a>
          <a className="editor-button" href="/?editor=1">
            Вернуться на главную
          </a>
        </div>
      </div>
      <label className="editor-field editor-field-checkbox">
        <span>Корзина включена</span>
        <input
          type="checkbox"
          checked={settings.cartEnabled}
          onChange={(event) => setSettings((current) => ({ ...current, cartEnabled: event.currentTarget.checked }))}
        />
      </label>

      <section className="section-stack">
        <h2>Форматы печати</h2>
        <div className="shop-format-grid">
          {formatCards.map((format, index) => (
            <article key={format.id} className="shop-format-card">
              <div className="shop-format-card__preview" aria-hidden="true">
                <div
                  className="shop-format-card__preview-inner"
                  style={getPreviewStyle(format.widthCm, format.heightCm)}
                />
              </div>
              <div className="shop-format-card__content">
                <div className="shop-format-card__title-row">
                  <strong>{getFormatName(format, t)}</strong>
                  <span className="shop-format-card__meta">
                    {format.widthCm} × {format.heightCm} {t("commerce.unitCm")}
                  </span>
                </div>
                <p className="shop-format-card__price">{formatPrice(format.price)}</p>
                <p className="shop-format-card__description">Пропорции: {formatRatio(format.widthCm, format.heightCm)}</p>
                <div className="shop-format-card__actions">
                  <button type="button" className="editor-button" onClick={() => openEditFormatModal(index)}>
                    Редактировать
                  </button>
                  <button
                    type="button"
                    className="editor-button"
                    onClick={() => removeFormat(index)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
        <button type="button" className="editor-button" onClick={openCreateFormatModal}>
          Добавить формат
        </button>
      </section>

      <section className="section-stack">
        <h2>Платежи</h2>
        <div className="shop-payment-grid">
          {paymentProviderDescriptors.map((descriptor) => {
            const provider = getProviderSettings(settings.paymentProviders, descriptor.key);

            return (
              <article key={descriptor.key} className="shop-payment-card">
                <div className="shop-payment-card__header">
                  <div className="shop-payment-card__title">
                    <strong>{descriptor.label}</strong>
                    <span>{descriptor.description}</span>
                  </div>
                  <label className="editor-field editor-field-checkbox">
                    <span>Включить</span>
                    <input
                      type="checkbox"
                      checked={Boolean(provider.enabled)}
                      onChange={(event) => updateProvider(descriptor.key, { enabled: event.currentTarget.checked })}
                    />
                  </label>
                </div>

                <div className="shop-payment-card__grid">
                  <label className="editor-field">
                    <span>Название</span>
                    <input
                      value={provider.title ?? descriptor.label}
                      onChange={(event) => updateProvider(descriptor.key, { title: event.currentTarget.value })}
                    />
                  </label>
                  <label className="editor-field">
                    <span>Описание</span>
                    <input
                      value={provider.description ?? ""}
                      onChange={(event) => updateProvider(descriptor.key, { description: event.currentTarget.value })}
                    />
                  </label>
                </div>

                <div className="shop-payment-card__fields">
                  {descriptor.fields.map((field) => (
                    <label key={field.key} className="editor-field">
                      <span>{field.label}</span>
                      {field.kind === "textarea" ? (
                        <textarea
                          value={provider.settings?.[field.key] ?? ""}
                          placeholder={field.placeholder}
                          onChange={(event) =>
                            updateProvider(descriptor.key, {
                              settings: {
                                ...provider.settings,
                                [field.key]: event.currentTarget.value
                              }
                            })
                          }
                        />
                      ) : field.kind === "select" ? (
                        <select
                          value={provider.settings?.[field.key] ?? field.options[0]}
                          onChange={(event) =>
                            updateProvider(descriptor.key, {
                              settings: {
                                ...provider.settings,
                                [field.key]: event.currentTarget.value
                              }
                            })
                          }
                        >
                          {field.options.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          value={provider.settings?.[field.key] ?? ""}
                          placeholder={field.placeholder}
                          type={field.key === "secretKey" ? "password" : field.kind === "number" ? "number" : field.kind}
                          inputMode={field.kind === "number" ? "numeric" : "text"}
                          onChange={(event) =>
                            updateProvider(descriptor.key, {
                              settings: {
                                ...provider.settings,
                                [field.key]: event.currentTarget.value
                              }
                            })
                          }
                        />
                      )}
                    </label>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <button
        className="editor-button editor-button-primary"
        type="button"
        onClick={() => void persistSettings(settings)}
      >
        Сохранить
      </button>
      <p>{status}</p>

      {isFormatModalOpen ? (
        <div className="shop-format-modal" role="presentation">
          <div className="shop-format-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="shop-format-modal-title" onClick={(event) => event.stopPropagation()}>
            <div className="shop-format-modal__header">
              <h3 id="shop-format-modal-title">{editingFormatIndex === null ? "Создать формат" : "Редактировать формат"}</h3>
              <button type="button" className="editor-button" onClick={() => setIsFormatModalOpen(false)}>
                Закрыть
              </button>
            </div>
            <div className="shop-format-modal__body">
              <label className="editor-field">
                <span>Название</span>
                <input value={formatAutoName(draftFormat.widthCm, draftFormat.heightCm, t)} readOnly />
              </label>
              <div className="shop-format-modal__grid">
                <label className="editor-field">
                  <span>Ширина, {t("commerce.unitCm")}</span>
                  <input
                    type="number"
                    min={1}
                    value={draftFormat.widthCm}
                    onChange={(event) => {
                      const value = Number(event.currentTarget.value);
                      setDraftFormat((current) => ({ ...current, widthCm: value }));
                    }}
                  />
                </label>
                <label className="editor-field">
                  <span>Высота, {t("commerce.unitCm")}</span>
                  <input
                    type="number"
                    min={1}
                    value={draftFormat.heightCm}
                    onChange={(event) => {
                      const value = Number(event.currentTarget.value);
                      setDraftFormat((current) => ({ ...current, heightCm: value }));
                    }}
                  />
                </label>
                <label className="editor-field">
                  <span>Цена, ₽</span>
                  <input
                    type="number"
                    min={0}
                    value={draftFormat.price ?? 0}
                    onChange={(event) => {
                      const value = Number(event.currentTarget.value);
                      setDraftFormat((current) => ({ ...current, price: value }));
                    }}
                  />
                </label>
              </div>
              <div className="shop-format-modal__preview">
                <div className="shop-format-card__preview" aria-hidden="true">
                  <div className="shop-format-card__preview-inner" style={getPreviewStyle(draftFormat.widthCm, draftFormat.heightCm)} />
                </div>
                <p className="shop-format-card__description">Пример пропорций для выбранного размера</p>
              </div>
            </div>
            <div className="shop-format-modal__footer">
              <button type="button" className="editor-button" onClick={() => setIsFormatModalOpen(false)}>
                Отмена
              </button>
              <button type="button" className="editor-button editor-button-primary" onClick={saveDraftFormat}>
                {editingFormatIndex === null ? "Создать формат" : "Сохранить изменения"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function getPreviewStyle(widthCm: number, heightCm: number) {
  const width = Math.max(1, Number(widthCm) || 1);
  const height = Math.max(1, Number(heightCm) || 1);
  const ratio = width / height;

  return ratio >= 1
    ? { aspectRatio: `${ratio}`, width: "100%" }
    : { aspectRatio: `${ratio}`, height: "100%" };
}

function formatRatio(widthCm: number, heightCm: number) {
  const divisor = gcd(Math.round(widthCm), Math.round(heightCm));
  return `${Math.round(widthCm / divisor)}:${Math.round(heightCm / divisor)}`;
}

function formatAutoName(widthCm: number, heightCm: number, t: (key: "commerce.unitCm") => string) {
  return `${Math.max(1, Number(widthCm) || 1)} × ${Math.max(1, Number(heightCm) || 1)} ${t("commerce.unitCm")}`;
}

function getFormatName(format: PrintFormat, t: (key: "commerce.unitCm") => string) {
  const width = Math.max(1, Number(format.widthCm) || 1);
  const height = Math.max(1, Number(format.heightCm) || 1);
  return formatAutoName(width, height, t);
}

function gcd(a: number, b: number): number {
  if (!b) {
    return Math.max(1, a);
  }
  return gcd(b, a % b);
}

function normalizePrice(value: unknown) {
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : undefined;
}

function formatPrice(value: unknown) {
  if (value == null || value === "") {
    return "Цена не задана";
  }

  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? `${price.toLocaleString("ru-RU")} ₽` : "Цена не задана";
}

type PaymentProviderDescriptor = {
  key: string;
  label: string;
  description: string;
  fields: Array<
    | { key: string; label: string; kind: "text" | "number" | "url"; placeholder?: string }
    | { key: string; label: string; kind: "textarea"; placeholder?: string }
    | { key: string; label: string; kind: "select"; options: string[] }
  >;
};

const paymentProviderDescriptors: PaymentProviderDescriptor[] = [
  {
    key: "yoomoney",
    label: "ЮKassa",
    description: "Готовая страница оплаты: карты, СБП и другие способы из личного кабинета",
    fields: [
      { key: "shopId", label: "Shop ID", kind: "text", placeholder: "123456" },
      { key: "secretKey", label: "Секретный ключ", kind: "text", placeholder: "live_secret..." },
      { key: "returnUrl", label: "URL возврата", kind: "url", placeholder: "https://site.ru/cart?paid=1" },
      { key: "currency", label: "Валюта", kind: "text", placeholder: "RUB" },
      {
        key: "descriptionTemplate",
        label: "Описание платежа",
        kind: "text",
        placeholder: "Заказ на печать"
      }
    ]
  },
  {
    key: "sbp",
    label: "СБП",
    description: "QR или deeplink для быстрых платежей",
    fields: [
      { key: "merchantId", label: "Merchant ID", kind: "text", placeholder: "merchant-..." },
      { key: "terminalId", label: "Terminal ID", kind: "text", placeholder: "terminal-..." },
      { key: "bankName", label: "Банк", kind: "text", placeholder: "Точка, Сбербанк, Т-Банк..." },
      { key: "qrProviderUrl", label: "QR provider URL", kind: "url", placeholder: "https://..." },
      { key: "returnUrl", label: "URL возврата", kind: "url", placeholder: "https://site.ru/cart/success" },
      { key: "webhookSecret", label: "Webhook secret", kind: "text", placeholder: "secret" },
      { key: "currency", label: "Валюта", kind: "text", placeholder: "RUB" }
    ]
  },
  {
    key: "paypal",
    label: "PayPal",
    description: "Платежи для зарубежных клиентов",
    fields: [
      { key: "clientId", label: "Client ID", kind: "text", placeholder: "client id" },
      { key: "clientSecret", label: "Client Secret", kind: "text", placeholder: "secret" },
      { key: "merchantId", label: "Merchant ID", kind: "text", placeholder: "merchant id" },
      { key: "returnUrl", label: "Return URL", kind: "url", placeholder: "https://site.ru/cart/success" },
      { key: "webhookId", label: "Webhook ID", kind: "text", placeholder: "webhook id" },
      { key: "currency", label: "Валюта", kind: "text", placeholder: "USD" },
      { key: "environment", label: "Окружение", kind: "select", options: ["sandbox", "live"] }
    ]
  },
  {
    key: "cards",
    label: "Visa / Mastercard",
    description: "Эквайринг для международных банковских карт",
    fields: [
      { key: "gateway", label: "Gateway", kind: "text", placeholder: "stripe / cloudpayments / adyen ..." },
      { key: "publicKey", label: "Public key", kind: "text", placeholder: "pk_..." },
      { key: "secretKey", label: "Secret key", kind: "text", placeholder: "sk_..." },
      { key: "merchantId", label: "Merchant ID", kind: "text", placeholder: "merchant id" },
      { key: "returnUrl", label: "Return URL", kind: "url", placeholder: "https://site.ru/cart/success" },
      { key: "webhookSecret", label: "Webhook secret", kind: "text", placeholder: "secret" },
      { key: "currency", label: "Валюта", kind: "text", placeholder: "USD" },
      { key: "testMode", label: "Тестовый режим", kind: "select", options: ["true", "false"] }
    ]
  }
];

function getProviderSettings(
  providers: SiteCommerceSettings["paymentProviders"],
  key: string
): {
  enabled?: boolean;
  title?: string;
  description?: string;
  settings?: Record<string, string>;
} {
  return providers[key] ?? { enabled: false, title: key, description: "", settings: {} };
}
