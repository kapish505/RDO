const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || '';

if (!PINATA_JWT) {
    console.warn("⚠️ NEXT_PUBLIC_PINATA_JWT is missing. IPFS uploads will fail.");
} else {
    console.log("✅ Pinata JWT detected.");
}

export interface RDOMetadata {
    name: string;
    description: string;
    image: string;
    properties: {
        rulesHash: string;
        encryptedContentCID: string;
        iv?: string; // Initialization Vector for AES-GCM
        createdAt: number;
    };
}

// Helper to upload Blob to Pinata
async function uploadBlobToPinata(blob: Blob, name: string): Promise<string> {
    const data = new FormData();
    data.append('file', blob, name);
    // Optional: Add Pinata Metadata
    const metadata = JSON.stringify({ name: name });
    data.append('pinataMetadata', metadata);
    const options = JSON.stringify({ cidVersion: 1 });
    data.append('pinataOptions', options);

    const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${PINATA_JWT}`
        },
        body: data
    });

    if (!res.ok) {
        throw new Error(`Pinata File Upload Failed: ${res.statusText}`);
    }

    const json = await res.json();
    return json.IpfsHash;
}

// Helper to upload JSON to Pinata
async function uploadJSONToPinata(jsonBody: any, name: string): Promise<string> {
    const data = JSON.stringify({
        pinataContent: jsonBody,
        pinataMetadata: { name: name },
        pinataOptions: { cidVersion: 1 }
    });

    const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${PINATA_JWT}`
        },
        body: data
    });

    if (!res.ok) {
        throw new Error(`Pinata JSON Upload Failed: ${res.statusText}`);
    }

    const json = await res.json();
    return json.IpfsHash;
}

/**
 * Uploads RDO metadata and encrypted content to IPFS via Pinata.
 */
export async function uploadRDO(
    metadata: RDOMetadata,
    encryptedContent: Blob
): Promise<string> {
    // 1. Upload Encrypted Content
    console.log("Uploading content to Pinata...");
    const contentCid = await uploadBlobToPinata(encryptedContent, `rdo-content-${Date.now()}.bin`);

    // 2. Update Metadata with content CID
    metadata.properties.encryptedContentCID = contentCid;

    // 3. Store Metadata
    console.log("Uploading metadata to Pinata...");
    const metadataCid = await uploadJSONToPinata(metadata, `rdo-metadata-${Date.now()}.json`);

    return metadataCid;
}


/**
 * Fetches content from IPFS via a public gateway
 */
export async function fetchFromIPFS(cid: string): Promise<Response> {
    const gateway = "https://gateway.pinata.cloud/ipfs/";
    const url = `${gateway}${cid}`;

    // We add a cache buster or specific headers if needed, but basic fetch is usually ok
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to fetch from IPFS: ${res.statusText}`);
    }
    return res;
}
