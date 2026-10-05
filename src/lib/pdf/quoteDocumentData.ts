import type { Client, DomesticWarehouseQuote, QuoteCargoItem } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Loads everything the quote print template needs, in one place — mirrors the
 * shape/spirit of src/lib/pdf/documentData.ts for the shipment documents, but for
 * the independent Quote entity. `customerId`/`carrierId` are plain ObjectId scalars
 * (not Prisma @relation — see schema header comment), so the Client rows are
 * resolved with a follow-up lookup rather than a Prisma `include`.
 */

export interface QuoteDocumentData {
  quote: DomesticWarehouseQuote;
  customer: Client | null;
  carrier: Client | null;
  cargoItems: QuoteCargoItem[];
}

export class QuoteNotFoundError extends Error {
  constructor(quoteId: string) {
    super(`Quote not found: ${quoteId}`);
    this.name = "QuoteNotFoundError";
  }
}

async function findClient(id: string | null): Promise<Client | null> {
  if (!id) return null;
  return prisma.client.findUnique({ where: { id } });
}

export async function getQuoteDocumentData(quoteId: string): Promise<QuoteDocumentData> {
  const quote = await prisma.domesticWarehouseQuote.findUnique({ where: { id: quoteId } });
  if (!quote) throw new QuoteNotFoundError(quoteId);

  const [customer, carrier, cargoItems] = await Promise.all([
    findClient(quote.customerId),
    findClient(quote.carrierId),
    prisma.quoteCargoItem.findMany({ where: { quoteId: quote.id } }),
  ]);

  return { quote, customer, carrier, cargoItems };
}
