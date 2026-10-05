import nodemailer from "nodemailer";
import { isGraphMailerConfigured, sendMailViaGraph } from "@/lib/graphMailer";

/**
 * Mail-sending wrapper with three tiers, tried in order: Microsoft Graph API (preferred —
 * this tenant has SMTP AUTH disabled, so app-only Graph auth is the only way to send as a
 * real mailbox), then SMTP (nodemailer), then — if neither is configured (local dev) — log
 * the would-be email to the console instead of sending.
 */
export interface MailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface SendMailInput {
  to: string;
  subject: string;
  text?: string;
  attachments?: MailAttachment[];
  from?: string;
}

export async function sendMail(input: SendMailInput): Promise<void> {
  if (isGraphMailerConfigured()) {
    await sendMailViaGraph(input);
    return;
  }

  const host = process.env.SMTP_HOST;

  if (!host) {
    console.log("[mailer] SMTP_HOST not configured — logging email instead of sending.");
    console.log(`[mailer] From: ${input.from || process.env.SMTP_FROM || process.env.SMTP_USER}`);
    console.log(`[mailer] To: ${input.to}`);
    console.log(`[mailer] Subject: ${input.subject}`);
    if (input.text) console.log(`[mailer] Text: ${input.text}`);
    for (const attachment of input.attachments ?? []) {
      console.log(`[mailer] Attachment: ${attachment.filename} (${attachment.content.length} bytes)`);
    }
    return;
  }

  const port = Number(process.env.SMTP_PORT ?? 587);
  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });

  await transport.sendMail({
    from: input.from || process.env.SMTP_FROM || process.env.SMTP_USER,
    to: input.to,
    subject: input.subject,
    text: input.text,
    attachments: input.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType ?? "application/pdf",
    })),
  });
}
