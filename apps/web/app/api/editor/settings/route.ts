import { NextResponse } from "next/server";

import { apiErrorResponse, requireEditorApi } from "@/lib/api-auth";
import { toEditorCommerceSettings } from "@/lib/content";
import { getCommerceSettings, getSeoSettings, saveCommerceSettings, saveSeoSettings } from "@/lib/content-service";
import type { SiteCommerceSettings, SiteSeoSettings } from "@/lib/content";

export async function GET() {
  try {
    const auth = await requireEditorApi();
    if (auth.response) return auth.response;

    const [settings, seoSettings] = await Promise.all([getCommerceSettings(), getSeoSettings()]);
    return NextResponse.json({ settings: toEditorCommerceSettings(settings), seoSettings });
  } catch (error) {
    return apiErrorResponse(error, "Failed to load settings");
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireEditorApi();
    if (auth.response) return auth.response;

    const body = (await request.json()) as Partial<SiteCommerceSettings> & { seoSettings?: SiteSeoSettings };
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

    const seoSettings = body.seoSettings ? await saveSeoSettings(body.seoSettings) : await getSeoSettings();

    return NextResponse.json({ settings: toEditorCommerceSettings(settings), seoSettings });
  } catch (error) {
    return apiErrorResponse(error, "Failed to save settings");
  }
}
