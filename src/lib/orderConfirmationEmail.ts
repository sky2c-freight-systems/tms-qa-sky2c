import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";

/**
 * Only orders on these accounts get a confirmation email. "SKY2C"/"SKY2C ECOM" are real
 * Client.name values (visible as the "Account" column on the shipments list) — there is
 * no dedicated account-type/category field for them, so matching is done by name.
 */
const NOTIFIED_ACCOUNT_NAMES = new Set(["SKY2C", "SKY2C ECOM"]);
const CONFIRMATION_FROM_EMAIL = "tmssvc@vhaul4u.us";

export interface OrderConfirmationShipment {
  fileNumber: string;
  bolNumber: string | null;
  origin: string | null;
  destination: string | null;
  etaAt: Date | null;
  accountId: string | null;
}

function formatDeliveryDate(date: Date): string {
  return `${date.getUTCDate()}/${date.getUTCMonth() + 1}/${date.getUTCFullYear()}`;
}

/**
 * Sends the customer-facing order-generated confirmation email, but only when the
 * shipment's linked account is SKY2C or SKY2C ECOM — for every other account this is a no-op.
 * Never throws: a failure here must not block shipment/order creation, so all errors
 * (missing recipient, SMTP failure, etc.) are logged and swallowed.
 */
export async function sendOrderConfirmationEmail(
  shipment: OrderConfirmationShipment,
  opts: { contactEmail?: string | null }
): Promise<void> {
  try {
    // Temporarily disabled per instruction (2026-08-20) — being replaced with a Zoho Desk
    // reply-all notification instead. Flip ORDER_CONFIRMATION_EMAIL_ENABLED="true" in env
    // to re-enable this SMTP/Graph-based path if needed again.
    if (process.env.ORDER_CONFIRMATION_EMAIL_ENABLED !== "true") return;

    if (!shipment.accountId) return;

    const account = await prisma.client.findUnique({
      where: { id: shipment.accountId },
      select: { name: true, emailAddress: true },
    });
    if (!account || !NOTIFIED_ACCOUNT_NAMES.has(account.name.trim().toUpperCase())) return;

    const recipient = opts.contactEmail || account.emailAddress;
    if (!recipient) {
      console.warn(`[orderConfirmationEmail] no recipient email for ${shipment.fileNumber} (${account.name})`);
      return;
    }

    const trackingUrl = `${process.env.APP_BASE_URL ?? ""}/tracking/${shipment.fileNumber}`;
    const deliveryDate = shipment.etaAt ? formatDeliveryDate(shipment.etaAt) : "TBD";

    const text = [
      `Order number ${shipment.fileNumber} has been generated for your BOL ${shipment.bolNumber ?? "N/A"},`,
      `Origin - ${shipment.origin ?? "N/A"},`,
      `Destination- ${shipment.destination ?? "N/A"},`,
      `delivery date- ${deliveryDate}`,
      `Tracking Url - ${trackingUrl}`,
    ].join("\n");

    await sendMail({
      to: recipient,
      from: CONFIRMATION_FROM_EMAIL,
      subject: `Order Confirmation - ${shipment.fileNumber}`,
      text,
    });
  } catch (err) {
    console.error(`[orderConfirmationEmail] failed to send for ${shipment.fileNumber}:`, err);
  }
}
