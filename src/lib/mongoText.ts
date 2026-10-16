/**
 * Escapes a value for Prisma's MongoDB string filters (`contains`, `startsWith`,
 * `endsWith`, and `equals` with `mode: "insensitive"`).
 *
 * The Prisma MongoDB connector builds those filters as a $regexMatch from the raw value
 * without escaping it — confirmed against this database (Prisma 6.19): a client name
 * starting with "*" fails the whole query ("quantifier does not follow a repeatable
 * item"), "(" fails with "missing closing parenthesis", and "." silently matches any
 * character. Every user- or Zoho-supplied value passed to those filters must go through
 * this so it matches literally.
 */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
