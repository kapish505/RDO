import { keccak256, toHex } from 'viem';

// Core RDO Types
export enum RDOType {
    MESSAGE = "MESSAGE",
    FILE = "FILE",
    LINK = "LINK",
    PERMISSION = "PERMISSION"
}

// User Intent Input
export interface RuleIntent {
    type: RDOType;
    name: string;
    description: string;

    // Type-Specific Payload
    payload: {
        text?: string;        // For MESSAGE
        file?: File;          // For FILE (Client-side use only)
        url?: string;         // For LINK
        scope?: string;       // For PERMISSION (e.g. READ)
        resource?: string;    // For PERMISSION
        mimeType?: string;    // For FILE
        fileName?: string;    // For FILE
    };

    // Rule Options
    allowedUsers: 'ANY' | 'LINK' | 'LIST' | 'CREATOR_ONLY' | 'SINGLE_USE';
    forbiddenActions: ('FORWARD' | 'COPY' | 'EXPORT')[];
    expirySeconds: number; // 0 = never
    violationAction: 'REFUSE' | 'LOCK'; // Refuse vs Permanently Lock
    maxUses: number; // 0 = unlimited
    requireIdentity: 'ALWAYS' | 'CONDITIONAL' | 'NEVER';
}

// Canonical Rule Object (Machine Readable)
export interface CanonicalRules {
    v: number;
    type: string;
    payload: any; // Simplified for hash input
    rules: {
        access_scope: string; // ANYONE, WHITELIST, etc.
        forbidden: string[];
        expiry: number;
        max_uses: number;
        lock_on_violation: boolean;
        require_identity: string;
    };
}

/**
 * Compiles high-level user intent into a canonical JSON object and its hash.
 */
export function compileRules(intent: RuleIntent): { json: string; hash: `0x${string}`; rules: CanonicalRules } {
    // 1. Map Intent to Canonical Rules
    // Construct simplified payload for hashing (exclude actual file binaries, just metadata)
    const payloadForHash = { ...intent.payload };
    delete payloadForHash.file; // Don't hash the file object itself here, just metadata if present

    const rules: CanonicalRules = {
        v: 1,
        type: intent.type,
        payload: payloadForHash,
        rules: {
            access_scope: intent.allowedUsers,
            forbidden: intent.forbiddenActions.sort(), // Deterministic sort
            expiry: intent.expirySeconds > 0 ? Math.floor(Date.now() / 1000) + intent.expirySeconds : 0,
            max_uses: intent.maxUses,
            lock_on_violation: intent.violationAction === 'LOCK',
            require_identity: intent.requireIdentity
        }
    };

    // 2. Canonical Stringify (Deterministic)
    const canonicalString = stringifyDeterministic(rules);

    // 3. Hash
    const hash = keccak256(toHex(canonicalString));

    return { json: canonicalString, hash, rules };
}

/**
 * Deterministic JSON stringify by storing keys in alphabetical order.
 */
function stringifyDeterministic(obj: Record<string, any>): string {
    const allKeys = [];
    for (const key in obj) {
        allKeys.push(key);
    }
    allKeys.sort();
    let str = '{';
    for (let i = 0; i < allKeys.length; i++) {
        const key = allKeys[i];
        const value = obj[key];
        str += `"${key}":`;
        if (typeof value === 'string') {
            str += `"${value}"`;
        } else {
            str += `${value}`;
        }
        if (i < allKeys.length - 1) {
            str += ',';
        }
    }
    str += '}';
    return str;
}
