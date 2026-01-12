'use client';

import { useWriteContract, useWatchContractEvent } from 'wagmi';
import RDORegistryABI from '@/artifacts/contracts/RDORegistry.sol/RDORegistry.json';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0xeA50BfF374633155c071f8a6c4dB56923854c026';

export default function ViewRDO() {
    const { rdoId } = useParams();
    // params unused


    const [refusal, setRefusal] = useState<{ reason: string; tx: string } | null>(null);

    const { writeContract, isPending } = useWriteContract();

    // Watch for Refusal
    useWatchContractEvent({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: RDORegistryABI.abi,
        eventName: 'ActionRefused',
        onLogs(logs: any[]) { // Relaxed typing for MVP
            const log = logs[0] as any;
            // Check if this refusal is for us? rdoId match?
            // user logic needed
            const rdoIdArg = log.args.rdoId; // BigInt
            if (rdoIdArg.toString() === rdoId) {
                setRefusal({
                    reason: log.args.reason,
                    tx: log.transactionHash
                });
            }
        },
    });

    // Watch for Allowed
    useWatchContractEvent({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: RDORegistryABI.abi,
        eventName: 'ActionAllowed',
        onLogs(logs: unknown[]) {
            const log = logs[0] as { args: { rdoId: bigint;[key: string]: any } };
            if (log.args.rdoId.toString() === rdoId) {
                console.log("Allowed");
            }
        },
    });

    const handleAction = (action: string) => {
        setRefusal(null);

        // For MVP, we pass dummy rule params or we would need to fetch them from IPFS/Chain
        // We assume default restrictiveness for the demo to TRIGGER refusal.
        // If we want to demonstrate REFUSAL, we pass parameters that we know will fail?
        // OR we pass the CORRECT parameters but the ACTION is forbidden.
        // The contract logic says: "If action violates rules -> MUST REFUSE".
        // Logic: if action == FORWARD && allowForward == false -> REFUSE.

        const expiry = Math.floor(Date.now() / 1000) + 3600; // Future
        const allowForward = false; // Intentionally restrictive to demonstrate refusal

        writeContract({
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi: RDORegistryABI.abi,
            functionName: 'requestAction',
            args: [
                BigInt(rdoId as string),
                action,
                "0x", // context
                expiry,
                allowForward
            ],
        });
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6 relative">

            {/* Refusal Overlay */}
            <AnimatePresence>
                {refusal && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-md"
                    >
                        <div className="bg-rdo-900 border border-red-500/50 p-8 rounded-2xl max-w-md text-center shadow-2xl shadow-red-500/20">
                            <motion.div
                                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                                transition={{ duration: 0.5 }}
                                className="text-6xl mb-4"
                            >
                                🚫
                            </motion.div>
                            <h2 className="text-3xl font-serif font-bold text-red-500 mb-2">Access Refused</h2>
                            <p className="text-white/60 mb-6 font-mono">
                                {refusal.reason}
                            </p>
                            <div className="text-xs text-white/30 font-mono break-all bg-black/40 p-3 rounded mb-6">
                                Proof: {refusal.tx}
                            </div>
                            <button
                                onClick={() => setRefusal(null)}
                                className="px-6 py-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors"
                            >
                                Acknowledge
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-2xl w-full space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-serif font-bold">Confidential Memo #{rdoId}</h1>
                    <p className="text-white/40">Secured by Ethereum & IPFS</p>
                </div>

                <div className="bg-rdo-800/50 rounded-2xl border border-white/10 p-8 min-h-[300px] flex flex-col justify-between relative overflow-hidden">
                    {/* Content simulation */}
                    <div className="font-serif text-lg leading-relaxed text-white/90 filter blur-sm select-none">
                        This content is encrypted. You can request to READ data but you cannot FORWARD it.
                        The object decides if your capability token is valid.
                        [Redacted Content Block]
                    </div>

                    {/* Dynamic Status */}
                    <div className="absolute top-4 right-4">
                        <div className="flex items-center gap-2 text-xs font-mono text-green-400 bg-green-400/10 px-3 py-1 rounded-full">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            ACTIVE
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-white/10">
                        <button
                            onClick={() => handleAction("READ")}
                            disabled={isPending}
                            className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10 text-left group"
                        >
                            <div className="text-sm text-white/60 mb-1 group-hover:text-white">Action</div>
                            <div className="font-bold flex items-center justify-between">
                                Read Content
                                <span>👁️</span>
                            </div>
                        </button>

                        <button
                            onClick={() => handleAction("FORWARD")}
                            disabled={isPending}
                            className="p-4 rounded-xl bg-white/5 hover:bg-red-500/10 transition-colors border border-white/10 hover:border-red-500/30 text-left group"
                        >
                            <div className="text-sm text-white/60 mb-1 group-hover:text-red-400">Restricted</div>
                            <div className="font-bold flex items-center justify-between group-hover:text-red-400">
                                Forward Copy
                                <span>↗️</span>
                            </div>
                        </button>
                    </div>
                </div>

                {isPending && (
                    <div className="text-center text-sm text-white/40 animate-pulse">
                        Requesting permission from object...
                    </div>
                )}
            </div>
        </div>
    );
}
