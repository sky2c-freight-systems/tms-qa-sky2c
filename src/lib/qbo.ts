/**
 * QuickBooks Online integration service.
 *
 * Legacy context: the old ASP.NET app kept the QBO OAuth access token in
 * `Application` state — a single global slot shared by every user hitting the
 * server process. That's both a correctness bug (whoever connected last wins,
 * for everyone) and a security bug (tokens leak across sessions). This module
 * persists tokens per-connection in the `QboConnection` Mongo collection with
 * real expiry tracking, and refreshes them on demand — no in-memory/global
 * token state anywhere here.
 *
 * This is a single-tenant internal tool: exactly one QBO company ("realm") is
 * expected to be connected at a time. `getValidAccessToken` accepts an
 * optional realmId for forward-compatibility, but defaults to "the most
 * recently updated QboConnection row" when omitted.
 */

import OAuthClient from "intuit-oauth";
import QuickBooks from "node-quickbooks";
import type {
  Customer,
  Invoice,
  Item,
  QueryResponse,
  EntityResponse,
  QuickBooksCallback,
} from "node-quickbooks";
import { prisma } from "@/lib/prisma";
import type { QboConnection, Client as ClientRecord, ArInvoiceLineItem } from "@prisma/client";

type InvoiceLine = NonNullable<Invoice["Line"]>[number];
import { getTicketAttachments, downloadTicketAttachment, isCustomerVisibleAttachment } from "@/lib/zohoDeskApi";

const QBO_CLIENT_ID = process.env.QBO_CLIENT_ID ?? "";
const QBO_CLIENT_SECRET = process.env.QBO_CLIENT_SECRET ?? "";
const QBO_REDIRECT_URI = process.env.QBO_REDIRECT_URI ?? "";
const QBO_ENVIRONMENT: "sandbox" | "production" =
  process.env.QBO_ENVIRONMENT === "production" ? "production" : "sandbox";

// Refresh proactively if the access token is within this many ms of expiring
// (or already expired) rather than waiting for a 401 from QBO.
const TOKEN_REFRESH_BUFFER_MS = 2 * 60 * 1000;

// Refresh tokens are valid ~100 days; access tokens ~1 hour. These are only
// used as a fallback if QBO's token response omits the *_expires_in fields.
const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 3600;
const DEFAULT_REFRESH_TOKEN_TTL_SECONDS = 100 * 24 * 60 * 60;

// ---------------------------------------------------------------------------
// OAuth
// ---------------------------------------------------------------------------

function buildOAuthClient(connection?: QboConnection): OAuthClient {
  return new OAuthClient({
    clientId: QBO_CLIENT_ID,
    clientSecret: QBO_CLIENT_SECRET,
    environment: (connection?.environment as "sandbox" | "production") ?? QBO_ENVIRONMENT,
    redirectUri: QBO_REDIRECT_URI,
    token: connection
      ? {
          access_token: connection.accessToken,
          refresh_token: connection.refreshToken,
          realmId: connection.realmId,
        }
      : undefined,
  });
}

/** Builds the Intuit OAuth2 authorization-code-flow URL (scope: Accounting). */
export function getAuthorizationUri(): string {
  const oauthClient = buildOAuthClient();
  return oauthClient.authorizeUri({
    scope: [OAuthClient.scopes.Accounting],
  });
}

/**
 * Exchanges the OAuth callback URL for tokens and upserts the QboConnection
 * row for the realm that authorized us.
 */
export async function handleOAuthCallback(url: string): Promise<QboConnection> {
  const oauthClient = buildOAuthClient();
  const authResponse = await oauthClient.createToken(url);
  const token = authResponse.getToken();

  const realmId = token.realmId;
  if (!realmId) {
    throw new Error("QuickBooks OAuth callback did not include a realmId");
  }
  if (!token.access_token || !token.refresh_token) {
    throw new Error("QuickBooks OAuth callback did not include usable tokens");
  }

  const now = Date.now();
  const accessTokenExpiresAt = new Date(
    now + (token.expires_in ?? DEFAULT_ACCESS_TOKEN_TTL_SECONDS) * 1000
  );
  const refreshTokenExpiresAt = new Date(
    now + (token.x_refresh_token_expires_in ?? DEFAULT_REFRESH_TOKEN_TTL_SECONDS) * 1000
  );

  return prisma.qboConnection.upsert({
    where: { realmId },
    create: {
      realmId,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      environment: QBO_ENVIRONMENT,
    },
    update: {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      environment: QBO_ENVIRONMENT,
    },
  });
}

/**
 * Returns a QboConnection guaranteed to have a non-expired access token,
 * refreshing it first if it's expired or about to be. Persists the refreshed
 * tokens back to the same row.
 */
export async function getValidAccessToken(realmId?: string): Promise<QboConnection> {
  const connection = realmId
    ? await prisma.qboConnection.findUnique({ where: { realmId } })
    : await prisma.qboConnection.findFirst({ orderBy: { updatedAt: "desc" } });

  if (!connection) {
    throw new Error(
      "Not connected to QuickBooks yet — visit /api/quickbooks/connect to authorize a connection."
    );
  }

  const msUntilExpiry = connection.accessTokenExpiresAt.getTime() - Date.now();
  if (msUntilExpiry > TOKEN_REFRESH_BUFFER_MS) {
    return connection;
  }

  if (connection.refreshTokenExpiresAt.getTime() <= Date.now()) {
    throw new Error(
      `QuickBooks refresh token for realm ${connection.realmId} has expired — reconnect via /api/quickbooks/connect.`
    );
  }

  const oauthClient = buildOAuthClient(connection);
  const authResponse = await oauthClient.refresh();
  const token = authResponse.getToken();

  const now = Date.now();
  return prisma.qboConnection.update({
    where: { realmId: connection.realmId },
    data: {
      accessToken: token.access_token ?? connection.accessToken,
      refreshToken: token.refresh_token ?? connection.refreshToken,
      accessTokenExpiresAt: new Date(
        now + (token.expires_in ?? DEFAULT_ACCESS_TOKEN_TTL_SECONDS) * 1000
      ),
      refreshTokenExpiresAt: new Date(
        now + (token.x_refresh_token_expires_in ?? DEFAULT_REFRESH_TOKEN_TTL_SECONDS) * 1000
      ),
    },
  });
}

/** Constructs a node-quickbooks client instance from a persisted connection. */
export function getQboClient(connection: QboConnection): QuickBooks {
  return new QuickBooks(
    QBO_CLIENT_ID,
    QBO_CLIENT_SECRET,
    connection.accessToken,
    false, // no OAuth1 token secret — we're on OAuth2
    connection.realmId,
    connection.environment !== "production", // useSandbox
    false, // debug
    null, // minorversion
    "2.0", // oauthversion
    connection.refreshToken
  );
}

// ---------------------------------------------------------------------------
// Callback -> Promise helper + error normalization
// ---------------------------------------------------------------------------

function toError(err: unknown): Error {
  if (err instanceof Error) return err;
  if (err && typeof err === "object") {
    const anyErr = err as {
      fault?: { error?: Array<{ Message?: string; Detail?: string }> };
      message?: string;
    };
    const faultMessage = anyErr.fault?.error?.[0]?.Message ?? anyErr.fault?.error?.[0]?.Detail;
    return new Error(faultMessage ?? anyErr.message ?? JSON.stringify(err));
  }
  return new Error(String(err));
}

function callQbo<T>(fn: (cb: QuickBooksCallback<T>) => void): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    fn((err, data) => {
      if (err) {
        reject(toError(err));
        return;
      }
      resolve(data as T);
    });
  });
}

// ---------------------------------------------------------------------------
// Customer sync
// ---------------------------------------------------------------------------

/**
 * Mirrors the legacy EnsureCustomerInQBO: look up a QBO Customer by
 * DisplayName; create it if missing. Persists the resulting Id/SyncToken
 * back onto the local Client row.
 */
export async function ensureCustomerInQBO(
  client: ClientRecord
): Promise<{ qboCustomerId: string; qboSyncToken: string; invoiceEmail: string | null }> {
  const connection = await getValidAccessToken();
  const qbo = getQboClient(connection);

  const displayName = client.qboDisplayName ?? client.name;
  // The email QBO puts on the invoice/sends it to. accountingEmailAddress is a
  // billing-specific override (e.g. an AP inbox distinct from the general contact
  // email) — falls back to emailAddress when not set.
  const invoiceEmail = client.accountingEmailAddress ?? client.emailAddress;

  const queryResult = await callQbo<QueryResponse<Customer>>((cb) =>
    qbo.findCustomers({ DisplayName: displayName }, cb)
  );
  const customers = queryResult?.QueryResponse?.Customer as Customer[] | undefined;
  const existing = customers?.[0];

  let qboCustomerId: string;
  let qboSyncToken: string;

  if (existing?.Id) {
    qboCustomerId = existing.Id;
    qboSyncToken = existing.SyncToken ?? "0";

    // Push invoiceEmail onto the QBO customer whenever it differs from what QBO
    // currently has — not just a once-only backfill, since accountingEmailAddress
    // is meant to be the authoritative billing email and should win if it's set or
    // changed after the QBO customer already exists (e.g. a customer first resolved
    // via a Zoho ticket with no contact email, then given an accounting email later).
    if (invoiceEmail && existing.PrimaryEmailAddr?.Address !== invoiceEmail) {
      const updated = await callQbo<Customer>((cb) =>
        qbo.updateCustomer(
          {
            Id: qboCustomerId,
            SyncToken: qboSyncToken,
            sparse: true,
            PrimaryEmailAddr: { Address: invoiceEmail },
          } as Customer,
          cb
        )
      );
      qboSyncToken = updated?.SyncToken ?? qboSyncToken;
    }
  } else {
    const payload: Customer = {
      DisplayName: displayName,
      CompanyName: client.name,
      PrimaryPhone: client.telephone ? { FreeFormNumber: client.telephone } : undefined,
      PrimaryEmailAddr: invoiceEmail ? { Address: invoiceEmail } : undefined,
      BillAddr: {
        Line1: client.addressLine1 ?? client.street ?? undefined,
        Line2: client.addressLine2 ?? undefined,
        City: client.city ?? undefined,
        CountrySubDivisionCode: client.state ?? undefined,
        PostalCode: client.zipCode ?? undefined,
        Country: client.country ?? undefined,
      },
    };

    // node-quickbooks' createX callbacks resolve with the entity itself, already
    // unwrapped from the raw QBO REST API's `{ Customer: {...} }` envelope —
    // NOT an EntityResponse<Customer>-shaped `{ Customer: {...} }` object.
    const createdCustomer = await callQbo<Customer>((cb) => qbo.createCustomer(payload, cb));
    if (!createdCustomer?.Id) {
      throw new Error("QuickBooks did not return a Customer Id after create");
    }
    qboCustomerId = createdCustomer.Id;
    qboSyncToken = createdCustomer.SyncToken ?? "0";
  }

  await prisma.client.update({
    where: { id: client.id },
    data: { qboCustomerId, qboSyncToken, qboDisplayName: displayName },
  });

  return { qboCustomerId, qboSyncToken, invoiceEmail };
}

// ---------------------------------------------------------------------------
// Default QBO Item resolution
// ---------------------------------------------------------------------------

/**
 * Reserved ChargeCodeQboItemMap key holding the single QBO Product/Service
 * ("Trucking") that every invoice line item now posts to, regardless of the
 * invoice's own chargeCode. Previously this table was keyed by the invoice's
 * actual chargeCode (FRT/FSC/ACC/...), but the seeded per-code mappings used
 * placeholder QBO Item ids ("1", "2", ...) that happened to collide with
 * unrelated real Items in the connected company — invoices synced "successfully"
 * but landed on the wrong Product/Service with no visible error. Collapsing to
 * one explicitly-configured item removes that whole class of bug; chargeCode is
 * still stored on the invoice for internal reporting, it just no longer drives
 * QBO Item selection.
 */
const DEFAULT_QBO_ITEM_KEY = "DEFAULT";

/**
 * Looks up the single QBO Item ("Trucking") every invoice line item posts to.
 * A missing/inactive mapping fails the sync loudly (visible as a failed row in
 * "Sync Now") rather than silently guessing "any active QBO Item" — configure
 * it at /quickbooks/charge-codes instead.
 */
export async function getDefaultQboItemId(): Promise<string> {
  const mapping = await prisma.chargeCodeQboItemMap.findUnique({
    where: { chargeCode: DEFAULT_QBO_ITEM_KEY },
  });
  if (mapping?.isActive && mapping.qboItemId) {
    return mapping.qboItemId;
  }

  throw new Error(
    `No active default QBO Product/Service configured — set the "Trucking" item at ` +
      `/quickbooks/charge-codes, then retry Sync Now.`
  );
}

/** Lists active QBO Items (Product/Service) for the admin UI's item picker. */
export async function listActiveQboItems(): Promise<Array<{ id: string; name: string }>> {
  const connection = await getValidAccessToken();
  const qbo = getQboClient(connection);

  const result = await callQbo<QueryResponse<Item>>((cb) =>
    qbo.findItems({ Active: true }, cb)
  );
  const items = (result?.QueryResponse?.Item as Item[] | undefined) ?? [];
  return items
    .filter((item): item is Item & { Id: string; Name: string } => Boolean(item.Id && item.Name))
    .map((item) => ({ id: item.Id, name: item.Name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// ---------------------------------------------------------------------------
// Invoice push / void
// ---------------------------------------------------------------------------

/**
 * Builds the QBO `Line` array for an invoice: one SalesItemLineDetail line per
 * ArInvoiceLineItem when the invoice has any (the Dry Run / cf_multiple_quotes flow —
 * see src/lib/billing.ts), every line posting to the same configured default Item since
 * there's only one; otherwise falls back to the legacy single line using the invoice's
 * own totalChargeCents/invoiceDescription (manually-created invoices have no line items).
 */
function buildInvoiceLines(
  invoice: { totalChargeCents: number; invoiceDescription: string | null; lineItems: ArInvoiceLineItem[] },
  itemId: string
): InvoiceLine[] {
  const source =
    invoice.lineItems.length > 0
      ? [...invoice.lineItems]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((li) => ({ amount: li.amountCents / 100, description: li.description ?? undefined }))
      : [{ amount: invoice.totalChargeCents / 100, description: invoice.invoiceDescription ?? undefined }];

  return source.map(({ amount, description }) => ({
    Amount: amount,
    DetailType: "SalesItemLineDetail",
    Description: description,
    SalesItemLineDetail: { ItemRef: { value: itemId }, Qty: 1, UnitPrice: amount },
  }));
}

/**
 * Pushes a POSTED, not-yet-synced ArInvoice to QuickBooks — one Line per
 * ArInvoiceLineItem if any, else the legacy single line — then records the
 * resulting qboInvoiceId/qboSyncToken.
 */
export async function pushInvoiceToQbo(invoiceId: string): Promise<void> {
  const invoice = await prisma.arInvoice.findUnique({
    where: { id: invoiceId },
    include: { lineItems: true },
  });
  if (!invoice) {
    throw new Error(`ArInvoice ${invoiceId} not found`);
  }
  if (invoice.status !== "POSTED") {
    throw new Error(
      `ArInvoice ${invoiceId} is not POSTED (status=${invoice.status}) — refusing to sync to QuickBooks`
    );
  }
  if (invoice.qboInvoiceId) {
    // Already synced — no-op rather than creating a duplicate in QBO.
    return;
  }

  const client = await prisma.client.findUnique({ where: { id: invoice.customerId } });
  if (!client) {
    throw new Error(`Client ${invoice.customerId} not found for ArInvoice ${invoiceId}`);
  }

  const { qboCustomerId, invoiceEmail } = await ensureCustomerInQBO(client);
  const itemId = await getDefaultQboItemId();

  const connection = await getValidAccessToken();
  const qbo = getQboClient(connection);

  const payload: Invoice = {
    CustomerRef: { value: qboCustomerId },
    DocNumber: invoice.invoiceNo ?? undefined,
    // Set explicitly on the invoice itself (not just the QBO Customer's PrimaryEmailAddr
    // via ensureCustomerInQBO above) — same accountingEmailAddress-first resolution, so
    // "Send Invoice"/the online-invoice link goes to the right inbox even if the
    // Customer's own stored email is ever out of sync for some reason.
    BillEmail: invoiceEmail ? { Address: invoiceEmail } : undefined,
    Line: buildInvoiceLines(invoice, itemId),
  };

  // Same node-quickbooks behavior as createCustomer above: the callback resolves
  // with the Invoice entity itself, not an EntityResponse<Invoice> envelope.
  const createdInvoice = await callQbo<Invoice>((cb) => qbo.createInvoice(payload, cb));
  if (!createdInvoice?.Id) {
    throw new Error("QuickBooks did not return an Invoice Id after create");
  }

  await prisma.arInvoice.update({
    where: { id: invoice.id },
    data: {
      qboInvoiceId: createdInvoice.Id,
      qboSyncToken: createdInvoice.SyncToken ?? "0",
      qboLastSyncedAt: new Date(),
    },
  });

  await attachSignedBolToQboInvoice(invoice.fileNumber, createdInvoice.Id);
}

/**
 * Uploads a file as a QBO Attachable linked to the given Invoice (node-quickbooks'
 * upload() does the multipart file upload, then links it via AttachableRef).
 *
 * Passes the raw Buffer directly (not wrapped in Readable.from()) — node-quickbooks
 * hands whatever value it's given straight to the `form-data` package, which can only
 * compute the Content-Length multipart requires when the value is a Buffer/string;
 * form-data has no reliable way to know a Readable stream's total length upfront (it
 * doesn't expose one), so QBO rejected the upload with "Content-Length is required".
 * Confirmed live: a small (~200 byte) test buffer happened to succeed as a stream, but
 * real ticket attachments (200KB-800KB) consistently failed this way until switched to
 * passing the Buffer as-is.
 */
async function attachFileToQboInvoice(
  qboInvoiceId: string,
  filename: string,
  contentType: string,
  content: Buffer
): Promise<void> {
  const connection = await getValidAccessToken();
  const qbo = getQboClient(connection);
  await callQbo<unknown>((cb) => qbo.upload(filename, contentType, content, "Invoice", qboInvoiceId, cb));
}

/**
 * Best-effort: pulls the customer-visible ticket attachments (PICKUP_ZOHO/BOL_SIGNED_*
 * naming convention — see isCustomerVisibleAttachment, the same filter used for the
 * tracking page and the internal invoice-view Documents panel) off the Zoho Desk ticket
 * that originated this shipment/invoice, and attaches each to the just-created QBO
 * invoice. Runs once, at the moment the invoice is first pushed to QBO — a document
 * added to the ticket after that point is not retroactively attached. Never throws: this
 * is a courtesy step inside pushInvoiceToQbo, which must succeed (the invoice IS synced)
 * even if this fails.
 */
async function attachSignedBolToQboInvoice(fileNumber: string, qboInvoiceId: string): Promise<void> {
  try {
    const sync = await prisma.zohoSync.findFirst({ where: { fileNumber } });
    if (!sync?.zohoTicketId) return; // not tied to a Zoho ticket — nothing to pull from

    const attachments = await getTicketAttachments(sync.zohoTicketId);
    const visibleAttachments = attachments.filter((a) => isCustomerVisibleAttachment(a.name));

    for (const attachment of visibleAttachments) {
      const file = await downloadTicketAttachment(sync.zohoTicketId, attachment.id);
      await attachFileToQboInvoice(qboInvoiceId, file.filename, file.contentType, file.buffer);
    }
  } catch (err) {
    console.error(
      `[qbo] failed to attach signed BOL to invoice ${qboInvoiceId} (file ${fileNumber}):`,
      err
    );
  }
}

/**
 * Voids the QBO-side invoice for a local ArInvoice, if one exists, and clears
 * the local qboInvoiceId/qboSyncToken fields. Intended to be called by the
 * billing module's DELETE /api/invoices/[id] handler when a local invoice
 * with a qboInvoiceId is deleted.
 */
export async function voidInvoiceInQbo(invoiceId: string): Promise<void> {
  const invoice = await prisma.arInvoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) {
    throw new Error(`ArInvoice ${invoiceId} not found`);
  }
  if (!invoice.qboInvoiceId) {
    return; // nothing synced to QBO — nothing to void
  }

  const connection = await getValidAccessToken();
  const qbo = getQboClient(connection);

  await callQbo<EntityResponse<Invoice>>((cb) =>
    qbo.voidInvoice(
      { Id: invoice.qboInvoiceId as string, SyncToken: invoice.qboSyncToken ?? "0" },
      cb
    )
  );

  await prisma.arInvoice.update({
    where: { id: invoice.id },
    data: { qboInvoiceId: null, qboSyncToken: null },
  });
}

export interface QboSyncResult {
  invoiceId: string;
  success: boolean;
  error?: string;
}

/**
 * Pushes every POSTED-but-not-yet-synced ArInvoice to QuickBooks. Shared by the
 * manual "Sync Now" button (POST /api/quickbooks/sync) and the periodic background
 * retry (see instrumentation.ts's registerQboBackgroundSync) — the latter exists so
 * a transient failure (QBO API hiccup, connection mid-refresh, brief outage) heals
 * itself within a few minutes instead of silently sitting until someone notices a
 * backlog and clicks Sync Now.
 */
export async function syncAllPendingInvoices(): Promise<QboSyncResult[]> {
  const pending = await prisma.arInvoice.findMany({
    // See the same isSet:false note elsewhere in this codebase — Mongo/Prisma's
    // `qboInvoiceId: null` only matches a field that's entirely absent, not one
    // that's present-but-null.
    where: { status: "POSTED", qboInvoiceId: { isSet: false } },
    select: { id: true },
  });

  const results: QboSyncResult[] = [];
  for (const invoice of pending) {
    try {
      await pushInvoiceToQbo(invoice.id);
      results.push({ invoiceId: invoice.id, success: true });
    } catch (err) {
      results.push({
        invoiceId: invoice.id,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return results;
}

/**
 * Best-effort auto-sync used by every invoice route that can result in a POSTED
 * invoice (create-as-posted, post, reverse, adjust-as-posted) — "Save & Post" should
 * push to QuickBooks automatically, without requiring a separate manual "Sync Now"
 * click. Never throws: a QBO failure (not connected, transient API error, etc.) must
 * not block the local post/reverse/adjust action from succeeding, since the invoice
 * is still correctly POSTED locally either way and can be retried later via "Sync Now".
 * Returns an error message string if the sync attempt failed, or undefined on success
 * (or when `status` isn't POSTED, since there's nothing to sync yet).
 */
export async function autoSyncInvoiceIfPosted(
  invoiceId: string,
  status: string
): Promise<string | undefined> {
  if (status !== "POSTED") return undefined;
  try {
    await pushInvoiceToQbo(invoiceId);
    return undefined;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[qbo] auto-sync failed for invoice ${invoiceId}:`, err);
    return message;
  }
}

/**
 * Pushes an already-synced ArInvoice's current line items (or totalChargeCents, if it has
 * none) to its QBO counterpart via a sparse update — used when the source shipment's
 * charge amount and/or Dry Run quote history changes after the invoice was already
 * created and synced (see billing.ts's syncInvoiceAmountToShipment). A sparse update's
 * `Line` array still fully replaces QBO's existing lines (QBO doesn't merge list-type
 * fields even in sparse mode), which is exactly what's wanted here — re-derived line
 * items entirely replace whatever was there before. Same never-throws/returns-error-
 * string contract as autoSyncInvoiceIfPosted.
 */
export async function updateSyncedInvoiceAmount(invoiceId: string): Promise<string | undefined> {
  try {
    const invoice = await prisma.arInvoice.findUnique({
      where: { id: invoiceId },
      include: { lineItems: true },
    });
    if (!invoice?.qboInvoiceId) return undefined; // nothing synced — nothing to update

    const connection = await getValidAccessToken();
    const qbo = getQboClient(connection);
    const itemId = await getDefaultQboItemId();

    const updated = await callQbo<Invoice>((cb) =>
      qbo.updateInvoice(
        {
          Id: invoice.qboInvoiceId,
          SyncToken: invoice.qboSyncToken ?? "0",
          sparse: true,
          Line: buildInvoiceLines(invoice, itemId),
        } as Invoice,
        cb
      )
    );

    await prisma.arInvoice.update({
      where: { id: invoice.id },
      data: { qboSyncToken: updated?.SyncToken ?? invoice.qboSyncToken, qboLastSyncedAt: new Date() },
    });
    return undefined;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[qbo] amount update failed for invoice ${invoiceId}:`, err);
    return message;
  }
}
