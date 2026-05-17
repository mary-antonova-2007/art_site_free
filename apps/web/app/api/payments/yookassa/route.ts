import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { attachOrderPaymentId, createPendingOrder, getCommerceSettings } from "@/lib/content-service";
import { getRequestOrigin } from "@/lib/request-origin";

type CheckoutPayload = {
  items?: Array<{
    title?: unknown;
    quantity?: unknown;
    format?: {
      widthCm?: unknown;
      heightCm?: unknown;
      price?: unknown;
      priceOverride?: unknown;
    };
  }>;
  customer?: {
    name?: unknown;
    email?: unknown;
    phone?: unknown;
    city?: unknown;
    address?: unknown;
  };
};

type YooKassaPaymentResponse = {
  id?: string;
  status?: string;
  confirmation?: {
    type?: string;
    confirmation_url?: string;
  };
};


export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CheckoutPayload;
    const commerceSettings = await getCommerceSettings();
    const provider = commerceSettings.paymentProviders.yoomoney;

    if (!provider?.enabled) {
      return NextResponse.json({ error: "YooKassa is not enabled." }, { status: 400 });
    }

    const settings = provider.settings ?? {};
    const shopId = settings.shopId?.trim();
    const secretKey = settings.secretKey?.trim();

    if (!shopId || !secretKey) {
      return NextResponse.json({ error: "YooKassa Shop ID and secret key are required." }, { status: 400 });
    }

    const amount = calculateCartAmount(payload.items);
    if (amount <= 0) {
      return NextResponse.json({ error: "Cart amount must be greater than zero." }, { status: 400 });
    }

    const origin = getRequestOrigin(request);
    const returnUrl = normalizeReturnUrl(settings.returnUrl, origin);
    const currency = normalizeCurrency(settings.currency);
    const orderId = randomUUID();
    const orderNumber = `OS-${orderId.slice(0, 8).toUpperCase()}`;
    const description = buildDescription(settings.descriptionTemplate, orderId);
    const sanitizedCustomer = sanitizeCustomerMetadata(payload.customer);
    const normalizedItems = normalizeOrderItems(payload.items);

    await createPendingOrder({
      orderNumber,
      paymentProvider: "yoomoney",
      currency,
      amount: Math.round(amount * 100),
      customer: sanitizedCustomer,
      items: normalizedItems,
      metadata: { orderId }
    });

    const response = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString("base64")}`,
        "Content-Type": "application/json",
        "Idempotence-Key": orderId
      },
      body: JSON.stringify({
        amount: {
          value: amount.toFixed(2),
          currency
        },
        capture: true,
        confirmation: {
          type: "redirect",
          return_url: returnUrl
        },
        description,
        metadata: {
          orderId,
          orderNumber,
          ...sanitizedCustomer
        }
      })
    });

    const payment = (await response.json()) as YooKassaPaymentResponse & { description?: string };
    const confirmationUrl = payment.confirmation?.confirmation_url;

    if (!response.ok || !confirmationUrl) {
      return NextResponse.json(
        { error: "Could not create the YooKassa payment.", details: payment },
        { status: response.ok ? 502 : response.status }
      );
    }

    if (payment.id) {
      await attachOrderPaymentId(orderNumber, payment.id);
    }

    return NextResponse.json({
      paymentId: payment.id,
      status: payment.status,
      confirmationUrl
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create YooKassa payment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function calculateCartAmount(items: CheckoutPayload["items"]) {
  if (!Array.isArray(items)) {
    return 0;
  }

  return items.reduce((sum, item) => {
    const quantity = Math.max(1, Number(item.quantity) || 1);
    const format = item.format;
    const price = Number(format?.priceOverride ?? format?.price);

    return Number.isFinite(price) && price > 0 ? sum + price * quantity : sum;
  }, 0);
}

function normalizeCurrency(value: string | undefined) {
  const currency = value?.trim().toUpperCase();
  return currency && /^[A-Z]{3}$/.test(currency) ? currency : "RUB";
}

function normalizeReturnUrl(value: string | undefined, origin: string) {
  const fallback = `${origin}/cart?payment=return`;
  const candidate = value?.trim();

  if (!candidate) {
    return fallback;
  }

  try {
    return new URL(candidate, origin).toString();
  } catch {
    return fallback;
  }
}

function buildDescription(template: string | undefined, orderId: string) {
  const base = template?.trim() || "Print order";
  return `${base} ${orderId.slice(0, 8)}`.slice(0, 128);
}

function sanitizeCustomerMetadata(customer: CheckoutPayload["customer"]) {
  if (!customer || typeof customer !== "object") {
    return {};
  }

  return {
    customerName: stringifyMetadataValue(customer.name),
    customerEmail: stringifyMetadataValue(customer.email),
    customerPhone: stringifyMetadataValue(customer.phone),
    customerCity: stringifyMetadataValue(customer.city),
    customerAddress: stringifyMetadataValue(customer.address)
  };
}

function normalizeOrderItems(items: CheckoutPayload["items"]) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item) => ({
    title: stringifyMetadataValue(item.title),
    quantity: Math.max(1, Number(item.quantity) || 1),
    format: {
      widthCm: Number(item.format?.widthCm) || undefined,
      heightCm: Number(item.format?.heightCm) || undefined,
      price: Number(item.format?.price) || undefined,
      priceOverride: Number(item.format?.priceOverride) || undefined
    }
  }));
}

function stringifyMetadataValue(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 256) : "";
}
