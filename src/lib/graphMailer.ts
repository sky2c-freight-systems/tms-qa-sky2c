import type { MailAttachment, SendMailInput } from "@/lib/mailer";

/**
 * Sends mail via the Microsoft Graph API using client-credentials (app-only) auth,
 * instead of SMTP — this tenant has SMTP AUTH disabled, so the app registration's
 * Mail.Send Application permission is the only way to send as a mailbox.
 */

interface CachedToken {
  accessToken: string;
  expiresAt: number; // epoch ms
}

let cachedToken: CachedToken | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.accessToken;
  }

  const tenantId = process.env.GRAPH_TENANT_ID;
  const clientId = process.env.GRAPH_CLIENT_ID;
  const clientSecret = process.env.GRAPH_CLIENT_SECRET;
  if (!tenantId || !clientId || !clientSecret) {
    throw new Error("Graph mailer: GRAPH_TENANT_ID/GRAPH_CLIENT_ID/GRAPH_CLIENT_SECRET not configured");
  }

  const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) {
    throw new Error(`Graph mailer: token request failed (${res.status}): ${await res.text()}`);
  }

  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { accessToken: json.access_token, expiresAt: now + json.expires_in * 1000 };
  return cachedToken.accessToken;
}

function toGraphAttachment(a: MailAttachment) {
  return {
    "@odata.type": "#microsoft.graph.fileAttachment",
    name: a.filename,
    contentType: a.contentType ?? "application/pdf",
    contentBytes: a.content.toString("base64"),
  };
}

export function isGraphMailerConfigured(): boolean {
  return Boolean(process.env.GRAPH_TENANT_ID && process.env.GRAPH_CLIENT_ID && process.env.GRAPH_CLIENT_SECRET);
}

export async function sendMailViaGraph(input: SendMailInput): Promise<void> {
  const mailbox = input.from || process.env.GRAPH_SENDER_MAILBOX;
  if (!mailbox) {
    throw new Error("Graph mailer: no sender mailbox — set GRAPH_SENDER_MAILBOX or pass `from`");
  }

  const accessToken = await getAccessToken();

  const res = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(mailbox)}/sendMail`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        subject: input.subject,
        body: { contentType: "Text", content: input.text ?? "" },
        toRecipients: [{ emailAddress: { address: input.to } }],
        attachments: input.attachments?.map(toGraphAttachment),
      },
      saveToSentItems: "true",
    }),
  });

  if (!res.ok) {
    throw new Error(`Graph mailer: sendMail failed (${res.status}): ${await res.text()}`);
  }
}
