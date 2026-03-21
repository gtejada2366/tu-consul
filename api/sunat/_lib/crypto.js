import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error("Missing ENCRYPTION_KEY env var");
  // Key must be 32 bytes (64 hex chars)
  const buf = Buffer.from(key, "hex");
  if (buf.length !== 32) throw new Error("ENCRYPTION_KEY must be 64 hex characters (32 bytes)");
  return buf;
}

/**
 * Encrypt a plaintext string. Returns "iv:encrypted:tag" in hex.
 * Returns empty string if input is falsy.
 */
export function encrypt(plaintext) {
  if (!plaintext) return "";
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${encrypted.toString("hex")}:${tag.toString("hex")}`;
}

/**
 * Decrypt a string produced by encrypt(). Returns plaintext.
 * Returns empty string if input is falsy.
 * If input doesn't look encrypted (no colons), returns it as-is (migration support).
 */
export function decrypt(ciphertext) {
  if (!ciphertext) return "";
  // Support unencrypted legacy values during migration
  if (!ciphertext.includes(":")) return ciphertext;
  const parts = ciphertext.split(":");
  if (parts.length !== 3) return ciphertext;
  try {
    const key = getKey();
    const iv = Buffer.from(parts[0], "hex");
    const encrypted = Buffer.from(parts[1], "hex");
    const tag = Buffer.from(parts[2], "hex");
    if (iv.length !== IV_LENGTH || tag.length !== TAG_LENGTH) return ciphertext;
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(encrypted) + decipher.final("utf8");
  } catch {
    // If decryption fails, assume it's a legacy plaintext value
    return ciphertext;
  }
}
