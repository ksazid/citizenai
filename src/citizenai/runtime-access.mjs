import crypto from 'node:crypto';

const TOKEN_PREFIX = 'citizenai_guest_';
const MIN_SECRET_BYTES = 32;

export function validateGuestTokenSecret(secret) {
  if (typeof secret !== 'string' || Buffer.byteLength(secret, 'utf8') < MIN_SECRET_BYTES) {
    throw new Error(`CITIZENAI_GUEST_TOKEN_SECRET must be at least ${MIN_SECRET_BYTES} bytes`);
  }
  return secret;
}

export function guestAccessTokenForLearner(learnerId, secret) {
  validateGuestTokenSecret(secret);
  const digest = crypto.createHmac('sha256', secret).update(String(learnerId), 'utf8').digest('base64url');
  return `${TOKEN_PREFIX}${digest}`;
}

export function verifyGuestAccessToken({ learnerId, token, secret }) {
  if (typeof token !== 'string' || !token.startsWith(TOKEN_PREFIX)) return false;
  let expected;
  try { expected = guestAccessTokenForLearner(learnerId, secret); }
  catch { return false; }
  const actualBuffer = Buffer.from(token, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  if (actualBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

export function bearerTokenFromRequest(req) {
  const raw = req?.headers?.authorization;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== 'string') return null;
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}
