import "server-only";
import { prisma } from "./prisma";
import type { NotificationType } from "@/generated/prisma/enums";

/**
 * Notification architecture (spec §17): email is the only channel actually
 * wired to send today. Every send attempt — successful, failed, or just
 * logged because no SMTP is configured — is recorded in the Notification
 * table so admins can audit what was (or would have been) sent.
 *
 * Adding WhatsApp/SMS later means adding a case to `deliver()` below; the
 * call sites (`notify(...)`) and the DB log don't change.
 */

interface NotifyParams {
  type: NotificationType;
  applicationId?: string;
  recipientEmail: string;
  recipientName: string;
  applicationNumber: string;
  shopNumber?: string;
}

const TEMPLATES: Record<NotificationType, (p: NotifyParams) => { subject: string; body: string }> = {
  application_submitted: (p) => ({
    subject: `Application ${p.applicationNumber} submitted`,
    body: `Hi ${p.recipientName},\n\nYour application ${p.applicationNumber} for shop ${p.shopNumber ?? ""} at Asia Road, Global Village Dammam has been submitted and is now under review.\n\nWe'll be in touch with any updates.`,
  }),
  application_received: (p) => ({
    subject: `Application ${p.applicationNumber} received`,
    body: `A new application ${p.applicationNumber} was received for shop ${p.shopNumber ?? ""}.`,
  }),
  documents_required: (p) => ({
    subject: `Additional documents needed — ${p.applicationNumber}`,
    body: `Hi ${p.recipientName},\n\nWe need a few additional documents to continue reviewing your application ${p.applicationNumber}. Please reply with the requested files.`,
  }),
  application_approved: (p) => ({
    subject: `Application ${p.applicationNumber} approved`,
    body: `Hi ${p.recipientName},\n\nGood news — your application ${p.applicationNumber} for shop ${p.shopNumber ?? ""} has been approved and the shop is now reserved for you. Our leasing team will contact you to complete the rental.`,
  }),
  application_rejected: (p) => ({
    subject: `Update on application ${p.applicationNumber}`,
    body: `Hi ${p.recipientName},\n\nThank you for your interest in Asia Road, Global Village Dammam. After review, we are unable to proceed with application ${p.applicationNumber} at this time.`,
  }),
  shop_reserved: (p) => ({
    subject: `Shop ${p.shopNumber} reserved`,
    body: `Shop ${p.shopNumber ?? ""} has been reserved under application ${p.applicationNumber}.`,
  }),
  rental_completed: (p) => ({
    subject: `Welcome to Asia Road — Shop ${p.shopNumber}`,
    body: `Hi ${p.recipientName},\n\nCongratulations — your rental for shop ${p.shopNumber ?? ""} is now complete. Welcome aboard!`,
  }),
};

async function deliverEmail(to: string, subject: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const host = process.env.SMTP_HOST;
  if (!host) {
    // No SMTP configured — this is the expected default until the user
    // supplies real credentials. Not an error, just "not sent for real".
    return { ok: false, error: "SMTP not configured" };
  }

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? "no-reply@asiaroad-gvd.local",
      to,
      subject,
      text: body,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown send error" };
  }
}

export async function notify(params: NotifyParams): Promise<void> {
  const { subject, body } = TEMPLATES[params.type](params);
  const result = await deliverEmail(params.recipientEmail, subject, body);

  await prisma.notification.create({
    data: {
      type: params.type,
      channel: "email",
      recipient: params.recipientEmail,
      subject,
      body,
      status: result.ok ? "sent" : result.error === "SMTP not configured" ? "logged_only" : "failed",
      errorMessage: result.ok ? null : result.error,
      applicationId: params.applicationId,
    },
  });
}
