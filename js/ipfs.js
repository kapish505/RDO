/* ============================================
   ipfs.js - Pinata IPFS Upload/Fetch
   ============================================ */

// ── Upload to IPFS via Secure Vercel Proxy ───────────
async function uploadToIPFS(content, fileName, metadata = {}) {
  // `content` is expected to be a JSON string from create.js
  let parsedContent;
  try {
    parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
  } catch(e) {
    parsedContent = { rawParams: content }; // Fallback
  }
  
  return await uploadJSONToIPFS(parsedContent, fileName, metadata);
}

// ── Upload JSON to IPFS (Main Proxy Interface) ───────
async function uploadJSONToIPFS(jsonData, name, metadata = {}) {
  const payload = {
    pinataContent: jsonData,
    pinataMetadata: {
      name: name,
      keyvalues: { app: 'RDO', ...metadata }
    }
  };

  const response = await fetch('/api/uploadJSON', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let errText = await response.text();
    let errDesc = response.statusText;
    try { 
       const errObj = JSON.parse(errText); 
       if (errObj.error) errDesc = errObj.error.details || errObj.error;
    } catch(e) { }
    throw new Error(`IPFS JSON upload failed (${response.status}): ${errDesc}`);
  }

  const result = await response.json();
  return result.IpfsHash;
}

// ── Fetch from IPFS ──────────────────────────
async function fetchFromIPFS(cid) {
  const gateways = [
    `https://gateway.pinata.cloud/ipfs/${cid}`,
    `https://ipfs.io/ipfs/${cid}`,
    `https://nftstorage.link/ipfs/${cid}`,
    `https://w3s.link/ipfs/${cid}`,
    `https://4everland.io/ipfs/${cid}`,
    `https://cf-ipfs.com/ipfs/${cid}`,
    `https://dweb.link/ipfs/${cid}`
  ];

  for (const gateway of gateways) {
    try {
      console.log(`[IPFS] Trying gateway: ${gateway}`);
      const response = await fetch(gateway, {
        signal: AbortSignal.timeout(60000) // 60s timeout for large images
      });

      if (response.ok) {
        const text = await response.text();
        console.log(`[IPFS] Success from ${gateway}`);
        return text;
      } else {
        const errText = await response.text().catch(() => 'no text');
        console.warn(`[IPFS] Gateway ${gateway} returned HTTP ${response.status}: ${errText.slice(0, 100)}...`);
      }
    } catch (err) {
      console.warn(`[IPFS] Gateway ${gateway} failed with exception:`, err.message);
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
