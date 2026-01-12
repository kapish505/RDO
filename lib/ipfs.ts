import { NFTStorage, Blob } from 'nft.storage';

const NFT_STORAGE_TOKEN = process.env.NEXT_PUBLIC_NFT_STORAGE_TOKEN || '';

// Initialize client
const client = new NFTStorage({ token: NFT_STORAGE_TOKEN });

if (!NFT_STORAGE_TOKEN) {
    console.warn("⚠️ NEXT_PUBLIC_NFT_STORAGE_TOKEN is missing or empty.");
} else {
    console.log("✅ NFT Storage Token detected (Length: " + NFT_STORAGE_TOKEN.length + ")");
}

export interface RDOMetadata {
    name: string;
    description: string;
    image: string; // CID or URL
    properties: {
        rulesHash: string;
        encryptedContentCID: string;
        createdAt: number;
    };
}

/**
 * Uploads RDO metadata and encrypted content to IPFS.
 */
export async function uploadRDO(
    metadata: RDOMetadata,
    encryptedContent: Blob
): Promise<string> {
    // 1. Upload Encrypted Content
    const contentCid = await client.storeBlob(encryptedContent);

    // 2. Update Metadata with content CID
    metadata.properties.encryptedContentCID = contentCid;

    // 3. Store Metadata (nft.storage stores structured metadata as a JSON)
    // We construct a File for metadata to get a direct CID or use store() which wraps it.
    // We want the direct CID of the JSON.
    const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
    const metadataCid = await client.storeBlob(metadataBlob);

    return metadataCid;
}
