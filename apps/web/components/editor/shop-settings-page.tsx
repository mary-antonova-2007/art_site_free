"use client";

import { useEffect, useMemo, useState } from "react";

import type { MediaLibraryAsset, PrintFormat, SiteCommerceSettings, SiteSeoSettings } from "@/lib/content";
import { useTranslations } from "@/lib/i18n/client";

export function ShopSettingsPage({
  initialSettings,
  initialSeoSettings
}: {
  initialSettings: SiteCommerceSettings;
  initialSeoSettings: SiteSeoSettings;
}) {
  const t = useTranslations();
  const [settings, setSettings] = useState(initialSettings);
  const [seoSettings, setSeoSettings] = useState(initialSeoSettings);
  const [mediaAssets, setMediaAssets] = useState<MediaLibraryAsset[]>([]);
  const [status, setStatus] = useState("");
  const [testEmailStatus, setTestEmailStatus] = useState("");
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

  useEffect(() => {
    setSeoSettings(initialSeoSettings);
  }, [initialSeoSettings]);

  useEffect(() => {
    void fetch("/api/editor/media")
      .then((response) => response.json())
      .then((payload: { assets?: MediaLibraryAsset[] }) => setMediaAssets(payload.assets ?? []))
      .catch(() => setMediaAssets([]));
  }, []);

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
    setStatus(t("shop.saving"));
    const response = await fetch("/api/editor/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...nextSettings, seoSettings })
    });
    const payload = (await response.json()) as { error?: string; settings?: SiteCommerceSettings; seoSettings?: SiteSeoSettings };

    if (response.ok && payload.settings) {
      setSettings(payload.settings);
      if (payload.seoSettings) setSeoSettings(payload.seoSettings);
      setStatus(t("shop.saved"));
      return;
    }

    setStatus(payload.error ?? t("shop.error"));
  };

  const persistSeoSettings = async (nextSeoSettings: SiteSeoSettings) => {
    setStatus(t("shop.saving"));
    setSeoSettings(nextSeoSettings);
    const response = await fetch("/api/editor/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...settings, seoSettings: nextSeoSettings })
    });
    const payload = (await response.json()) as { error?: string; settings?: SiteCommerceSettings; seoSettings?: SiteSeoSettings };

    if (response.ok && payload.seoSettings) {
      setSeoSettings(payload.seoSettings);
      if (payload.settings) setSettings(payload.settings);
      setStatus(t("shop.saved"));
      return;
    }

    setStatus(payload.error ?? t("shop.error"));
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

  const updateEmailNotifications = (
    patch: Partial<SiteCommerceSettings["emailNotifications"]>
  ) => {
    setSettings((current) => ({
      ...current,
      emailNotifications: {
        ...current.emailNotifications,
        ...patch
      }
    }));
  };

  const sendTestEmail = async () => {
    setTestEmailStatus("Sending test email...");
    const response = await fetch("/api/editor/settings/test-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: settings.emailNotifications.adminEmail,
        emailNotifications: settings.emailNotifications
      })
    });
    const payload = (await response.json()) as { error?: string };

    setTestEmailStatus(response.ok ? "Test email sent." : payload.error ?? "Could not send test email.");
  };

  return (
    <main className="site-section section-stack width-wide">
      <div className="shop-settings-hero">
        <span className="eyebrow">{t("shop.editorMode")}</span>
        <h1 className="hero-title">{t("shop.settingsTitle")}</h1>
        <p className="section-description">
          {t("shop.settingsDescription")}
        </p>
        <div className="shop-settings-hero__actions">
          <a className="editor-button" href="/media?editor=1">
            {t("shop.assignFormats")}
          </a>
          <a className="editor-button" href="/?editor=1">
            {t("shop.returnHome")}
          </a>
        </div>
      </div>
      <label className="editor-field editor-field-checkbox">
        <span>{t("shop.cartEnabled")}</span>
        <input
          type="checkbox"
          checked={settings.cartEnabled}
          onChange={(event) => setSettings((current) => ({ ...current, cartEnabled: event.currentTarget.checked }))}
        />
      </label>

      <section className="section-stack seo-settings-section">
        <h2>{t("seo.globalTitle")}</h2>
        <label className="editor-field">
          <span>{t("seo.siteName")}</span>
          <input
            value={seoSettings.siteName}
            onChange={(event) => setSeoSettings((current) => ({ ...current, siteName: event.currentTarget.value }))}
            onBlur={() => void persistSeoSettings(seoSettings)}
          />
        </label>
        <label className="editor-field">
          <span>{t("seo.defaultOgImage")}</span>
          <select
            value={seoSettings.defaultOgImageAssetId ?? ""}
            onChange={(event) => void persistSeoSettings({ ...seoSettings, defaultOgImageAssetId: event.currentTarget.value })}
          >
            <option value="">{t("seo.noImage")}</option>
            {mediaAssets.map((asset) => (
              <option key={asset.mediaAssetId} value={asset.mediaAssetId}>{asset.title}</option>
            ))}
          </select>
        </label>
        <label className="editor-field">
          <span>{t("seo.socialProfiles")}</span>
          <textarea
            value={seoSettings.socialProfileUrls.join("\n")}
            onChange={(event) =>
              setSeoSettings((current) => ({
                ...current,
                socialProfileUrls: event.currentTarget.value.split("\n").map((item) => item.trim()).filter(Boolean)
              }))
            }
            onBlur={() => void persistSeoSettings(seoSettings)}
            rows={3}
          />
        </label>
        <label className="editor-field">
          <span>{t("seo.defaultRobots")}</span>
          <select
            value={seoSettings.defaultRobots}
            onChange={(event) =>
              void persistSeoSettings({
                ...seoSettings,
                defaultRobots: event.currentTarget.value === "noindex" ? "noindex" : "index"
              })
            }
          >
            <option value="index">{t("seo.index")}</option>
            <option value="noindex">{t("seo.noindex")}</option>
          </select>
        </label>
      </section>

      <section className="section-stack">
        <h2>{t("shop.printFormats")}</h2>
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
                <p className="shop-format-card__price">{formatPrice(format.price, t)}</p>
                <p className="shop-format-card__description">
                  {t("shop.ratio", { ratio: formatRatio(format.widthCm, format.heightCm) })}
                </p>
                <div className="shop-format-card__actions">
                  <button type="button" className="editor-button" onClick={() => openEditFormatModal(index)}>
                    {t("shop.edit")}
                  </button>
                  <button
                    type="button"
                    className="editor-button"
                    onClick={() => removeFormat(index)}
                  >
                    {t("shop.delete")}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
        <button type="button" className="editor-button" onClick={openCreateFormatModal}>
          {t("shop.addFormat")}
        </button>
      </section>

      <section className="section-stack">
        <h2>{t("shop.payments")}</h2>
        <div className="shop-payment-grid">
          {getPaymentProviderDescriptors(t).map((descriptor) => {
            const provider = getProviderSettings(settings.paymentProviders, descriptor.key);

            return (
              <article key={descriptor.key} className="shop-payment-card">
                <div className="shop-payment-card__header">
                  <div className="shop-payment-card__title">
                    <strong>{descriptor.label}</strong>
                    <span>{descriptor.description}</span>
                  </div>
                  <label className="editor-field editor-field-checkbox">
                    <span>{t("shop.enable")}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(provider.enabled)}
                      onChange={(event) => updateProvider(descriptor.key, { enabled: event.currentTarget.checked })}
                    />
                  </label>
                </div>

                <div className="shop-payment-card__grid">
                  <label className="editor-field">
                    <span>{t("shop.title")}</span>
                    <input
                      value={provider.title ?? descriptor.label}
                      onChange={(event) => updateProvider(descriptor.key, { title: event.currentTarget.value })}
                    />
                  </label>
                  <label className="editor-field">
                    <span>{t("shop.description")}</span>
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

      <section className="section-stack">
        <h2>Email notifications</h2>
        <p className="mini-note">
          After YooKassa confirms a paid order, the buyer and this notification email receive the order details.
          Use the webhook URL <code>/api/payments/yookassa/webhook</code> in YooKassa.
        </p>
        <label className="editor-field editor-field-checkbox">
          <span>Enable email notifications</span>
          <input
            type="checkbox"
            checked={Boolean(settings.emailNotifications.enabled)}
            onChange={(event) => updateEmailNotifications({ enabled: event.currentTarget.checked })}
          />
        </label>
        <div className="shop-payment-card">
          <div className="shop-payment-card__grid">
            <label className="editor-field">
              <span>Email provider</span>
              <select
                value={settings.emailNotifications.provider ?? "resend"}
                onChange={(event) => updateEmailNotifications({ provider: event.currentTarget.value === "smtp" ? "smtp" : "resend" })}
              >
                <option value="resend">Resend HTTPS API</option>
                <option value="smtp">SMTP</option>
              </select>
            </label>
            <label className="editor-field">
              <span>Notification email</span>
              <input
                type="email"
                value={settings.emailNotifications.adminEmail ?? ""}
                placeholder="schmid.olga@yandex.ru"
                onChange={(event) => updateEmailNotifications({ adminEmail: event.currentTarget.value })}
              />
            </label>
            <label className="editor-field">
              <span>Sender email</span>
              <input
                type="email"
                value={settings.emailNotifications.fromEmail ?? ""}
                placeholder="shop@example.com"
                onChange={(event) => updateEmailNotifications({ fromEmail: event.currentTarget.value })}
              />
            </label>
            <label className="editor-field">
              <span>Sender name</span>
              <input
                value={settings.emailNotifications.fromName ?? ""}
                placeholder="Olga Schmid"
                onChange={(event) => updateEmailNotifications({ fromName: event.currentTarget.value })}
              />
            </label>
            <label className="editor-field">
              <span>Reply-to email</span>
              <input
                type="email"
                value={settings.emailNotifications.replyToEmail ?? ""}
                placeholder="schmid.olga@yandex.ru"
                onChange={(event) => updateEmailNotifications({ replyToEmail: event.currentTarget.value })}
              />
            </label>
            {(settings.emailNotifications.provider ?? "resend") === "resend" ? (
              <label className="editor-field">
                <span>Resend API key</span>
                <input
                  type="password"
                  value={settings.emailNotifications.resendApiKey ?? ""}
                  placeholder="re_..."
                  onChange={(event) => updateEmailNotifications({ resendApiKey: event.currentTarget.value })}
                />
              </label>
            ) : null}
            {(settings.emailNotifications.provider ?? "resend") === "smtp" ? (
              <>
            <label className="editor-field">
              <span>SMTP host</span>
              <input
                value={settings.emailNotifications.smtpHost ?? ""}
                placeholder="smtp.yandex.ru"
                onChange={(event) => updateEmailNotifications({ smtpHost: event.currentTarget.value })}
              />
            </label>
            <label className="editor-field">
              <span>SMTP port</span>
              <input
                type="number"
                value={settings.emailNotifications.smtpPort ?? ""}
                placeholder="465"
                onChange={(event) => updateEmailNotifications({ smtpPort: event.currentTarget.value })}
              />
            </label>
            <label className="editor-field">
              <span>SMTP user</span>
              <input
                value={settings.emailNotifications.smtpUser ?? ""}
                placeholder="shop@example.com"
                onChange={(event) => updateEmailNotifications({ smtpUser: event.currentTarget.value })}
              />
            </label>
            <label className="editor-field">
              <span>SMTP password</span>
              <input
                type="password"
                value={settings.emailNotifications.smtpPassword ?? ""}
                placeholder="App password"
                onChange={(event) => updateEmailNotifications({ smtpPassword: event.currentTarget.value })}
              />
            </label>
              </>
            ) : null}
          </div>
          {(settings.emailNotifications.provider ?? "resend") === "smtp" ? (
            <label className="editor-field editor-field-checkbox">
              <span>Use SSL/TLS</span>
              <input
                type="checkbox"
                checked={settings.emailNotifications.smtpSecure !== false}
                onChange={(event) => updateEmailNotifications({ smtpSecure: event.currentTarget.checked })}
              />
            </label>
          ) : null}
          <div className="shop-settings-hero__actions">
            <button type="button" className="editor-button" onClick={() => void persistSettings(settings)}>
              Save email settings
            </button>
            <button type="button" className="editor-button" onClick={() => void sendTestEmail()}>
              Send test email
            </button>
          </div>
          {testEmailStatus ? <p className="mini-note">{testEmailStatus}</p> : null}
        </div>
      </section>

      <button
        className="editor-button editor-button-primary"
        type="button"
        onClick={() => void persistSettings(settings)}
      >
        {t("shop.save")}
      </button>
      <p>{status}</p>

      {isFormatModalOpen ? (
        <div className="shop-format-modal" role="presentation">
          <div className="shop-format-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="shop-format-modal-title" onClick={(event) => event.stopPropagation()}>
            <div className="shop-format-modal__header">
              <h3 id="shop-format-modal-title">
                {editingFormatIndex === null ? t("shop.createFormat") : t("shop.editFormat")}
              </h3>
              <button type="button" className="editor-button" onClick={() => setIsFormatModalOpen(false)}>
                {t("shop.close")}
              </button>
            </div>
            <div className="shop-format-modal__body">
              <label className="editor-field">
                <span>{t("shop.title")}</span>
                <input value={formatAutoName(draftFormat.widthCm, draftFormat.heightCm, t)} readOnly />
              </label>
              <div className="shop-format-modal__grid">
                <label className="editor-field">
                  <span>{t("shop.width", { unit: t("commerce.unitCm") })}</span>
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
                  <span>{t("shop.height", { unit: t("commerce.unitCm") })}</span>
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
                  <span>{t("shop.priceRub")}</span>
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
                <p className="shop-format-card__description">{t("shop.previewRatio")}</p>
              </div>
            </div>
            <div className="shop-format-modal__footer">
              <button type="button" className="editor-button" onClick={() => setIsFormatModalOpen(false)}>
                {t("shop.cancel")}
              </button>
              <button type="button" className="editor-button editor-button-primary" onClick={saveDraftFormat}>
                {editingFormatIndex === null ? t("shop.createFormat") : t("shop.saveChanges")}
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

function formatPrice(value: unknown, t: ReturnType<typeof useTranslations>) {
  if (value == null || value === "") {
    return t("commerce.priceNotSet");
  }

  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? `${price.toLocaleString("en-US")} ₽` : t("commerce.priceNotSet");
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

function getPaymentProviderDescriptors(t: ReturnType<typeof useTranslations>): PaymentProviderDescriptor[] {
  return [
  {
    key: "yoomoney",
    label: "YooKassa",
    description: t("shop.providerYooKassaDescription"),
    fields: [
      { key: "shopId", label: t("shop.fieldShopId"), kind: "text", placeholder: "123456" },
      { key: "secretKey", label: t("shop.fieldSecretKey"), kind: "text", placeholder: "live_secret..." },
      { key: "returnUrl", label: t("shop.fieldReturnUrl"), kind: "url", placeholder: "https://site.com/cart?paid=1" },
      { key: "currency", label: t("shop.fieldCurrency"), kind: "text", placeholder: "RUB" },
      {
        key: "descriptionTemplate",
        label: t("shop.fieldPaymentDescription"),
        kind: "text",
        placeholder: "Print order"
      }
    ]
  },
  {
    key: "sbp",
    label: "SBP",
    description: t("shop.providerSbpDescription"),
    fields: [
      { key: "merchantId", label: t("shop.fieldMerchantId"), kind: "text", placeholder: "merchant-..." },
      { key: "terminalId", label: t("shop.fieldTerminalId"), kind: "text", placeholder: "terminal-..." },
      { key: "bankName", label: t("shop.fieldBank"), kind: "text", placeholder: "Bank name" },
      { key: "qrProviderUrl", label: t("shop.fieldQrProviderUrl"), kind: "url", placeholder: "https://..." },
      { key: "returnUrl", label: t("shop.fieldReturnUrl"), kind: "url", placeholder: "https://site.com/cart/success" },
      { key: "webhookSecret", label: t("shop.fieldWebhookSecret"), kind: "text", placeholder: "secret" },
      { key: "currency", label: t("shop.fieldCurrency"), kind: "text", placeholder: "RUB" }
    ]
  },
  {
    key: "paypal",
    label: "PayPal",
    description: t("shop.providerPayPalDescription"),
    fields: [
      { key: "clientId", label: t("shop.fieldClientId"), kind: "text", placeholder: "client id" },
      { key: "clientSecret", label: t("shop.fieldClientSecret"), kind: "text", placeholder: "secret" },
      { key: "merchantId", label: t("shop.fieldMerchantId"), kind: "text", placeholder: "merchant id" },
      { key: "returnUrl", label: t("shop.fieldReturnUrl"), kind: "url", placeholder: "https://site.com/cart/success" },
      { key: "webhookId", label: t("shop.fieldWebhookId"), kind: "text", placeholder: "webhook id" },
      { key: "currency", label: t("shop.fieldCurrency"), kind: "text", placeholder: "USD" },
      { key: "environment", label: t("shop.fieldEnvironment"), kind: "select", options: ["sandbox", "live"] }
    ]
  },
  {
    key: "cards",
    label: "Visa / Mastercard",
    description: t("shop.providerCardsDescription"),
    fields: [
      { key: "gateway", label: t("shop.fieldGateway"), kind: "text", placeholder: "stripe / cloudpayments / adyen ..." },
      { key: "publicKey", label: t("shop.fieldPublicKey"), kind: "text", placeholder: "pk_..." },
      { key: "secretKey", label: t("shop.fieldSecretKey"), kind: "text", placeholder: "sk_..." },
      { key: "merchantId", label: t("shop.fieldMerchantId"), kind: "text", placeholder: "merchant id" },
      { key: "returnUrl", label: t("shop.fieldReturnUrl"), kind: "url", placeholder: "https://site.com/cart/success" },
      { key: "webhookSecret", label: t("shop.fieldWebhookSecret"), kind: "text", placeholder: "secret" },
      { key: "currency", label: t("shop.fieldCurrency"), kind: "text", placeholder: "USD" },
      { key: "testMode", label: t("shop.fieldTestMode"), kind: "select", options: ["true", "false"] }
    ]
  }
  ];
}

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
