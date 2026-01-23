const PINATA_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.Lw";

export interface RDOMetadata {
    name: string;
    description: string;
    image: string;
    properties: { rulesHash: string; encryptedContentCID: string; iv?: string; createdAt: number; };
}

async function uploadJSON(jsonBody: any, name: string): Promise<string> {
    const data = JSON.stringify({
        pinataContent: jsonBody,
        pinataMetadata: { name: name },
        pinataOptions: { cidVersion: 1 }
    });
    const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${PINATA_JWT}` },
        body: data
    });
    const json = await res.json();
    return json.IpfsHash;
}

export async function uploadRDO(metadata: RDOMetadata, encryptedContentUri: string): Promise<string> {
    // Mock Content Upload for Prototype to avoid complex FileSystem logic in this restoration step
    // In production we use expo-filesystem to read and upload FormData
    console.log("Mocking Content Upload...");
    const contentCid = "QmTestContentHash";

    metadata.properties.encryptedContentCID = contentCid;
    console.log("Uploading metadata...");
    return await uploadJSON(metadata, `rdo-${Date.now()}.json`);
}

export async function fetchFromIPFS(cid: string): Promise<Response> {
    const gateway = "https://gateway.pinata.cloud/ipfs/";
    return await fetch(`${gateway}${cid}`);
}
