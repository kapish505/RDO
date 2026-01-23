import { keccak256, toHex } from 'viem';

export enum RDOType { MESSAGE = "MESSAGE", FILE = "FILE", LINK = "LINK", PERMISSION = "PERMISSION" }

export interface RuleIntent {
    type: RDOType;
    name: string;
    description: string;
    payload: { text?: string; file?: any; url?: string; };
    allowedUsers: 'ANY' | 'LINK' | 'LIST' | 'CREATOR_ONLY' | 'SINGLE_USE';
    forbiddenActions: ('FORWARD' | 'COPY' | 'EXPORT')[];
    expirySeconds: number;
    violationAction: 'REFUSE' | 'LOCK';
    maxUses: number;
    requireIdentity: 'ALWAYS' | 'CONDITIONAL' | 'NEVER';
    whitelist?: string[];
}

export interface CanonicalRules {
    v: number;
    type: string;
    payload: any;
    rules: {
        access_scope: string;
        forbidden: string[];
        expiry: number;
        max_uses: number;
        lock_on_violation: boolean;
        require_identity: string;
    };
}

export function compileRules(intent: RuleIntent): { json: string; hash: `0x${string}`; rules: CanonicalRules } {
    const payloadForHash = { ...intent.payload };
    delete payloadForHash.file;

    const rules: CanonicalRules = {
        v: 1,
        type: intent.type,
        payload: payloadForHash,
        rules: {
            access_scope: intent.allowedUsers,
            forbidden: intent.forbiddenActions.sort(),
            expiry: intent.expirySeconds > 0 ? Math.floor(Date.now() / 1000) + intent.expirySeconds : 0,
            max_uses: intent.maxUses,
            lock_on_violation: intent.violationAction === 'LOCK',
            require_identity: intent.requireIdentity
        }
    };

    const canonicalString = stringifyDeterministic(rules);
    const hash = keccak256(toHex(canonicalString));

    return { json: canonicalString, hash, rules };
}

function stringifyDeterministic(obj: Record<string, any>): string {
    const allKeys = Object.keys(obj).sort();
    return '{' + allKeys.map(key => {
        const value = obj[key];
        const valStr = typeof value === 'string' ? `"${value}"` : `${value}`;
        return `"${key}":${valStr}`;
    }).join(',') + '}';
}
