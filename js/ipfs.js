/* ============================================
   ipfs.js - Pinata IPFS Upload/Fetch
   ============================================ */

// ── Upload to IPFS via Pinata ─────────────────
async function uploadToIPFS(content, fileName, metadata = {}) {
  if (!PINATA_API_KEY || PINATA_API_KEY === 'YOUR_PINATA_API_KEY') {
    // Demo mode: return a fake CID
    console.warn('Pinata API keys not set. Using demo mode.');
    const fakeCid = 'Qm' + Array.from(
      window.crypto.getRandomValues(new Uint8Array(22)),
      b => b.toString(16).padStart(2, '0')
    ).join('').slice(0, 44);
    return fakeCid;
  }

  const formData = new FormData();
  const blob = new Blob([content], { type: 'application/json' });
  formData.append('file', blob, fileName);

  // Add metadata
  const pinataMetadata = {
    name: fileName,
    keyvalues: {
      app: 'RDO',
      ...metadata
    }
  };
  formData.append('pinataMetadata', JSON.stringify(pinataMetadata));

  const pinataOptions = {
    cidVersion: 0
  };
  formData.append('pinataOptions', JSON.stringify(pinataOptions));

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      'pinata_api_key': PINATA_API_KEY,
      'pinata_secret_api_key': PINATA_SECRET_API_KEY
    },
    body: formData
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`IPFS upload failed: ${err.error?.details || response.statusText}`);
  }

  const result = await response.json();
  return result.IpfsHash;
}

// ── Upload JSON to IPFS ──────────────────────
async function uploadJSONToIPFS(jsonData, name, metadata = {}) {
  if (!PINATA_API_KEY || PINATA_API_KEY === 'YOUR_PINATA_API_KEY') {
    console.warn('Pinata API keys not set. Using demo mode.');
    const fakeCid = 'Qm' + Array.from(
      window.crypto.getRandomValues(new Uint8Array(22)),
      b => b.toString(16).padStart(2, '0')
    ).join('').slice(0, 44);
    return fakeCid;
  }

  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'pinata_api_key': PINATA_API_KEY,
      'pinata_secret_api_key': PINATA_SECRET_API_KEY
    },
    body: JSON.stringify({
      pinataContent: jsonData,
      pinataMetadata: {
        name: name,
        keyvalues: { app: 'RDO', ...metadata }
      }
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`IPFS JSON upload failed: ${err.error?.details || response.statusText}`);
  }

  const result = await response.json();
  return result.IpfsHash;
}

// ── Fetch from IPFS ──────────────────────────
async function fetchFromIPFS(cid) {
  const gateways = [
    `https://gateway.pinata.cloud/ipfs/${cid}`,
    `https://cloudflare-ipfs.com/ipfs/${cid}`,
    `https://ipfs.io/ipfs/${cid}`,
    `https://dweb.link/ipfs/${cid}`
  ];

  for (const gateway of gateways) {
    try {
      const response = await fetch(gateway, {
        signal: AbortSignal.timeout(10000) // 10s timeout
      });

      if (response.ok) {
        const text = await response.text();
        return text;
      }
    } catch (err) {
      console.warn(`Gateway ${gateway} failed:`, err.message);
    }
  }

  throw new Error('Failed to fetch from IPFS. All gateways failed.');
}

// ── Fetch JSON from IPFS ─────────────────────
async function fetchJSONFromIPFS(cid) {
  const raw = await fetchFromIPFS(cid);
  return JSON.parse(raw);
}

// ── Get IPFS URL ─────────────────────────────
function getIPFSUrl(cid) {
  return `${PINATA_GATEWAY}${cid}`;
}

// ── Test Pinata Connection ───────────────────
async function testPinataConnection() {
  if (!PINATA_API_KEY || PINATA_API_KEY === 'YOUR_PINATA_API_KEY') {
    return { success: false, message: 'API keys not configured' };
  }

  try {
    const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
      headers: {
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_API_KEY
      }
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, message: data.message };
    } else {
      return { success: false, message: data.error };
    }
  } catch (err) {
    return { success: false, message: err.message };
  }
}
