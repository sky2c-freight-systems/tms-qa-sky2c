import { prisma } from "@/lib/prisma";
import { replyAllFileGeneratedNotice } from "@/lib/zohoDeskApi";

/**
 * Only orders on these accounts get a reply-all notification. "SKY2C"/"SKY2C ECOM" are
 * real Client.name values (visible as the "Account" column on the shipments list) —
 * there is no dedicated account-type/category field for them, so matching is done by
 * name. Same restriction as the (currently disabled) SMTP/Graph confirmation email —
 * see src/lib/orderConfirmationEmail.ts.
 */
const NOTIFIED_ACCOUNT_NAMES = new Set(["SKY2C", "SKY2C ECOM"]);

/**
 * Replies-all into the originating Zoho Desk ticket to let everyone on the conversation
 * know a file/order number has been generated, with a tracking link. Never throws: a
 * failure here must not block shipment creation, so all errors are logged and swallowed —
 * same philosophy as the rest of the Zoho integration (the shipment/ZohoSync record is
 * the source of truth, this is a courtesy notification).
 */
export async function notifyZohoTicketOfFileGenerated(
  ticketId: string,
  accountId: string | null,
  fileNumber: string
): Promise<void> {
  try {
    if (!accountId) return;

    const account = await prisma.client.findUnique({ where: { id: accountId }, select: { name: true } });
    if (!account || !NOTIFIED_ACCOUNT_NAMES.has(account.name.trim().toUpperCase())) return;

    const trackingUrl = `${process.env.APP_BASE_URL ?? ""}/tracking/${fileNumber}`;
    const content = `Your order has been created and order-id is ${fileNumber}. You can track your order here: ${trackingUrl}`;

    await replyAllFileGeneratedNotice(ticketId, content);
  } catch (err) {
    console.error(`[zohoOrderNotification] failed to notify ticket ${ticketId} for ${fileNumber}:`, err);
  }
}
