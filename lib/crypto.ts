// Client-side encryption using Web Crypto API (available in Node 15+ and Browsers)
// We utilize 'crypto' module in Node if needed, or global crypto in browser.
// Next.js Edge/Server supports standard Web Crypto.

export async function generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );
}

export async function exportKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey("jwk", key);
    return JSON.stringify(exported);
}

export async function importKey(jwk: string): Promise<CryptoKey> {
    return await crypto.subtle.importKey(
        "jwk",
        JSON.parse(jwk),
        {
            name: "AES-GCM",
        },
        true,
        ["encrypt", "decrypt"]
    );
}

export async function encryptData(key: CryptoKey, data: string): Promise<{ iv: string; ciphertext: string }> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(data);

    const encrypted = await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        key,
        encoded
    );

    return {
        iv: Buffer.from(iv).toString('hex'),
        ciphertext: Buffer.from(encrypted).toString('hex')
    };
}

export async function decryptData(key: CryptoKey, ivHex: string, ciphertextHex: string): Promise<string> {
    const iv = Buffer.from(ivHex, 'hex');
    const ciphertext = Buffer.from(ciphertextHex, 'hex');

    const decrypted = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        key,
        ciphertext
    );

    return new TextDecoder().decode(decrypted);
}
