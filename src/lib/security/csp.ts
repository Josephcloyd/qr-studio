/**
 * Content-Security-Policy for the static build. `connect-src 'self'` means the
 * browser itself refuses scripted network connections — fetch requests, sockets, beacons — to any other
 * origin, so a bug or a compromised dependency can't quietly send designs
 * elsewhere. Static exports can't use per-request nonces, so inline scripts
 * (Next's hydration payload) need 'unsafe-inline'.
 *
 * Keep public/_headers in sync with this value.
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self'",
  "media-src 'self' data: blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-src 'none'",
  "manifest-src 'self'",
].join("; ");
