/**
 * Cryptographic engine for Mednoris Layer 2 (Hospital Records)
 * Uses libsodium-wrappers-sumo: XChaCha20-Poly1305 for encryption and Argon2id for key derivation.
 * NOTE: This module is client-side only. All functions must run in the browser.
 */

import sodium from "libsodium-wrappers-sumo";

export async function initCrypto() {
  await sodium.ready;
}

// Helper to convert base64 to a proper Uint8Array (browser only)
export function base64ToArrayBuffer(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper to convert Uint8Array/ArrayBuffer to base64 (browser only)
export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof ArrayBuffer
    ? new Uint8Array(buffer)
    : new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// 1. Generate a random salt for Argon2id (must be exactly crypto_pwhash_SALTBYTES = 16 bytes)
export function generateRandomBytes(length = 16): Uint8Array {
  const buf = new Uint8Array(length);
  crypto.getRandomValues(buf);
  return buf;
}

// Convenience helper for Argon2id-specific salt (ensures correct 16-byte length)
export function generateArgon2Salt(): Uint8Array {
  // libsodium crypto_pwhash_SALTBYTES = 16
  return generateRandomBytes(16);
}

// 2. Generate the Master Data Encryption Key (DEK) - XChaCha20-Poly1305
export async function generateDEK(): Promise<Uint8Array> {
  await sodium.ready;
  return sodium.crypto_aead_xchacha20poly1305_ietf_keygen();
}

// 3. Derive a Key Encryption Key (KEK) from a password using Argon2id
export async function deriveKEK(password: string, salt: ArrayBuffer | Uint8Array): Promise<Uint8Array> {
  await sodium.ready;

  // Ensure salt is a Uint8Array of exactly 16 bytes (crypto_pwhash_SALTBYTES)
  let saltBuf = salt instanceof ArrayBuffer ? new Uint8Array(salt) : salt;
  if (saltBuf.length !== sodium.crypto_pwhash_SALTBYTES) {
    const padded = new Uint8Array(sodium.crypto_pwhash_SALTBYTES);
    padded.set(saltBuf.slice(0, sodium.crypto_pwhash_SALTBYTES));
    saltBuf = padded;
  }

  return sodium.crypto_pwhash(
    sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES, // 32 bytes output key
    password,
    saltBuf,
    sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_ALG_ARGON2ID13
  );
}

// 4. Wrap (encrypt) the DEK using the KEK — XChaCha20-Poly1305
export async function wrapKey(dek: Uint8Array, kek: Uint8Array): Promise<{ wrappedBase64: string; ivBase64: string }> {
  await sodium.ready;
  const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES); // 24 bytes

  const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
    dek,
    null,  // no additional data
    null,  // no secret nonce
    nonce,
    kek
  );

  return {
    wrappedBase64: arrayBufferToBase64(ciphertext),
    ivBase64: arrayBufferToBase64(nonce)
  };
}

// 5. Unwrap (decrypt) the DEK using the KEK — XChaCha20-Poly1305
export async function unwrapKey(wrappedBase64: string, ivBase64: string, kek: Uint8Array): Promise<Uint8Array> {
  await sodium.ready;
  const ciphertext = base64ToArrayBuffer(wrappedBase64);
  const nonce = base64ToArrayBuffer(ivBase64);

  const plaintext = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
    null,  // no secret nonce
    ciphertext,
    null,  // no additional data
    nonce,
    kek
  );

  if (!plaintext) throw new Error("Decryption failed: invalid key or corrupted ciphertext.");
  return plaintext;
}

// 6. Encrypt a JSON payload using the DEK — XChaCha20-Poly1305
export async function encryptData(data: any, dek: Uint8Array): Promise<{ ciphertext: string; iv: string }> {
  await sodium.ready;
  const message = new TextEncoder().encode(JSON.stringify(data));
  const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);

  const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
    message,
    null,
    null,
    nonce,
    dek
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(nonce)
  };
}

// 7. Decrypt a JSON payload using the DEK — XChaCha20-Poly1305
export async function decryptData(ciphertextBase64: string, ivBase64: string, dek: Uint8Array): Promise<any> {
  await sodium.ready;
  const ciphertext = base64ToArrayBuffer(ciphertextBase64);
  const nonce = base64ToArrayBuffer(ivBase64);

  const decrypted = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
    null,
    ciphertext,
    null,
    nonce,
    dek
  );

  if (!decrypted) throw new Error("Decryption failed: invalid key or corrupted ciphertext.");
  return JSON.parse(new TextDecoder().decode(decrypted));
}

// 8. Deterministic Hashing for Searchable Identifiers (e.g., Mednoris ID)
// We use standard SHA-256 (Web Crypto) to hash IDs so we can query them without storing them in plaintext.
export async function hashData(text: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(text.trim().toUpperCase()); // Normalize before hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
