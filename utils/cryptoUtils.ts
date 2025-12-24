
/**
 * Utilidades de Cifrado para Family Plan (E2EE)
 * Proporciona cifrado AES-GCM de 256 bits basado en una clave derivada.
 */

const ALGORITHM = 'AES-GCM';
const KEY_ITERATIONS = 100000;

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: KEY_ITERATIONS,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: ALGORITHM, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export const cryptoService = {
  async encrypt(text: string, secret: string): Promise<string> {
    if (!text || !secret) return text;
    try {
      const encoder = new TextEncoder();
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const key = await deriveKey(secret, salt);
      
      const encrypted = await window.crypto.subtle.encrypt(
        { name: ALGORITHM, iv },
        key,
        encoder.encode(text)
      );

      const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(encrypted), salt.length + iv.length);
      
      return btoa(String.fromCharCode(...combined));
    } catch (e) {
      console.error("Encryption failed", e);
      return text;
    }
  },

  async decrypt(cipherText: string, secret: string): Promise<string> {
    if (!cipherText || !secret || cipherText.length < 32) return cipherText;
    try {
      const combined = new Uint8Array(
        atob(cipherText).split('').map(c => c.charCodeAt(0))
      );
      
      const salt = combined.slice(0, 16);
      const iv = combined.slice(16, 28);
      const data = combined.slice(28);
      
      const key = await deriveKey(secret, salt);
      const decrypted = await window.crypto.subtle.decrypt(
        { name: ALGORITHM, iv },
        key,
        data
      );

      return new TextDecoder().decode(decrypted);
    } catch (e) {
      // Si falla, probablemente el dato no estaba cifrado o la clave es incorrecta
      return cipherText;
    }
  }
};
