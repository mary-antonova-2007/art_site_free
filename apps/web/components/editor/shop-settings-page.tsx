"use client";

import { useEffect, useState } from "react";

import type { PrintFormat, SiteCommerceSettings } from "@/lib/content";

export function ShopSettingsPage({ initialSettings }: { initialSettings: SiteCommerceSettings }) {
  const [settings, setSettings] = useState(initialSettings);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  const updateFormat = (index: number, patch: Partial<PrintFormat>) => {
    setSettings((current) => ({
      ...current,
      printFormats: current.printFormats.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
    }));
  };

  return (
    <main className="site-section section-stack width-wide">
      <h1 className="hero-title">Настройки магазина</h1>
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
        {settings.printFormats.map((format, index) => (
          <div key={format.id} className="editor-media-item">
            <div className="editor-media-item__body">
              <strong>{format.label ?? format.id}</strong>
              <div className="editor-media-item__meta">
                <input value={format.widthCm} type="number" min={1} onChange={(event) => updateFormat(index, { widthCm: Number(event.currentTarget.value) })} />
                <input value={format.heightCm} type="number" min={1} onChange={(event) => updateFormat(index, { heightCm: Number(event.currentTarget.value) })} />
                <input value={format.label ?? ""} placeholder="Подпись" onChange={(event) => updateFormat(index, { label: event.currentTarget.value })} />
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="editor-button"
          onClick={() =>
            setSettings((current) => ({
              ...current,
              printFormats: [
                ...current.printFormats,
                { id: crypto.randomUUID(), widthCm: 30, heightCm: 40, label: "30 × 40" }
              ]
            }))
          }
        >
          Добавить формат
        </button>
      </section>

      <section className="section-stack">
        <h2>Платежи</h2>
        {Object.entries(settings.paymentProviders).map(([key, provider]) => (
          <div key={key} className="editor-media-item">
            <label className="editor-field editor-field-checkbox">
              <span>{provider.title ?? key}</span>
              <input
                type="checkbox"
                checked={Boolean(provider.enabled)}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    paymentProviders: {
                      ...current.paymentProviders,
                      [key]: { ...provider, enabled: event.currentTarget.checked }
                    }
                  }))
                }
              />
            </label>
            <div className="editor-media-item__body">
              <input
                value={provider.title ?? ""}
                placeholder="Название"
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    paymentProviders: {
                      ...current.paymentProviders,
                      [key]: { ...provider, title: event.currentTarget.value }
                    }
                  }))
                }
              />
              <textarea
                value={JSON.stringify(provider.settings ?? {}, null, 2)}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    paymentProviders: {
                      ...current.paymentProviders,
                      [key]: { ...provider, settings: parseSettings(event.currentTarget.value) }
                    }
                  }))
                }
              />
            </div>
          </div>
        ))}
      </section>

      <button
        className="editor-button editor-button-primary"
        type="button"
        onClick={async () => {
          setStatus("Сохранение...");
          const response = await fetch("/api/editor/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(settings)
          });
          const payload = (await response.json()) as { error?: string };
          setStatus(response.ok ? "Сохранено" : payload.error ?? "Ошибка");
        }}
      >
        Сохранить
      </button>
      <p>{status}</p>
    </main>
  );
}

function parseSettings(value: string) {
  try {
    const parsed = JSON.parse(value) as Record<string, string>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
