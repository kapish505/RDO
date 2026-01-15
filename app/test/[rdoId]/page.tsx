'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { decodeEventLog } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';
import RDORegistryABI from '@/artifacts/contracts/RDORegistry.sol/RDORegistry.json';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

type LogItem = {
    type: 'ALLOWED' | 'REFUSED';
    action: number;
    reason?: string;
    tx: string;
    timestamp: number;
};

export default function TestDashboard() {
    const { rdoId } = useParams();
    const router = useRouter();
    const [actionLog, setActionLog] = useState<LogItem[]>([]);

    // 1. Fetch RDO Data
    const { data: rdoData, isLoading: isContractLoading, refetch: refetchRDO } = useReadContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: RDORegistryABI.abi,
        functionName: 'rdos',
        args: [BigInt(rdoId as string)],
    });

    const parsedRDO = rdoData ? {
        id: (rdoData as any)[0],
        rdoType: (rdoData as any)[2], // 0=MSG, 1=FILE...
        rulesHash: (rdoData as any)[3],
        rules: (rdoData as any)[4],
        locked: (rdoData as any)[7],
    } : null;

    // 2. Transaction Hooks
    const { writeContract, data: txHash, isPending: isTxPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash: txHash });

    // 3. Handle Receipt & Decode Logs
    useEffect(() => {
        if (isSuccess && receipt && parsedRDO) {
            // Find our contract's logs
            const relevantLogs = receipt.logs.filter((l: any) => l.address.toLowerCase() === CONTRACT_ADDRESS?.toLowerCase());

            for (const log of relevantLogs) {
                try {
                    const decoded = decodeEventLog({
                        abi: RDORegistryABI.abi,
                        data: log.data,
                        topics: log.topics,
                    });

                    if (decoded.eventName === 'ActionAllowed') {
                        setActionLog((prev: LogItem[]) => [{
                            type: 'ALLOWED',
                            action: (decoded.args as any).actionType,
                            tx: receipt.transactionHash,
                            timestamp: Date.now()
                        }, ...prev]);
                    } else if (decoded.eventName === 'ActionRefused') {
                        setActionLog((prev: LogItem[]) => [{
                            type: 'REFUSED',
                            action: (decoded.args as any).actionType,
                            reason: (decoded.args as any).reason,
                            tx: receipt.transactionHash,
                            timestamp: Date.now()
                        }, ...prev]);
                    }
                    refetchRDO(); // Update RDO state (e.g. check if it locked)
                } catch (e) {
                    console.error("Failed to decode log", e);
                }
            }
        }
    }, [isSuccess, receipt, parsedRDO]);

    const handleAction = (actionType: number) => {
        if (!CONTRACT_ADDRESS || isTxPending || isConfirming) return;

        // requestAction(id, type, context)
        writeContract({
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi: RDORegistryABI.abi,
            functionName: 'requestAction',
            args: [
                BigInt(rdoId as string),
                actionType,
                "0x" // Empty context
            ],
        });
    };

    const actionLabels = { 0: 'READ', 1: 'FORWARD', 2: 'COPY', 3: 'DOWNLOAD' };
    const actionIcons = { 0: '👁️', 1: '↪️', 2: '📋', 3: '⬇️' };
    const typeLabels = ['Message', 'File', 'Link', 'Permission'];

    if (isContractLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <div className="text-white/40 font-mono text-sm animate-pulse">Loading Chain Data...</div>
                </div>
            </div>
        );
    }

    if (!parsedRDO || parsedRDO.id === BigInt(0)) {
        return (
            <div className="flex h-screen items-center justify-center flex-col gap-6">
                <div className="text-4xl">🤷‍♂️</div>
                <div className="text-xl font-serif">Object Not Found</div>
                <button onClick={() => router.push('/test')} className="text-white/50 hover:text-white underline">Return to Lab</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-6 max-w-6xl mx-auto">

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-end justify-between mb-12 border-b border-white/10 pb-6"
            >
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-0.5 rounded bg-white/10 text-xs font-mono text-white/60">TEST MODE</span>
                        <div className="h-px w-8 bg-white/20"></div>
                    </div>
                    <h1 className="text-4xl font-serif font-bold">Behavior Lab</h1>
                </div>
                <div className="text-right">
                    <div className="text-sm uppercase tracking-widest text-white/40 mb-1">Testing Object</div>
                    <div className="text-3xl font-mono font-bold">#{parsedRDO.id.toString()}</div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT COL: State & Actions */}
                <div className="lg:col-span-7 space-y-8">

                    {/* Object Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm relative overflow-hidden"
                    >
                        {/* Background Glow */}
                        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] -z-10 ${parsedRDO.locked ? 'bg-red-500/10' : 'bg-green-500/10'}`} />

                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-lg font-bold mb-1">{typeLabels[parsedRDO.rdoType]} Object</h3>
                                <p className="text-white/40 font-mono text-xs truncate max-w-[200px]">{parsedRDO.rulesHash}</p>
                            </div>
                            <div className={`px-4 py-1.5 rounded-full border text-sm font-bold flex items-center gap-2 ${parsedRDO.locked ? 'bg-red-500/20 border-red-500/50 text-red-200' : 'bg-green-500/20 border-green-500/50 text-green-200'}`}>
                                <span className={`w-2 h-2 rounded-full ${parsedRDO.locked ? 'bg-red-500' : 'bg-green-400'} animate-pulse`} />
                                {parsedRDO.locked ? 'LOCKED' : 'ACTIVE'}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                                <div className="text-xs uppercase text-white/30 mb-2">Requires Identity</div>
                                <div className="font-mono">{parsedRDO.rules.requireIdentity ? 'YES' : 'NO'}</div>
                            </div>
                            <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                                <div className="text-xs uppercase text-white/30 mb-2">Rules Config</div>
                                <div className="flex gap-2 text-xs flex-wrap">
                                    {parsedRDO.rules.forbidCopy && <span className="text-red-300 bg-red-900/20 px-1.5 py-0.5 rounded">NO_COPY</span>}
                                    {parsedRDO.rules.forbidForward && <span className="text-red-300 bg-red-900/20 px-1.5 py-0.5 rounded">NO_FWD</span>}
                                    {!parsedRDO.rules.forbidCopy && !parsedRDO.rules.forbidForward && !parsedRDO.rules.forbidExport && <span className="opacity-30">Standard</span>}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Action Grid */}
                    <div>
                        <h3 className="text-sm uppercase tracking-widest text-white/40 mb-4 pl-1">Trigger On-Chain Action</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {[0, 1, 2, 3].map((type) => (
                                <motion.button
                                    key={type}
                                    onClick={() => handleAction(type)}
                                    disabled={isTxPending || isConfirming}
                                    whileHover={!(isTxPending || isConfirming) ? { scale: 1.02, backgroundColor: "rgba(255,255,255,0.1)" } : {}}
                                    whileTap={!(isTxPending || isConfirming) ? { scale: 0.98 } : {}}
                                    className="relative group p-6 rounded-2xl bg-white/5 border border-white/10 text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative z-10 flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl mb-2">{(actionIcons as any)[type]}</div>
                                            <div className="font-bold text-lg">{(actionLabels as any)[type]}</div>
                                        </div>
                                        <div className="text-white/20 font-mono text-xs">ID: {type}</div>
                                    </div>
                                </motion.button>
                            ))}
                        </div>

                        {/* Loading State Overlay */}
                        <AnimatePresence>
                            {(isTxPending || isConfirming) && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-4 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-200 flex items-center justify-center gap-3"
                                >
                                    <div className="w-4 h-4 border-2 border-orange-200 border-t-transparent rounded-full animate-spin" />
                                    <span>{isTxPending ? 'Check your wallet...' : 'Verifying on chain...'}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </div>

                {/* RIGHT COL: Logs */}
                <div className="lg:col-span-5">
                    <div className="bg-black/40 border border-white/10 rounded-3xl p-6 h-full min-h-[500px] flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm uppercase tracking-widest text-white/40">Evaluation Log</h3>
                            <button onClick={() => refetchRDO()} className="text-white/30 hover:text-white text-xs hover:underline">Refresh State</button>
                        </div>

                        <div className="flex-grow space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                            <AnimatePresence initial={false}>
                                {actionLog.length === 0 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-white/20 text-center py-12 italic"
                                    >
                                        Waiting for interactions...
                                    </motion.div>
                                )}

                                {actionLog.map((log) => (
                                    <motion.div
                                        key={`${log.tx}-${log.timestamp}`}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`p-4 rounded-xl border-l-4 ${log.type === 'ALLOWED' ? 'bg-green-900/10 border-green-500' : 'bg-red-900/10 border-red-500'}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`font-bold text-sm ${log.type === 'ALLOWED' ? 'text-green-400' : 'text-red-400'}`}>
                                                {log.type === 'ALLOWED' ? 'ALLOWED' : 'REFUSED'}
                                            </span>
                                            <span className="text-xs text-white/30 font-mono">
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>

                                        <div className="mb-3">
                                            <div className="text-lg font-bold flex items-center gap-2">
                                                {log.type === 'ALLOWED' ? '✅' : '❌'} {(actionLabels as any)[log.action]}
                                            </div>
                                            {log.reason && (
                                                <div className="text-red-300/80 text-sm mt-1 bg-red-900/20 px-2 py-1 rounded inline-block">
                                                    Reason: "{log.reason}"
                                                </div>
                                            )}
                                        </div>

                                        <a
                                            href={`https://sepolia.etherscan.io/tx/${log.tx}`}
                                            target="_blank"
                                            className="text-xs text-white/30 hover:text-white underline flex items-center gap-1"
                                        >
                                            <span>🔗</span> {log.tx.slice(0, 12)}...
                                        </a>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
