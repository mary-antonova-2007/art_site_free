"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

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
          <span className="eyebrow">Оформление заказа</span>
          <h1 className="hero-title">Корзина</h1>
        </div>
        <div className="cart-page__summary">
          <ShoppingBag size={18} />
          <span>{totalItems} шт. · {formatPrice(subtotal)}</span>
        </div>
      </div>

      {!commerceSettings.cartEnabled ? <p className="mini-note">Корзина отключена в настройках магазина.</p> : null}
      {items.length ? (
        <div className="cart-layout">
          <section className="cart-panel">
            <div className="cart-panel__header">
              <h2>Товары</h2>
              <button className="cart-link-button" type="button" onClick={() => persistItems([])}>
                Очистить
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
                          aria-label="Удалить товар"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="cart-item__controls">
                        <label className="cart-compact-field">
                          <span>Размер</span>
                          <select value={item.format.id} onChange={(event) => updateFormat(item.id, event.currentTarget.value)}>
                            {formatOptions.map((format) => (
                              <option key={format.id} value={format.id}>
                                {getFormatName(format, t)} · {formatPrice(getEffectivePrice(format))}
                              </option>
                            ))}
                          </select>
                        </label>

                        <div className="cart-quantity" aria-label="Количество">
                          <button
                            className="cart-icon-button"
                            type="button"
                            aria-label="Уменьшить количество"
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
                            aria-label="Увеличить количество"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus size={15} />
                          </button>
                        </div>
                      </div>
                      <div className="cart-item__price-row">
                        <span>{formatPrice(getEffectivePrice(item.format))} за шт.</span>
                        <strong>{formatPrice(getEffectivePriceValue(item.format) * item.quantity)}</strong>
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
                  setCheckoutStatus
                });
                return;
              }

              clearCart();
              setItems([]);
              setSubmitted(true);
            }}
          >
            <label className="editor-field">
              <span>Имя</span>
              <input required name="name" />
            </label>
            <label className="editor-field">
              <span>Телефон</span>
              <input required name="phone" />
            </label>
            <label className="editor-field">
              <span>Email</span>
              <input required type="email" name="email" />
            </label>
            <label className="editor-field">
              <span>Страна / город</span>
              <input required name="city" />
            </label>
            <label className="editor-field">
              <span>Адрес доставки</span>
              <textarea required name="address" />
            </label>
            <section className="cart-payment-panel">
              <h2>Оплата</h2>
              <div className="cart-total-line">
                <span>Итого</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              {enabledPaymentProviders.length ? (
                <div className="cart-payment-list">
                  {enabledPaymentProviders.map(([key, provider]) => (
                    <label key={key} className="cart-payment-option">
                      <input type="radio" name="paymentProvider" value={key} required />
                      <span>{provider.title ?? key}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="mini-note">Платежные сервисы пока не включены.</p>
              )}
            </section>
            <div className="cart-checkout__actions">
              <button className="editor-button editor-button-primary" type="submit">
                Оформить заказ
              </button>
            </div>
            {checkoutStatus ? <p className="mini-note">{checkoutStatus}</p> : null}
          </form>
        </div>
      ) : (
        <section className="cart-empty">
          <ShoppingBag size={28} />
          <p>{submitted ? "Заказ оформлен, корзина очищена." : "Корзина пуста."}</p>
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
}) {
  input.setCheckoutStatus("Создаём платеж в ЮKassa...");

  const response = await fetch("/api/payments/yookassa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: input.items,
      customer: input.customer
    })
  });

  const payload = (await response.json()) as { confirmationUrl?: string; error?: string };

  if (!response.ok || !payload.confirmationUrl) {
    input.setCheckoutStatus(payload.error ?? "Не удалось перейти к оплате.");
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

function formatPrice(value: unknown) {
  if (value == null || value === "") {
    return "Цена не задана";
  }

  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? `${price.toLocaleString("ru-RU")} ₽` : "Цена не задана";
}

function getFormatName(format: PrintFormat, t: (key: "commerce.unitCm") => string) {
  const width = Math.max(1, Number(format.widthCm) || 1);
  const height = Math.max(1, Number(format.heightCm) || 1);
  return `${width} × ${height} ${t("commerce.unitCm")}`;
}
