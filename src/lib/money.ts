import Decimal from "decimal.js";

/**
 * All money in this app is persisted as integer cents (see prisma/schema.prisma header
 * comment for why: the MongoDB Prisma connector has no Decimal type, and Float would
 * reintroduce the exact rounding bugs we're fixing vs. the legacy string-typed money
 * fields). These helpers are the ONLY place dollar <-> cents conversion should happen.
 */

/** Parse a user-entered dollar string/number (e.g. "1,234.50") into integer cents. */
export function dollarsToCents(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined || input === "") return null;
  const normalized = typeof input === "string" ? input.replace(/,/g, "").trim() : input;
  if (normalized === "") return null;
  const d = new Decimal(normalized);
  if (d.isNaN()) throw new Error(`Invalid money value: ${input}`);
  return d.times(100).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
}

/** Convert stored integer cents back into a Decimal for display/formatting/math. */
export function centsToDecimal(cents: number | null | undefined): Decimal {
  if (cents === null || cents === undefined) return new Decimal(0);
  return new Decimal(cents).dividedBy(100);
}

/** Convert stored integer cents into a plain dollar number, e.g. for JSON API responses. */
export function centsToDollars(cents: number | null | undefined): number | null {
  if (cents === null || cents === undefined) return null;
  return centsToDecimal(cents).toNumber();
}

/** Format stored integer cents as a currency string, e.g. "$1,234.50". */
export function formatCents(cents: number | null | undefined, currency = "USD"): string {
  if (cents === null || cents === undefined) return "";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    centsToDecimal(cents).toNumber()
  );
}

export function addCents(...values: Array<number | null | undefined>): number {
  return values.reduce<number>((sum, v) => sum + (v ?? 0), 0);
}
