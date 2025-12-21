/**
 * Normalize an organization name to a valid subdomain format
 * - Convert to lowercase
 * - Replace spaces with hyphens
 * - Remove special characters except hyphens
 */
export function normalizeSubdomain(orgName: string): string {
  return orgName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, '') // Remove special characters except hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with a single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Validate if a subdomain starts with any of the reserved words
 */
export function isReservedSubdomain(subdomain: string, reservedWords: string[]): boolean {
  const cleanSubdomain = subdomain.toLowerCase().trim();
  return reservedWords.some(word => cleanSubdomain.startsWith(word));
}

/**
 * Format a subdomain with the domain suffix
 */
export function formatSubdomain(subdomain: string): string {
  return `${subdomain}.onkeypriv.com`;
}