/**
 * Cryptographic engine for Mednoris Layer 2 (Hospital Records)
 * Uses native Web Crypto API for zero-dependency, hardware-accelerated AES-256-GCM encryption.
 */

// Helper to convert base64 to a proper ArrayBuffer (not Uint8Array<ArrayBufferLike>)
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const buf = new ArrayBuffer(len);
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return buf;
}

// Helper to convert Uint8Array to base64
export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  let binary = "";
  const bytes = new Uint8Array(buffer instanceof ArrayBuffer ? buffer : buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// 1. Generate a random Salt (for PBKDF2) or IV (for AES-GCM)
export function generateRandomBytes(length = 16): Uint8Array {
  return new Uint8Array(window.crypto.getRandomValues(new Uint8Array(new ArrayBuffer(length))).buffer);
}

// 2. Generate the Master Data Encryption Key (DEK) - AES-GCM 256
export async function generateDEK(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true, // extractable so we can wrap it
    ["encrypt", "decrypt"]
  );
}

// 3. Derive a Key Encryption Key (KEK) from a password using PBKDF2
export async function deriveKEK(password: string, salt: ArrayBuffer | Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  // Ensure salt is a proper ArrayBuffer for the PBKDF2 call
  const saltBuf = salt instanceof ArrayBuffer ? salt : new ArrayBuffer(salt.byteLength);
  if (!(salt instanceof ArrayBuffer)) new Uint8Array(saltBuf).set(salt);

  return await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuf,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false, // KEK is never extractable
    ["wrapKey", "unwrapKey"]
  );
}

// 4. Wrap the DEK using the KEK
export async function wrapKey(dek: CryptoKey, kek: CryptoKey): Promise<{ wrappedBase64: string; ivBase64: string }> {
  const ivRaw = window.crypto.getRandomValues(new Uint8Array(new ArrayBuffer(12)));
  const iv = new Uint8Array(ivRaw.buffer);

  const wrappedKeyBuffer = await window.crypto.subtle.wrapKey(
    "raw",
    dek,
    kek,
    { name: "AES-GCM", iv }
  );
  
  return {
    wrappedBase64: arrayBufferToBase64(wrappedKeyBuffer),
    ivBase64: arrayBufferToBase64(iv)
  };
}

// 5. Unwrap the DEK using the KEK
export async function unwrapKey(wrappedBase64: string, ivBase64: string, kek: CryptoKey): Promise<CryptoKey> {
  const wrappedKeyBuffer = base64ToArrayBuffer(wrappedBase64);
  const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));

  return await window.crypto.subtle.unwrapKey(
    "raw",
    wrappedKeyBuffer,
    kek,
    { name: "AES-GCM", iv },
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

// 6. Encrypt JSON payload using the DEK
export async function encryptData(data: any, dek: CryptoKey): Promise<{ ciphertext: string; iv: string }> {
  const enc = new TextEncoder();
  const encodedData = enc.encode(JSON.stringify(data));
  const ivRaw = window.crypto.getRandomValues(new Uint8Array(new ArrayBuffer(12)));
  const iv = new Uint8Array(ivRaw.buffer);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    dek,
    encodedData
  );

  return {
    ciphertext: arrayBufferToBase64(encryptedBuffer),
    iv: arrayBufferToBase64(iv)
  };
}

// 7. Decrypt JSON payload using the DEK
export async function decryptData(ciphertextBase64: string, ivBase64: string, dek: CryptoKey): Promise<any> {
  const ciphertextBuffer = base64ToArrayBuffer(ciphertextBase64);
  const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    dek,
    ciphertextBuffer
  );

  const dec = new TextDecoder();
  const jsonString = dec.decode(decryptedBuffer);
  return JSON.parse(jsonString);
}
