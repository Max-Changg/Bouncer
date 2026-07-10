import crypto from 'crypto';

// AES-256-GCM encryption for OAuth tokens at rest. The key lives only in the
// server-side GMAIL_TOKEN_KEY env var (64 hex chars = 32 bytes), so a database
// leak alone does not expose usable tokens.

function getKey(): Buffer {
  const hex = process.env.GMAIL_TOKEN_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      'GMAIL_TOKEN_KEY must be set to a 64-character hex string (generate with: openssl rand -hex 32)'
    );
  }
  return Buffer.from(hex, 'hex');
}

export function encryptToken(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString('base64');
}

export function decryptToken(encoded: string): string {
  const data = Buffer.from(encoded, 'base64');
  const iv = data.subarray(0, 12);
  const tag = data.subarray(12, 28);
  const ciphertext = data.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString('utf8');
}
