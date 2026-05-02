"use client";

import { useEffect, useState } from "react";

import { clearCart, readCart, type CartItem } from "@/lib/cart";
import type { SiteCommerceSettings } from "@/lib/content";

export function CartPage({ commerceSettings }: { commerceSettings: SiteCommerceSettings }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setItems(readCart());
    const sync = () => setItems(readCart());
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <main className="site-section section-stack width-wide cart-page">
      <h1 className="hero-title">Корзина</h1>
      {!commerceSettings.cartEnabled ? <p>Корзина отключена в настройках магазина.</p> : null}
      {items.length ? (
        <>
          <div className="cart-list">
            {items.map((item) => (
              <article className="cart-item" key={item.id}>
                <img src={item.imageSrc} alt={item.alt} />
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.format.label ?? `${item.format.widthCm} × ${item.format.heightCm} см`}</p>
                  <p>Количество: {item.quantity}</p>
                </div>
              </article>
            ))}
          </div>
          <p>Позиций: {totalItems}</p>
          <form
            className="cart-checkout"
            onSubmit={(event) => {
              event.preventDefault();
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
            <div className="product-modal__actions">
              <button className="editor-button editor-button-primary" type="submit">
                Оформить заказ
              </button>
            </div>
          </form>
          <section className="section-stack">
            <h2>Способы оплаты</h2>
            {Object.entries(commerceSettings.paymentProviders).map(([key, provider]) => (
              <label key={key} className="editor-field editor-field-checkbox">
                <span>{provider.title ?? key}</span>
                <input type="checkbox" checked={Boolean(provider.enabled)} readOnly />
              </label>
            ))}
          </section>
        </>
      ) : (
        <p>{submitted ? "Заказ оформлен, корзина очищена." : "Корзина пуста."}</p>
      )}
    </main>
  );
}
