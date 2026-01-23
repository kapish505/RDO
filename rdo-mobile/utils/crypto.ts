import 'react-native-get-random-values';
import { Buffer } from 'buffer';

// Polyfill Buffer
// @ts-ignore
if (typeof global.Buffer === 'undefined') global.Buffer = Buffer;

export async function generateKey(): Promise<CryptoKey> {
    if (!global.crypto?.subtle) throw new Error("WebCrypto not supported");
    return await global.crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}

export async function exportKey(key: CryptoKey): Promise<string> {
    const exported = await global.crypto.subtle.exportKey("jwk", key);
    return JSON.stringify(exported);
}

export async function importKey(jwk: string): Promise<CryptoKey> {
    return await global.crypto.subtle.importKey("jwk", JSON.parse(jwk), { name: "AES-GCM" }, true, ["encrypt", "decrypt"]);
}

export async function encryptData(key: CryptoKey, data: string): Promise<{ iv: string; ciphertext: string }> {
    const iv = global.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(data);
    const encrypted = await global.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);

    return {
        iv: Buffer.from(iv).toString('hex'),
        ciphertext: Buffer.from(encrypted).toString('hex')
    };
}

export async function decryptData(key: CryptoKey, ivHex: string, ciphertextHex: string): Promise<string> {
    const iv = Buffer.from(ivHex, 'hex');
    const ciphertext = Buffer.from(ciphertextHex, 'hex');
    const decrypted = await global.crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return new TextDecoder().decode(decrypted);
}
