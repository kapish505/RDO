/* ============================================
   crypto.js - AES-256-GCM Encryption/Decryption
   Web Crypto API (browser-native, no library needed)
   ============================================ */

const CRYPTO_ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

// ── Generate Encryption Key ──────────────────
async function generateEncryptionKey() {
  const key = await window.crypto.subtle.generateKey(
    { name: CRYPTO_ALGORITHM, length: KEY_LENGTH },
    true,  // extractable
    ['encrypt', 'decrypt']
  );
  return key;
}

// ── Export Key to Base64 ─────────────────────
async function exportKey(key) {
  const raw = await window.crypto.subtle.exportKey('raw', key);
  return arrayBufferToBase64(raw);
}

// ── Import Key from Base64 ───────────────────
async function importKey(base64Key) {
  const raw = base64ToArrayBuffer(base64Key);
  return await window.crypto.subtle.importKey(
    'raw',
    raw,
    { name: CRYPTO_ALGORITHM },
    false,
    ['decrypt']
  );
}

// ── Derive Key from Password ─────────────────
async function deriveKeyFromPassword(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: CRYPTO_ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
}

// ── Encrypt Text ─────────────────────────────
async function encryptText(text, key) {
  const enc = new TextEncoder();
  const data = enc.encode(text);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await window.crypto.subtle.encrypt(
    { name: CRYPTO_ALGORITHM, iv },
    key,
    data
  );

  // Combine IV + cipher
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  return arrayBufferToBase64(combined.buffer);
}

// ── Encrypt File (ArrayBuffer) ───────────────
async function encryptFile(arrayBuffer, key) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await window.crypto.subtle.encrypt(
    { name: CRYPTO_ALGORITHM, iv },
    key,
    arrayBuffer
  );

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  return combined.buffer;
}

// ── Decrypt Text ─────────────────────────────
async function decryptText(base64Cipher, key) {
  const combined = base64ToArrayBuffer(base64Cipher);
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);

  const decrypted = await window.crypto.subtle.decrypt(
    { name: CRYPTO_ALGORITHM, iv: new Uint8Array(iv) },
    key,
    data
  );

  const dec = new TextDecoder();
  return dec.decode(decrypted);
}

// ── Decrypt File ─────────────────────────────
async function decryptFile(encryptedBuffer, key) {
  const iv = encryptedBuffer.slice(0, 12);
  const data = encryptedBuffer.slice(12);

  return await window.crypto.subtle.decrypt(
    { name: CRYPTO_ALGORITHM, iv: new Uint8Array(iv) },
    key,
    data
  );
}

// ── Encode/Decode Helpers ────────────────────
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const sanitized = base64.replace(/ /g, '+');
  const binary = atob(sanitized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ── Hash Content (SHA-256) ───────────────────
async function hashContent(data) {
  let buffer;
  if (typeof data === 'string') {
    buffer = new TextEncoder().encode(data);
  } else {
    buffer = data;
  }

  const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Generate Random Salt ─────────────────────
function generateSalt() {
  return window.crypto.getRandomValues(new Uint8Array(16));
}

// ── Package Encrypted Content for IPFS ───────
async function packageForIPFS(content, fileName, mimeType) {
  const key = await generateEncryptionKey();
  const exportedKey = await exportKey(key);

  let encryptedContent;
  if (typeof content === 'string') {
    encryptedContent = await encryptText(content, key);
  } else {
    // ArrayBuffer (file)
    const encBuf = await encryptFile(content, key);
    encryptedContent = arrayBufferToBase64(encBuf);
  }

  const payload = {
    encrypted: encryptedContent,
    fileName: fileName || 'content',
    mimeType: mimeType || 'text/plain',
    timestamp: Date.now(),
    version: '1.0'
  };

  return {
    payload:     JSON.stringify(payload),
    key:         exportedKey,
    contentHash: await hashContent(encryptedContent)
  };
}

// ── Unpackage and Decrypt from IPFS data ─────
async function unpackageFromIPFS(ipfsData, exportedKey) {
  const payload = JSON.parse(ipfsData);
  const key = await importKey(exportedKey);

  const decrypted = await decryptText(payload.encrypted, key);

  return {
    content:  decrypted,
    fileName: payload.fileName,
    mimeType: payload.mimeType
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  High-level wrappers used by create.html and view.html
// ─────────────────────────────────────────────────────────────────────────────

/**
 * encryptContent(content)
 * Accepts a File, Uint8Array, or ArrayBuffer.
 * Returns { encrypted: Uint8Array, key: CryptoKey, exportedKey: base64 }
 * The `encrypted` Uint8Array is what you pass directly to uploadToIPFS().
 */
async function encryptContent(content) {
  const key = await generateEncryptionKey();
  const exportedKey = await exportKey(key);

  let buffer;
  if (content instanceof File) {
    buffer = await content.arrayBuffer();
  } else if (content instanceof Uint8Array) {
    buffer = content.buffer;
  } else {
    buffer = content; // already ArrayBuffer
  }

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: CRYPTO_ALGORITHM, iv },
    key,
    buffer
  );

  // Package: 12-byte IV prefix + ciphertext
  const combined = new Uint8Array(12 + encryptedBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedBuffer), 12);

  return {
    encrypted:   combined,     // Uint8Array — upload this to IPFS
    key:         key,          // CryptoKey  — keep in memory
    exportedKey: exportedKey   // base64 string — store securely
  };
}

/**
 * decryptContent(encryptedBytes, keyOrBase64)
 * Accepts raw encrypted Uint8Array/ArrayBuffer/base64 from IPFS
 * and the key (CryptoKey or base64 string).
 * Returns decrypted string (text) or Uint8Array (binary).
 */
async function decryptContent(encryptedBytes, keyOrBase64) {
  let cryptoKey;
  if (typeof keyOrBase64 === 'string') {
    cryptoKey = await importKey(keyOrBase64);
  } else if (keyOrBase64 instanceof CryptoKey) {
    cryptoKey = keyOrBase64;
  } else {
    throw new Error('decryptContent: invalid key type');
  }

  let combined;
  if (typeof encryptedBytes === 'string') {
    combined = new Uint8Array(base64ToArrayBuffer(encryptedBytes));
  } else if (encryptedBytes instanceof Uint8Array) {
    combined = encryptedBytes;
  } else {
    combined = new Uint8Array(encryptedBytes);
  }

  const iv   = combined.slice(0, 12);
  const data = combined.slice(12);

  const decrypted = await window.crypto.subtle.decrypt(
    { name: CRYPTO_ALGORITHM, iv },
    cryptoKey,
    data
  );

  try {
    return new TextDecoder().decode(decrypted);
  } catch {
    return new Uint8Array(decrypted);
  }
}

// ─────────────────────────────────────────────────────────
//  SELF-SOVEREIGN AES KEY WRAPPING (RSA-OAEP PKI)
// ─────────────────────────────────────────────────────────

// 1. Generate RSA-OAEP keypair
async function generateRSAKeyPair() {
  return await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );
}

// 2. Export RSA Key to string
async function exportRSAKey(key) {
  const exported = await crypto.subtle.exportKey(key.type === 'private' ? 'pkcs8' : 'spki', key);
  return arrayBufferToBase64(exported);
}

// 3. Import RSA Key from string
async function importRSAKey(base64, type) {
  const raw = base64ToArrayBuffer(base64);
  return await crypto.subtle.importKey(
    type === 'private' ? 'pkcs8' : 'spki',
    raw,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    type === 'private' ? ["decrypt"] : ["encrypt"]
  );
}

// 4. Encrypt AES Key with Recipient's RSA Public Key
async function encryptAESKeyWithRSA(publicKeyStr, aesKeyBase64) {
    const pubKey = await importRSAKey(publicKeyStr, 'public');
    const encoder = new TextEncoder();
    const encoded = encoder.encode(aesKeyBase64);
    const encrypted = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, pubKey, encoded);
    return arrayBufferToBase64(encrypted);
}

// 5. Decrypt AES Key with Own RSA Private Key
async function decryptAESKeyWithRSA(privateKeyStr, encryptedBase64) {
    const privKey = await importRSAKey(privateKeyStr, 'private');
    const encryptedBytes = base64ToArrayBuffer(encryptedBase64);
    const decrypted = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, privKey, encryptedBytes);
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
}

// 6. Generate Profile & Backup PrivKey via Wallet Signature
const RECOVERY_MESSAGE = "RDO KEY RECOVERY\n\nSign this message to securely back up or recover your invisible decryption private key.";

async function generateEncryptionProfile(signer) {
    // A. Generate fresh RSA
    const keyPair = await generateRSAKeyPair();
    const pubKeyStr = await exportRSAKey(keyPair.publicKey);
    const privKeyStr = await exportRSAKey(keyPair.privateKey);

    // B. Prompt user to sign a deterministic string to derive a KEK (Key Encryption Key)
    const signature = await signer.signMessage(RECOVERY_MESSAGE);
    
    // C. Derive AES KEK from signature hash
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(signature));
    const kek = await window.crypto.subtle.importKey(
        'raw', hashBuffer, { name: CRYPTO_ALGORITHM }, false, ['encrypt', 'decrypt']
    );

    // D. Encrypt the Private Key string with KEK
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encryptedPrivKeyBuffer = await window.crypto.subtle.encrypt(
        { name: CRYPTO_ALGORITHM, iv: iv },
        kek,
        new TextEncoder().encode(privKeyStr)
    );

    const combined = new Uint8Array(12 + encryptedPrivKeyBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedPrivKeyBuffer), 12);
    
    const encryptedPrivKeyStr = arrayBufferToBase64(combined.buffer);

    // E. Return the combined JSON payload to store on-chain
    return JSON.stringify({
        pubKey: pubKeyStr,
        encPrivKey: encryptedPrivKeyStr
    });
}

// 7. Recover Private Key from On-Chain Profile
async function recoverRSAPrivateKey(profileJsonStr, signer) {
    const profile = JSON.parse(profileJsonStr);
    
    // A. Ask user to sign the exact same message to redraw the KEK
    const signature = await signer.signMessage(RECOVERY_MESSAGE);
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(signature));
    const kek = await window.crypto.subtle.importKey(
        'raw', hashBuffer, { name: CRYPTO_ALGORITHM }, false, ['encrypt', 'decrypt']
    );

    // B. Decrypt the wrapped private key
    const combined = base64ToArrayBuffer(profile.encPrivKey);
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: CRYPTO_ALGORITHM, iv: new Uint8Array(iv) },
        kek,
        data
    );

    // C. Return the plaintext RSA private key
    return new TextDecoder().decode(decryptedBuffer);
}

// ─────────────────────────────────────────────────────────────────────────────
//  RDO Payload & Access Abstractions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates the encrypted AES key payloads for the Creator and any Whitelisted addresses
 * by resolving against EVM PKI mappings securely.
 */
async function generateRDOKeyPayload(creatorAddress, exportedKey, isWhitelist, whitelistString) {
  let parsedWhitelist = [];
  let encryptedKeysArray = [];
  let creatorEncryptedKey = "";

  const creatorProfileStr = await getEncryptionProfile(creatorAddress);
  if (!creatorProfileStr) {
      throw new Error("Missing PKI Profile! Please go to the Dashboard to register your Encryption Key before creating an RDO.");
  }
  
  try {
      const profile = JSON.parse(creatorProfileStr);
      creatorEncryptedKey = await encryptAESKeyWithRSA(profile.pubKey, exportedKey);
  } catch(e) {
      console.error("Could not encrypt key for creator:", e);
      throw new Error("Failed to encrypt your access key using your profile.");
  }

  if (isWhitelist && whitelistString) {
    parsedWhitelist = whitelistString.split(',').map(s => s.trim()).filter(s => s.length > 0);
    for (const addr of parsedWhitelist) {
        const profStr = await getEncryptionProfile(addr);
        if (profStr) {
            try {
                const profile = JSON.parse(profStr);
                const shieldedKey = await encryptAESKeyWithRSA(profile.pubKey, exportedKey);
                encryptedKeysArray.push(shieldedKey);
            } catch(e) {
                console.warn("Invalid profile for", addr);
                encryptedKeysArray.push("");
            }
        } else {
            console.warn("No profile found for", addr);
            encryptedKeysArray.push("");
        }
    }
  }

  return { creatorEncryptedKey, parsedWhitelist, encryptedKeysArray };
}
