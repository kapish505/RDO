import { keccak256, toHex } from 'viem';

// User Intent Input
export interface RuleIntent {
    name: string;
    description: string;
    allowedUsers: 'ANY' | 'LINK' | 'LIST'; // Who can use it?
    forbiddenActions: ('FORWARD' | 'COPY' | 'EXPORT')[]; // What should NEVER happen?
    expirySeconds: number; // When should it expire? (0 = never)
    violationAction: 'REFUSE' | 'BURN'; // What happens on violation?
}

// Canonical Rule Object (Machine Readable)
export interface CanonicalRules {
    v: number; // version
    allow_read: boolean;
    allow_forward: boolean;
    expiry: number;
    violation_action: string;
    // Deterministic sorting is key, so we use a flat structure with sorted keys
}

/**
 * Compiles high-level user intent into a canonical JSON object and its hash.
 */
export function compileRules(intent: RuleIntent): { json: string; hash: `0x${string}`; rules: CanonicalRules } {
    // 1. Map Intent to Canonical Rules
    const rules: CanonicalRules = {
        v: 1,
        allow_read: true, // Always true if they have access to the object?
        allow_forward: !intent.forbiddenActions.includes('FORWARD'),
        expiry: intent.expirySeconds > 0 ? Math.floor(Date.now() / 1000) + intent.expirySeconds : 0,
        violation_action: intent.violationAction
    };

    // 2. Canonical Stringify (Deterministic)
    // We manually order keys or use a library. Here we manually construct to allow simple deterministic behavior.
    // Or utilize JSON.stringify with specific property order.
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
