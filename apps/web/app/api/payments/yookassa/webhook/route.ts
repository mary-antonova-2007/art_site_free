import { NextResponse } from "next/server";

import { findOrderByPaymentId, getCommerceSettings, markOrderNotified, markOrderPaid } from "@/lib/content-service";
import { sendOrderPaidEmails } from "@/lib/order-email";

type YooKassaWebhookPayload = {
  event?: string;
  object?: {
    id?: string;
    status?: string;
  };
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as YooKassaWebhookPayload;
    const paymentId = payload.object?.id;
    const status = payload.object?.status;

    if (!paymentId) {
      return NextResponse.json({ error: "Payment id is required." }, { status: 400 });
    }

    if (payload.event !== "payment.succeeded" && status !== "succeeded") {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const commerceSettings = await getCommerceSettings();
    const verified = await verifyYooKassaPaymentSucceeded(paymentId, commerceSettings);
    if (!verified) {
      return NextResponse.json({ error: "Payment is not verified as succeeded." }, { status: 400 });
    }

    const existingOrder = await findOrderByPaymentId(paymentId);
    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const order = existingOrder.status === "paid" ? existingOrder : await markOrderPaid(paymentId);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (!order.notifiedAt) {
      await sendOrderPaidEmails(commerceSettings, order);
      await markOrderNotified(order.id);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process YooKassa webhook.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function verifyYooKassaPaymentSucceeded(paymentId: string, commerceSettings: Awaited<ReturnType<typeof getCommerceSettings>>) {
  const settings = commerceSettings.paymentProviders.yoomoney?.settings ?? {};
  const shopId = settings.shopId?.trim();
  const secretKey = settings.secretKey?.trim();

  if (!shopId || !secretKey) {
    throw new Error("YooKassa Shop ID and secret key are required.");
  }

  const response = await fetch(`https://api.yookassa.ru/v3/payments/${encodeURIComponent(paymentId)}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString("base64")}`
    }
  });

  if (!response.ok) {
    return false;
  }

  const payment = (await response.json()) as { status?: string; paid?: boolean };
  return payment.status === "succeeded" || payment.paid === true;
}
