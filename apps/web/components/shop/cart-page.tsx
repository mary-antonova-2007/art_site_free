"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { clearCart, readCart, writeCart, type CartItem } from "@/lib/cart";
import type { PrintFormat, SiteCommerceSettings } from "@/lib/content";
import { useTranslations } from "@/lib/i18n/client";

export function CartPage({ commerceSettings }: { commerceSettings: SiteCommerceSettings }) {
  const t = useTranslations();
  const [items, setItems] = useState<CartItem[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState("");

  useEffect(() => {
    setItems(readCart());
    const sync = () => setItems(readCart());
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + getEffectivePriceValue(item.format) * item.quantity, 0);
  const enabledPaymentProviders = Object.entries(commerceSettings.paymentProviders).filter(([, provider]) =>
    Boolean(provider.enabled)
  );

  function persistItems(nextItems: CartItem[]) {
    setItems(nextItems);
    writeCart(nextItems);
  }

  function updateQuantity(itemId: string, quantity: number) {
    persistItems(
      items.map((item) => (item.id === itemId ? { ...item, quantity: Math.max(1, quantity) } : item))
    );
  }

  function updateFormat(itemId: string, formatId: string) {
    const currentItem = items.find((item) => item.id === itemId);
    if (!currentItem) {
      return;
    }

    const nextFormat = getFormatOptions(currentItem, commerceSettings.printFormats).find((format) => format.id === formatId);
    if (!nextFormat) {
      return;
    }

    const nextId = `${currentItem.imageSrc}:${nextFormat.id}`;
    const existingItem = items.find((item) => item.id === nextId && item.id !== itemId);

    if (existingItem) {
      persistItems(
        items
          .filter((item) => item.id !== itemId)
          .map((item) =>
            item.id === nextId ? { ...item, quantity: item.quantity + currentItem.quantity } : item
          )
      );
      return;
    }

    persistItems(items.map((item) => (item.id === itemId ? { ...item, format: nextFormat, id: nextId } : item)));
  }

  function removeItem(itemId: string) {
    persistItems(items.filter((item) => item.id !== itemId));
  }

  return (
    <main className="site-section section-stack width-wide cart-page">
      <div className="cart-page__header">
        <div>
          <span className="eyebrow">{t("commerce.checkout")}</span>
          <h1 className="hero-title">{t("commerce.cart")}</h1>
        </div>
        <div className="cart-page__header-actions">
          <a className="cart-return-link" href="/">
            <ArrowLeft size={17} />
            <span>{t("commerce.continueShopping")}</span>
          </a>
          <div className="cart-page__summary">
            <ShoppingBag size={18} />
            <span>{t("commerce.itemsCount", { count: totalItems })} · {formatPrice(subtotal, t)}</span>
          </div>
        </div>
      </div>

      {!commerceSettings.cartEnabled ? <p className="mini-note">{t("commerce.cartDisabled")}</p> : null}
      {items.length ? (
        <div className="cart-layout">
          <section className="cart-panel">
            <div className="cart-panel__header">
              <h2>{t("commerce.items")}</h2>
              <button className="cart-link-button" type="button" onClick={() => persistItems([])}>
                {t("commerce.clear")}
              </button>
            </div>
            <div className="cart-list">
              {items.map((item) => {
                const formatOptions = getFormatOptions(item, commerceSettings.printFormats);

                return (
                  <article className="cart-item" key={item.id}>
                    <img className="cart-item__image" src={item.imageSrc} alt={item.alt} />
                    <div className="cart-item__body">
                      <div className="cart-item__title-row">
                        <strong>{item.title}</strong>
                        <button
                          className="cart-icon-button"
                          type="button"
                          aria-label={t("commerce.removeItem")}
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="cart-item__controls">
                        <label className="cart-compact-field">
                          <span>{t("commerce.size")}</span>
                          <select value={item.format.id} onChange={(event) => updateFormat(item.id, event.currentTarget.value)}>
                            {formatOptions.map((format) => (
                              <option key={format.id} value={format.id}>
                                {getFormatName(format, t)} · {formatPrice(getEffectivePrice(format), t)}
                              </option>
                            ))}
                          </select>
                        </label>

                        <div className="cart-quantity" aria-label={t("commerce.quantity")}>
                          <button
                            className="cart-icon-button"
                            type="button"
                            aria-label={t("commerce.decreaseQuantity")}
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus size={15} />
                          </button>
                          <input
                            value={item.quantity}
                            min={1}
                            type="number"
                            onChange={(event) => updateQuantity(item.id, Number(event.currentTarget.value) || 1)}
                          />
                          <button
                            className="cart-icon-button"
                            type="button"
                            aria-label={t("commerce.increaseQuantity")}
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus size={15} />
                          </button>
                        </div>
                      </div>
                      <div className="cart-item__price-row">
                        <span>{formatPrice(getEffectivePrice(item.format), t)} {t("commerce.each")}</span>
                        <strong>{formatPrice(getEffectivePriceValue(item.format) * item.quantity, t)}</strong>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <form
            className="cart-checkout"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              const paymentProvider = String(formData.get("paymentProvider") ?? "");

              if (paymentProvider === "yoomoney") {
                void startYooKassaCheckout({
                  items,
                  customer: {
                    name: String(formData.get("name") ?? ""),
                    phone: String(formData.get("phone") ?? ""),
                    email: String(formData.get("email") ?? ""),
                    city: String(formData.get("city") ?? ""),
                    address: String(formData.get("address") ?? "")
                  },
                  setCheckoutStatus,
                  t
                });
                return;
              }

              clearCart();
              setItems([]);
              setSubmitted(true);
            }}
          >
            <div className="cart-checkout__header">
              <h2>{t("commerce.contactDelivery")}</h2>
              <p>{t("commerce.contactDeliveryHint")}</p>
            </div>
            <label className="editor-field">
              <span>{t("commerce.name")}</span>
              <input required name="name" />
            </label>
            <label className="editor-field">
              <span>{t("commerce.phone")}</span>
              <input required name="phone" />
            </label>
            <label className="editor-field">
              <span>{t("commerce.email")}</span>
              <input required type="email" name="email" />
            </label>
            <label className="editor-field">
              <span>{t("commerce.countryCity")}</span>
              <input required name="city" />
            </label>
            <label className="editor-field">
              <span>{t("commerce.deliveryAddress")}</span>
              <textarea required name="address" />
            </label>
            <section className="cart-payment-panel">
              <h2>{t("commerce.payment")}</h2>
              <div className="cart-total-line">
                <span>{t("commerce.total")}</span>
                <strong>{formatPrice(subtotal, t)}</strong>
              </div>
              {enabledPaymentProviders.length ? (
                <div className="cart-payment-list">
                  {enabledPaymentProviders.map(([key, provider], index) => (
                    <label key={key} className="cart-payment-option">
                      <input type="radio" name="paymentProvider" value={key} required defaultChecked={index === 0} />
                      <span>{provider.title ?? key}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="mini-note">{t("commerce.noPaymentProviders")}</p>
              )}
            </section>
            <div className="cart-checkout__actions">
              <button className="editor-button editor-button-primary" type="submit">
                {t("commerce.placeOrder")}
              </button>
            </div>
            {checkoutStatus ? <p className="mini-note">{checkoutStatus}</p> : null}
          </form>
        </div>
      ) : (
        <section className="cart-empty">
          <ShoppingBag size={28} />
          <p>{submitted ? t("commerce.orderPlaced") : t("commerce.cartEmpty")}</p>
        </section>
      )}
    </main>
  );
}

async function startYooKassaCheckout(input: {
  items: CartItem[];
  customer: {
    name: string;
    phone: string;
    email: string;
    city: string;
    address: string;
  };
  setCheckoutStatus: (message: string) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  input.setCheckoutStatus(input.t("commerce.creatingYooKassaPayment"));

  const response = await fetch("/api/payments/yookassa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: input.items,
      customer: input.customer
    })
  });

  const payload = (await response.json()) as {
    confirmationUrl?: string;
    error?: string;
    details?: { description?: string; parameter?: string; code?: string };
  };

  if (!response.ok || !payload.confirmationUrl) {
    const details = payload.details?.description
      ? `${payload.details.description}${payload.details.parameter ? ` (${payload.details.parameter})` : ""}`
      : "";
    input.setCheckoutStatus(details || payload.error || input.t("commerce.paymentRedirectFailed"));
    return;
  }

  window.location.href = payload.confirmationUrl;
}

function getFormatOptions(item: CartItem, globalFormats: PrintFormat[]) {
  const formats = item.availableFormats?.length ? [item.format, ...item.availableFormats] : [item.format, ...globalFormats];
  const unique = new Map<string, PrintFormat>();

  formats.forEach((format) => {
    if (!unique.has(format.id)) {
      unique.set(format.id, format);
    }
  });

  return Array.from(unique.values());
}

function getEffectivePrice(format: PrintFormat) {
  return format.priceOverride ?? format.price;
}

function getEffectivePriceValue(format: PrintFormat) {
  const price = Number(getEffectivePrice(format));
  return Number.isFinite(price) && price >= 0 ? price : 0;
}

function formatPrice(value: unknown, t: ReturnType<typeof useTranslations>) {
  if (value == null || value === "") {
    return t("commerce.priceNotSet");
  }

  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? `${price.toLocaleString("en-US")} ₽` : t("commerce.priceNotSet");
}

function getFormatName(format: PrintFormat, t: (key: "commerce.unitCm") => string) {
  const width = Math.max(1, Number(format.widthCm) || 1);
  const height = Math.max(1, Number(format.heightCm) || 1);
  return `${width} × ${height} ${t("commerce.unitCm")}`;
}
