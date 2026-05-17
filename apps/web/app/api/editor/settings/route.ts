import { NextResponse } from "next/server";

import { getEditorIdentity } from "@/lib/auth";
import { getCommerceSettings, saveCommerceSettings } from "@/lib/content-service";
import type { SiteCommerceSettings } from "@/lib/content";

export async function GET() {
  try {
    const editor = await getEditorIdentity();
    if (!editor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await getCommerceSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const editor = await getEditorIdentity();
    if (!editor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as Partial<SiteCommerceSettings>;
    const settings = await saveCommerceSettings({
      cartEnabled: body.cartEnabled ?? true,
      printFormats: Array.isArray(body.printFormats) ? body.printFormats : [],
      paymentProviders: body.paymentProviders ?? {},
      emailNotifications: {
        enabled: body.emailNotifications?.enabled,
        provider: body.emailNotifications?.provider,
        adminEmail: body.emailNotifications?.adminEmail,
        fromEmail: body.emailNotifications?.fromEmail,
        fromName: body.emailNotifications?.fromName,
        replyToEmail: body.emailNotifications?.replyToEmail,
        resendApiKey: body.emailNotifications?.resendApiKey,
        smtpHost: body.emailNotifications?.smtpHost,
        smtpPort: body.emailNotifications?.smtpPort,
        smtpSecure: body.emailNotifications?.smtpSecure,
        smtpUser: body.emailNotifications?.smtpUser,
        smtpPassword: body.emailNotifications?.smtpPassword
      }
    });

    return NextResponse.json({ settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
