'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { decodeEventLog } from 'viem';
import RDORegistryABI from '@/artifacts/contracts/RDORegistry.sol/RDORegistry.json';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

export default function TestDashboard() {
    const { rdoId } = useParams();
    const [actionLog, setActionLog] = useState<any[]>([]);

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
            const relevantLogs = receipt.logs.filter(l => l.address.toLowerCase() === CONTRACT_ADDRESS?.toLowerCase());

            for (const log of relevantLogs) {
                try {
                    const decoded = decodeEventLog({
                        abi: RDORegistryABI.abi,
                        data: log.data,
                        topics: log.topics,
                    });

                    if (decoded.eventName === 'ActionAllowed') {
                        setActionLog(prev => [{
                            type: 'ALLOWED',
                            action: (decoded.args as any).actionType,
                            tx: receipt.transactionHash,
                            timestamp: Date.now()
                        }, ...prev]);
                    } else if (decoded.eventName === 'ActionRefused') {
                        setActionLog(prev => [{
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
        if (!CONTRACT_ADDRESS) return;

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

    if (isContractLoading) return <div className="p-8 text-white/50">Loading RDO Contract Data...</div>;
    if (!parsedRDO || parsedRDO.id === BigInt(0)) return <div className="p-8 text-red-400">RDO Not Found on Chain</div>;

    const actionLabels = { 0: 'READ', 1: 'FORWARD', 2: 'COPY', 3: 'DOWNLOAD' };
    const typeLabels = ['Message', 'File', 'Link', 'Permission'];

    return (
        <div className="min-h-screen bg-black text-white font-mono p-8 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold mb-8 border-b border-white/20 pb-4">
                🛠️ RDO Behavior Lab: Object #{parsedRDO.id.toString()}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Panel 1: Object State */}
                <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
                    <h2 className="text-sm uppercase tracking-widest text-white/40 mb-4">On-Chain State</h2>
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="opacity-50">Locked Status</span>
                            <span className={`font-bold ${parsedRDO.locked ? 'text-red-500' : 'text-green-400'}`}>
                                {parsedRDO.locked ? '🔒 LOCKED' : '✅ ACTIVE'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="opacity-50">Type</span>
                            <span>{typeLabels[parsedRDO.rdoType] || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="opacity-50">Requires Identity</span>
                            <span>{parsedRDO.rules.requireIdentity ? 'YES' : 'NO'}</span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <h3 className="text-xs uppercase text-white/30 mb-2">Forbidden Actions</h3>
                            <div className="flex gap-2 text-xs">
                                {parsedRDO.rules.forbidCopy && <span className="bg-red-900/40 text-red-200 px-2 py-1 rounded">NO COPY</span>}
                                {parsedRDO.rules.forbidForward && <span className="bg-red-900/40 text-red-200 px-2 py-1 rounded">NO FORWARD</span>}
                                {parsedRDO.rules.forbidExport && <span className="bg-red-900/40 text-red-200 px-2 py-1 rounded">NO EXPORT</span>}
                                {!parsedRDO.rules.forbidCopy && !parsedRDO.rules.forbidForward && !parsedRDO.rules.forbidExport && <span className="opacity-30">None</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Panel 2: Action Trigger */}
                <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
                    <h2 className="text-sm uppercase tracking-widest text-white/40 mb-4">Trigger Action</h2>
                    <p className="text-xs text-white/40 mb-6">
                        Clicking sends a real transaction to `requestAction()`.
                        The UI does NOT block anything. The Contract decides.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        {[0, 1, 2, 3].map(type => (
                            <button
                                key={type}
                                onClick={() => handleAction(type)}
                                disabled={isTxPending || isConfirming}
                                className="border border-white/20 hover:bg-white/10 active:scale-95 transition-all p-4 rounded text-left disabled:opacity-30"
                            >
                                <div className="font-bold mb-1">{(actionLabels as any)[type]}</div>
                                <div className="text-xs opacity-40">Action Type {type}</div>
                            </button>
                        ))}
                    </div>

                    {(isTxPending || isConfirming) && (
                        <div className="mt-4 text-center text-xs text-yellow-400 animate-pulse">
                            {isTxPending ? 'Waiting for Wallet...' : 'Confirming on Chain...'}
                        </div>
                    )}
                </div>
            </div>

            {/* Logs Area */}
            <div className="mt-8">
                <h2 className="text-sm uppercase tracking-widest text-white/40 mb-4">Event Log (Local Session)</h2>
                <div className="space-y-2">
                    {actionLog.length === 0 && <div className="text-white/20 italic text-sm">No actions tested yet.</div>}

                    {actionLog.map((log, i) => (
                        <div key={i} className={`p-4 rounded border-l-4 ${log.type === 'ALLOWED' ? 'bg-green-900/10 border-green-500' : 'bg-red-900/10 border-red-500'} flex justify-between items-center`}>
                            <div>
                                <div className={`font-bold ${log.type === 'ALLOWED' ? 'text-green-400' : 'text-red-400'}`}>
                                    {log.type === 'ALLOWED' ? '✅ ACTION ALLOWED' : '❌ ACTION REFUSED'}
                                </div>
                                <div className="text-sm mt-1">
                                    Action: {(actionLabels as any)[log.action] || log.action}
                                    {log.reason && <span className="text-red-300 ml-2">Reason: "{log.reason}"</span>}
                                </div>
                            </div>
                            <a
                                href={`https://sepolia.etherscan.io/tx/${log.tx}`}
                                target="_blank"
                                className="text-xs text-white/40 hover:text-white underline"
                            >
                                {log.tx.slice(0, 10)}...
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
