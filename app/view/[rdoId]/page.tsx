'use client';

import { useReadContract } from 'wagmi';
import RDORegistryABI from '@/artifacts/contracts/RDORegistry.sol/RDORegistry.json';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { RDOType } from '@/lib/rules'; // Ensure this enum matches contract 0,1,2,3

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

export default function ViewRDO() {
    const { rdoId } = useParams();
    const [metadata, setMetadata] = useState<any>(null);

    // 1. Fetch RDO Data from Contract
    const { data: rdoData, isLoading: isContractLoading } = useReadContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: RDORegistryABI.abi,
        functionName: 'rdos',
        args: [BigInt(rdoId as string)],
    });

    // Parse Contract Data
    // Return: [id, creator, rdoType, rulesHash, Rules(struct), metadataCID, createdAt, locked]
    // Note: Wagmi/Viem might return object or array depending on config. Assuming Array for unnamed outputs or Object for named. 
    // Usually standard `rdos` mapping returns array of values.
    // Let's assume array based on common behavior: 
    // 0:id, 1:creator, 2:type, 3:hash, 4:rules, 5:cid, 6:created, 7:locked

    // Safety check
    const rdo = rdoData ? {
        id: (rdoData as any)[0],
        creator: (rdoData as any)[1],
        type: (rdoData as any)[2],
        rulesHash: (rdoData as any)[3],
        rules: (rdoData as any)[4],
        metadataCID: (rdoData as any)[5],
        createdAt: (rdoData as any)[6],
        locked: (rdoData as any)[7],
    } : null;

    // 2. Fetch IPFS Metadata
    useEffect(() => {
        if (rdo?.metadataCID) {
            fetch(`https://gateway.pinata.cloud/ipfs/${rdo.metadataCID}`)
                .then(res => res.json())
                .then(data => setMetadata(data))
                .catch(err => console.error("IPFS Fetch Error:", err));
        }
    }, [rdo?.metadataCID]);

    if (isContractLoading) return <div className="flex h-screen items-center justify-center text-white/40 animate-pulse">Loading Object Data...</div>;
    if (!rdo || rdo.id === BigInt(0)) return <div className="flex h-screen items-center justify-center text-red-400">Object Not Found</div>;

    // Helper for Rules
    const rules = rdo.rules; // Struct: forbidCopy, forbidForward, forbidExport, expiry, accessType, maxUses, lockOnViolation, requireIdentity

    const isExpired = rules.expiry > 0 && Date.now() / 1000 > Number(rules.expiry);
    const status = rdo.locked ? 'LOCKED' : isExpired ? 'EXPIRED' : 'ACTIVE';
    const statusColor = rdo.locked ? 'text-red-500 bg-red-500/10' : isExpired ? 'text-orange-500 bg-orange-500/10' : 'text-green-400 bg-green-400/10';

    const typeLabels = ['Message', 'File', 'Link', 'Permission'];
    const typeIcons = ['💬', '📄', '🔗', '🔑'];

    return (
        <div className="max-w-4xl mx-auto pt-20 pb-12 px-6">

            {/* Header / Identity */}
            <div className="flex items-start justify-between mb-12">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <span className="text-4xl">{typeIcons[rdo.type]}</span>
                        <h1 className="text-4xl font-serif font-bold">{metadata?.name || 'Untitled Object'}</h1>
                    </div>
                    <p className="text-white/60 max-w-xl">{metadata?.description || "No description provided."}</p>
                </div>
                <div className="text-right">
                    <div className="text-sm uppercase tracking-widest text-white/40 mb-1">Object ID</div>
                    <div className="text-4xl font-mono font-bold">#{rdo.id.toString()}</div>
                </div>
            </div>

            {/* Status Card */}
            <div className={`p-6 rounded-2xl border ${rdo.locked ? 'border-red-500/30' : 'border-white/10'} bg-white/5 mb-8 flex items-center justify-between`}>
                <div>
                    <div className="text-sm text-white/40 mb-1">Current State</div>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-mono text-sm font-bold ${statusColor}`}>
                        <span className={`w-2 h-2 rounded-full ${rdo.locked ? 'bg-red-500' : 'bg-green-400'} animate-pulse`} />
                        {status}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-sm text-white/40 mb-1">Creator</div>
                    <div className="font-mono text-sm text-white/80">{rdo.creator}</div>
                </div>
            </div>

            {/* Rules Grid */}
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span>🛡️</span> Governing Rules
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                {/* Rule 1: Forbidden Actions */}
                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                    <h4 className="text-sm text-white/40 uppercase tracking-wider mb-4">Forbidden Actions</h4>
                    <div className="flex flex-wrap gap-2">
                        {(!rules.forbidCopy && !rules.forbidForward && !rules.forbidExport) ? (
                            <span className="text-white/40 italic">None</span>
                        ) : (
                            <>
                                {rules.forbidCopy && <Badge label="No Copy" />}
                                {rules.forbidForward && <Badge label="No Forward" />}
                                {rules.forbidExport && <Badge label="No Export" />}
                            </>
                        )}
                    </div>
                </div>

                {/* Rule 2: Expiry */}
                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                    <h4 className="text-sm text-white/40 uppercase tracking-wider mb-4">Expiration</h4>
                    <div className="text-lg">
                        {Number(rules.expiry) === 0 ? (
                            <span className="text-green-400">Never Expires</span>
                        ) : (
                            <span>{new Date(Number(rules.expiry) * 1000).toLocaleString()}</span>
                        )}
                    </div>
                </div>

                {/* Rule 3: Consequences */}
                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                    <h4 className="text-sm text-white/40 uppercase tracking-wider mb-4">Violation Consequence</h4>
                    {rules.lockOnViolation ? (
                        <div className="text-red-400 font-bold flex items-center gap-2">
                            🔒 Permanent Lock
                        </div>
                    ) : (
                        <div className="text-white/60">Refusal Only (Standard)</div>
                    )}
                </div>

                {/* Rule 4: Usage Limit */}
                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                    <h4 className="text-sm text-white/40 uppercase tracking-wider mb-4">Usage Limits</h4>
                    <div className="text-lg">
                        {Number(rules.maxUses) === 0 ? "Unlimited" : `${Number(rules.maxUses)} Uses Remaining`}
                    </div>
                </div>
            </div>

            {/* Technical Footer */}
            <div className="border-t border-white/10 pt-8 mt-8">
                <h4 className="text-sm font-bold opacity-50 mb-4">Technical Proofs</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-mono text-xs text-white/40 break-all">
                    <div>
                        <div className="mb-2">Rules Hash (Immutable Intent)</div>
                        <div className="p-3 bg-black/30 rounded">{rdo.rulesHash}</div>
                    </div>
                    <div>
                        <div className="mb-2">Metadata CID (IPFS)</div>
                        <div className="p-3 bg-black/30 rounded">
                            <a href={`https://gateway.pinata.cloud/ipfs/${rdo.metadataCID}`} target="_blank" className="hover:text-rdo-accent hover:underline">
                                {rdo.metadataCID}
                            </a>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}

function Badge({ label }: { label: string }) {
    return (
        <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-300 rounded text-sm font-bold">
            {label}
        </span>
    );
}
