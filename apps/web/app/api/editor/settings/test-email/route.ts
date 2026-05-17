import { NextResponse } from "next/server";

import { getEditorIdentity } from "@/lib/auth";
import { getCommerceSettings } from "@/lib/content-service";
import { sendTestOrderEmail } from "@/lib/order-email";
import type { SiteCommerceSettings } from "@/lib/content";

export async function POST(request: Request) {
  try {
    const editor = await getEditorIdentity();
    if (!editor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      recipient?: unknown;
      emailNotifications?: Partial<SiteCommerceSettings["emailNotifications"]>;
    };
    const settings = await getCommerceSettings();
    const emailNotifications = body.emailNotifications && typeof body.emailNotifications === "object"
      ? { ...settings.emailNotifications, ...body.emailNotifications }
      : settings.emailNotifications;
    const testSettings = { ...settings, emailNotifications };
    const recipient =
      typeof body.recipient === "string" && body.recipient.trim()
        ? body.recipient.trim()
        : testSettings.emailNotifications.adminEmail ?? "";

    await sendTestOrderEmail(testSettings, recipient);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send test email.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
