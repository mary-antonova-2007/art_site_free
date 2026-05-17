import "server-only";

import nodemailer from "nodemailer";

import type { SiteCommerceSettings } from "./content";
import type { StoredOrder } from "./content-service";

type EmailSettings = SiteCommerceSettings["emailNotifications"];

export async function sendTestOrderEmail(settings: SiteCommerceSettings, recipient: string) {
  const target = recipient.trim();
  if (!target) {
    throw new Error("Recipient email is required.");
  }

  await sendMail({
    settings: settings.emailNotifications,
    to: target,
    subject: "Olga Schmid shop email test",
    text: [
      "This is a test email from Olga Schmid shop settings.",
      "",
      "If you received this message, SMTP notifications are configured correctly."
    ].join("\n"),
    html: [
      "<p>This is a test email from Olga Schmid shop settings.</p>",
      "<p>If you received this message, SMTP notifications are configured correctly.</p>"
    ].join("")
  });
}

export async function sendOrderPaidEmails(settings: SiteCommerceSettings, order: StoredOrder) {
  if (!settings.emailNotifications.enabled) {
    return;
  }

  const customerEmail = getString(order.customer.email);
  const adminEmail = settings.emailNotifications.adminEmail?.trim();
  const recipients = Array.from(new Set([customerEmail, adminEmail].filter((item): item is string => Boolean(item))));

  if (!recipients.length) {
    return;
  }

  const subject = `Order ${order.orderNumber} has been paid`;
  const text = buildOrderText(order);
  const html = buildOrderHtml(order);

  await sendMail({
    settings: settings.emailNotifications,
    to: recipients,
    subject,
    text,
    html
  });
}

async function sendMail(input: {
  settings: EmailSettings;
  to: string | string[];
  subject: string;
  text: string;
  html: string;
}) {
  const smtpHost = input.settings.smtpHost?.trim();
  const smtpPort = Number(input.settings.smtpPort);
  const smtpUser = input.settings.smtpUser?.trim();
  const smtpPassword = input.settings.smtpPassword?.trim();
  const fromEmail = input.settings.fromEmail?.trim() || smtpUser;

  if (!smtpHost || !Number.isFinite(smtpPort) || smtpPort <= 0 || !smtpUser || !smtpPassword || !fromEmail) {
    throw new Error("SMTP host, port, user, password, and sender email are required.");
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: input.settings.smtpSecure !== false,
    auth: {
      user: smtpUser,
      pass: smtpPassword
    }
  });

  const fromName = input.settings.fromName?.trim();
  await transporter.sendMail({
    from: fromName ? `"${escapeHeaderName(fromName)}" <${fromEmail}>` : fromEmail,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html
  });
}

function buildOrderText(order: StoredOrder) {
  const lines = [
    `Order ${order.orderNumber} has been paid.`,
    "",
    `Total: ${formatMoney(order.amount, order.currency)}`,
    "",
    "Customer:",
    `Name: ${getString(order.customer.name) || "-"}`,
    `Email: ${getString(order.customer.email) || "-"}`,
    `Phone: ${getString(order.customer.phone) || "-"}`,
    `City: ${getString(order.customer.city) || "-"}`,
    `Address: ${getString(order.customer.address) || "-"}`,
    "",
    "Items:"
  ];

  order.items.forEach((item, index) => {
    lines.push(`${index + 1}. ${formatOrderItem(item)}`);
  });

  return lines.join("\n");
}

function buildOrderHtml(order: StoredOrder) {
  const itemRows = order.items
    .map((item, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(formatOrderItem(item))}</td></tr>`)
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#161616">
      <h2>Order ${escapeHtml(order.orderNumber)} has been paid</h2>
      <p><strong>Total:</strong> ${escapeHtml(formatMoney(order.amount, order.currency))}</p>
      <h3>Customer</h3>
      <p>
        Name: ${escapeHtml(getString(order.customer.name) || "-")}<br>
        Email: ${escapeHtml(getString(order.customer.email) || "-")}<br>
        Phone: ${escapeHtml(getString(order.customer.phone) || "-")}<br>
        City: ${escapeHtml(getString(order.customer.city) || "-")}<br>
        Address: ${escapeHtml(getString(order.customer.address) || "-")}
      </p>
      <h3>Items</h3>
      <table cellpadding="6" cellspacing="0" border="1" style="border-collapse:collapse;border-color:#ddd">
        <tbody>${itemRows}</tbody>
      </table>
    </div>
  `;
}

function formatOrderItem(item: Record<string, unknown>) {
  const format = item.format && typeof item.format === "object" ? (item.format as Record<string, unknown>) : {};
  const quantity = Math.max(1, Number(item.quantity) || 1);
  const price = Number(format.priceOverride ?? format.price);
  const width = Number(format.widthCm);
  const height = Number(format.heightCm);
  const size = Number.isFinite(width) && Number.isFinite(height) ? `${width} x ${height} cm` : "format not set";
  const total = Number.isFinite(price) ? `, ${formatMoney(Math.round(price * quantity * 100), "RUB")}` : "";

  return `${getString(item.title) || "Artwork"} - ${size}, qty ${quantity}${total}`;
}

function formatMoney(amountInMinorUnits: number, currency: string) {
  return `${(amountInMinorUnits / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeHeaderName(value: string) {
  return value.replace(/"/g, "'");
}
