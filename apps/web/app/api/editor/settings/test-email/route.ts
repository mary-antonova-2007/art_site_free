import { NextResponse } from "next/server";

import { apiErrorResponse, requireEditorApi } from "@/lib/api-auth";
import { getCommerceSettings } from "@/lib/content-service";
import { sendTestOrderEmail } from "@/lib/order-email";
import type { SiteCommerceSettings } from "@/lib/content";

export async function POST(request: Request) {
  try {
    const auth = await requireEditorApi();
    if (auth.response) return auth.response;

    const body = (await request.json().catch(() => ({}))) as {
      recipient?: unknown;
      emailNotifications?: Partial<SiteCommerceSettings["emailNotifications"]>;
    };
    const settings = await getCommerceSettings();
    const emailNotifications = body.emailNotifications && typeof body.emailNotifications === "object"
      ? {
          ...settings.emailNotifications,
          ...body.emailNotifications,
          resendApiKey: body.emailNotifications.resendApiKey || settings.emailNotifications.resendApiKey,
          smtpPassword: body.emailNotifications.smtpPassword || settings.emailNotifications.smtpPassword
        }
      : settings.emailNotifications;
    const testSettings = { ...settings, emailNotifications };
    const recipient =
      typeof body.recipient === "string" && body.recipient.trim()
        ? body.recipient.trim()
        : testSettings.emailNotifications.adminEmail ?? "";

    await sendTestOrderEmail(testSettings, recipient);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error, "Failed to send test email.");
  }
}
