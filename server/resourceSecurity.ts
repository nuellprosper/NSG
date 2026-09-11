// Resource Discovery & Download SSRF Protection and Security Validator

export const ALLOWED_RESOURCE_DOMAINS = [
  // OpenStax
  'openstax.org',
  'assets.openstax.org',
  'cnx.org',
  'archive.cnx.org',
  // Project Gutenberg & Gutendex
  'gutenberg.org',
  'www.gutenberg.org',
  'aleph.gutenberg.org',
  'gutendex.com',
  // Open Library & Internet Archive
  'openlibrary.org',
  'covers.openlibrary.org',
  'archive.org',
  // Google / Firebase Storage for legitimate community uploads
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
];

/**
 * Validates a download URL against SSRF attacks, private networks, and domain allowlist
 */
export function isAllowedDownloadUrl(targetUrl: string): { allowed: boolean; reason?: string } {
  try {
    const parsed = new URL(targetUrl);

    // 1. Protocol must be HTTPS (or HTTP for specific public archive mirrors if required)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { allowed: false, reason: 'Disallowed protocol: Only HTTPS/HTTP are permitted.' };
    }

    const hostname = parsed.hostname.toLowerCase();

    // 2. Reject localhost and local hostnames
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      return { allowed: false, reason: 'SSRF Protection: Access to localhost or internal network is blocked.' };
    }

    // 3. Reject IPv4 and IPv6 addresses (private ranges, loopback, link-local, cloud metadata)
    // 127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16 (AWS/GCP metadata)
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipMatch = hostname.match(ipv4Regex);
    if (ipMatch) {
      const b0 = parseInt(ipMatch[1], 10);
      const b1 = parseInt(ipMatch[2], 10);
      if (
        b0 === 127 || // Loopback
        b0 === 10 ||  // Private
        (b0 === 172 && b1 >= 16 && b1 <= 31) || // Private
        (b0 === 192 && b1 === 168) || // Private
        (b0 === 169 && b1 === 254) || // Link-local / Cloud metadata
        b0 === 0 // Current network
      ) {
        return { allowed: false, reason: 'SSRF Protection: Access to private IP ranges or metadata endpoints is strictly blocked.' };
      }
    }

    if (hostname === '::1' || hostname.includes('::') || hostname.startsWith('[') || hostname.includes('fe80:')) {
      return { allowed: false, reason: 'SSRF Protection: IPv6 private/loopback addresses are blocked.' };
    }

    // 4. Check domain against strictly authorized educational resource provider allowlist
    const isDomainAllowed = ALLOWED_RESOURCE_DOMAINS.some(allowedDomain => {
      return hostname === allowedDomain || hostname.endsWith(`.${allowedDomain}`);
    });

    if (!isDomainAllowed) {
      return { allowed: false, reason: `Domain "${hostname}" is not in the authorized educational resources allowlist.` };
    }

    return { allowed: true };
  } catch (err: any) {
    return { allowed: false, reason: `Malformed URL: ${err?.message || err}` };
  }
}
