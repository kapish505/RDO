'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { decodeEventLog } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchFromIPFS } from '@/lib/ipfs';
import RDORegistryABI from '@/artifacts/contracts/RDORegistry.sol/RDORegistry.json';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

type LogItem = {
    type: 'ALLOWED' | 'REFUSED';
    action: number;
    reason?: string;
    tx: string;
    timestamp: number;
    payload?: any;
};

// State Machine for Action Execution
type ExecutionState = 'IDLE' | 'SIGNING' | 'MINING' | 'FETCHING' | 'RESULT';

export default function TestDashboard() {
    const { rdoId } = useParams();
    const router = useRouter();
    const [actionLog, setActionLog] = useState<LogItem[]>([]);

    // Execution State
    const [execState, setExecState] = useState<ExecutionState>('IDLE');
    const [currentActionType, setCurrentActionType] = useState<number | null>(null);
    const [modalData, setModalData] = useState<{ title: string, content: string, type: 'TEXT' | 'LINK' | 'SHARE' | 'IMAGE' } | null>(null);

    // 1. Fetch RDO Data (including Metadata CID at index 5)
    // RDO Struct: id, creator, type, rulesHash, rules, metadataCID, createdAt, locked
    const { data: rdoData, isLoading: isContractLoading, refetch: refetchRDO } = useReadContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: RDORegistryABI.abi,
        functionName: 'rdos',
        args: [BigInt(rdoId as string)],
    });

    const parsedRDO = rdoData ? {
        id: (rdoData as any)[0],
        creator: (rdoData as any)[1],
        rdoType: (rdoData as any)[2],
        rulesHash: (rdoData as any)[3],
        rules: {
            ...((rdoData as any)[4]),
            accessType: (rdoData as any)[4].accessType // Ensure accessType is accessible
        },
        metadataCID: (rdoData as any)[5],
        locked: (rdoData as any)[7],
    } : null;

    // 2. Transaction Hooks
    const { writeContract, data: txHash, isPending: isTxPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash: txHash });

    // Sync Wallet State for timeline
    useEffect(() => {
        if (isTxPending) setExecState('SIGNING');
        if (isConfirming) setExecState('MINING');
    }, [isTxPending, isConfirming]);

    // 3. Handle Receipt & Decode Logs & Trigger Real Actions
    useEffect(() => {
        if (isSuccess && receipt) {
            const currentTxHash = receipt.transactionHash;
            // Find our contract's logs
            const relevantLogs = receipt.logs.filter((l: any) => l.address.toLowerCase() === CONTRACT_ADDRESS?.toLowerCase());

            let executed = false;

            for (const log of relevantLogs) {
                try {
                    const decoded = decodeEventLog({
                        abi: RDORegistryABI.abi,
                        data: log.data,
                        topics: log.topics,
                    });

                    // Update Logs
                    setActionLog(prev => {
                        if (prev.some(p => p.tx === currentTxHash)) return prev;

                        let newItem: LogItem = {
                            type: 'REFUSED',
                            action: (decoded.args as any).actionType,
                            tx: currentTxHash,
                            timestamp: Date.now()
                        };

                        if (decoded.eventName === 'ActionAllowed') {
                            newItem.type = 'ALLOWED';
                        } else if (decoded.eventName === 'ActionRefused') {
                            newItem.reason = (decoded.args as any).reason;
                        }

                        return [newItem, ...prev];
                    });

                    if (!executed) {
                        executed = true;
                        if (decoded.eventName === 'ActionAllowed') {
                            handleRealExecution((decoded.args as any).actionType);
                        } else {
                            setExecState('RESULT'); // Refused
                        }
                    }

                    refetchRDO();
                } catch (e) {
                    console.error("Failed to decode log", e);
                }
            }
        }
    }, [isSuccess, receipt]);

    // --- REAL EXECUTION LOGIC ---
    const handleRealExecution = async (actionType: number) => {
        if (!parsedRDO?.metadataCID) return;
        setExecState('FETCHING');

        try {
            // 1. Fetch Metadata first to get EncryptedContentCID
            const metaRes = await fetchFromIPFS(parsedRDO.metadataCID);
            const metadata = await metaRes.json();
            const contentCID = metadata.properties?.encryptedContentCID;

            if (!contentCID && actionType !== 1) { // Forward doesn't strictly need content
                throw new Error("No content CID found in metadata");
            }

            // 2. Perform Action Specific Logic
            if (actionType === 0) { // READ
                const contentRes = await fetchFromIPFS(contentCID);

                if (parsedRDO.rdoType === 1) { // FILE
                    const blob = await contentRes.blob();
                    if (blob.type.startsWith('image/')) {
                        const url = URL.createObjectURL(blob);
                        setModalData({ title: 'Decrypted Content', content: url, type: 'IMAGE' });
                    } else {
                        // Fallback for non-image files (e.g. PDF) -> Show generic or text
                        const text = "Binary File Content (Download to view)";
                        setModalData({ title: 'Decrypted Content', content: text, type: 'TEXT' });
                    }
                } else {
                    const text = await contentRes.text();
                    setModalData({ title: 'Decrypted Content', content: text, type: 'TEXT' });
                }
            }
            else if (actionType === 1) { // FORWARD
                setModalData({
                    title: 'Forward RDO',
                    content: `https://rdo.protocol/view/${parsedRDO.id}`,
                    type: 'SHARE'
                });
            }
            else if (actionType === 2) { // COPY
                const contentRes = await fetchFromIPFS(contentCID);
                const blob = await contentRes.blob();
                const text = await blob.text();
                navigator.clipboard.writeText(text);
                setModalData({ title: 'Success', content: 'Content copied to clipboard!', type: 'TEXT' });
            }
            else if (actionType === 3) { // DOWNLOAD
                const contentRes = await fetchFromIPFS(contentCID);
                const blob = await contentRes.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `rdo-${parsedRDO.id}-content`; // Use name from metadata in real app
                document.body.appendChild(a);
                a.click();
                a.remove();
                setModalData({ title: 'Download Started', content: 'File is downloading...', type: 'TEXT' });
            }

            setExecState('RESULT');
        } catch (e: any) {
            console.error("Execution failed", e);
            setExecState('RESULT');
        }
    };


    const handleTrigger = (actionType: number) => {
        if (!CONTRACT_ADDRESS || isTxPending || isConfirming) return;
        setCurrentActionType(actionType);
        setExecState('SIGNING');

        writeContract({
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi: RDORegistryABI.abi,
            functionName: 'requestAction',
            args: [
                BigInt(rdoId as string),
                actionType,
                "0x"
            ],
        }, {
            onError: () => setExecState('IDLE')
        });
    };

    const actionLabels = { 0: 'READ', 1: 'FORWARD', 2: 'COPY', 3: 'DOWNLOAD' };
    const actionIcons = { 0: '👁️', 1: '↪️', 2: '📋', 3: '⬇️' };
    const typeLabels = ['Message', 'File', 'Link', 'Permission'];

    // --- RENDER HELPERS ---

    if (isContractLoading) return <LoadingScreen message="Loading Chain Data..." />;
    if (!parsedRDO || parsedRDO.id === BigInt(0)) return <ErrorScreen message="Object Not Found" />;

    return (
        <div className="min-h-screen pt-24 pb-12 px-6 max-w-6xl mx-auto relative">

            {/* Header */}
            <Header rdoId={parsedRDO.id.toString()} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT COL */}
                <div className="lg:col-span-7 space-y-8">
                    <ObjectStateCard rdo={parsedRDO} typeLabels={typeLabels} />

                    {/* Execution Timeline Overlay */}
                    <div className="relative">
                        <ActionGrid
                            disabled={execState !== 'IDLE'}
                            onTrigger={handleTrigger}
                            icons={actionIcons}
                            labels={actionLabels}
                        />

                        {execState !== 'IDLE' && execState !== 'RESULT' && (
                            <TimelineStatus state={execState} />
                        )}
                    </div>
                </div>

                {/* RIGHT COL: Logs */}
                <div className="lg:col-span-5">
                    <LogPanel logs={actionLog} actionLabels={actionLabels} onRefresh={() => refetchRDO()} />
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {modalData && (
                    <Modal
                        data={modalData}
                        onClose={() => { setModalData(null); setExecState('IDLE'); }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// --- SUBCOMPONENTS ---

function LoadingScreen({ message }: { message: string }) {
    return (
        <div className="flex h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <div className="text-white/40 font-mono text-sm animate-pulse">{message}</div>
            </div>
        </div>
    );
}

function ErrorScreen({ message }: { message: string }) {
    const router = useRouter();
    return (
        <div className="flex h-screen items-center justify-center flex-col gap-6">
            <div className="text-4xl">🤷‍♂️</div>
            <div className="text-xl font-serif">{message}</div>
            <button onClick={() => router.push('/test')} className="text-white/50 hover:text-white underline">Return to Lab</button>
        </div>
    );
}

function Header({ rdoId }: { rdoId: string }) {
    return (
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
                <div className="text-3xl font-mono font-bold">#{rdoId}</div>
            </div>
        </motion.div>
    );
}

function ObjectStateCard({ rdo, typeLabels }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm relative overflow-hidden"
        >
            {/* Background Glow */}
            <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] -z-10 ${rdo.locked ? 'bg-red-500/10' : 'bg-green-500/10'}`} />

            <div className="flex justify-between items-start mb-8">
                <div>
                    <h3 className="text-lg font-bold mb-1">{typeLabels[rdo.rdoType]} Object</h3>
                    <p className="text-white/40 font-mono text-xs truncate max-w-[200px]">{rdo.rulesHash}</p>
                </div>
                <div className={`px-4 py-1.5 rounded-full border text-sm font-bold flex items-center gap-2 ${rdo.locked ? 'bg-red-500/20 border-red-500/50 text-red-200' : 'bg-green-500/20 border-green-500/50 text-green-200'}`}>
                    <span className={`w-2 h-2 rounded-full ${rdo.locked ? 'bg-red-500' : 'bg-green-400'} animate-pulse`} />
                    {rdo.locked ? 'LOCKED' : 'ACTIVE'}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                    <div className="text-xs uppercase text-white/30 mb-2">Access Control</div>
                    <div className="font-mono">
                        {rdo.rules.requireIdentity ? 'ID_REQ ' : ''}
                        {rdo.rules.accessType === 4 ? <span className="text-yellow-400">WHITELIST</span> : 'PUBLIC'}
                    </div>
                </div>
                <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                    <div className="text-xs uppercase text-white/30 mb-2">Rules Config</div>
                    <div className="flex gap-2 text-xs flex-wrap">
                        {rdo.rules.forbidCopy && <span className="text-red-300 bg-red-900/20 px-1.5 py-0.5 rounded">NO_COPY</span>}
                        {rdo.rules.forbidForward && <span className="text-red-300 bg-red-900/20 px-1.5 py-0.5 rounded">NO_FWD</span>}
                        {rdo.rules.forbidExport && <span className="text-red-300 bg-red-900/20 px-1.5 py-0.5 rounded">NO_EXPORT</span>}
                        {!rdo.rules.forbidCopy && !rdo.rules.forbidForward && !rdo.rules.forbidExport && <span className="opacity-30">Standard</span>}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function ActionGrid({ disabled, onTrigger, icons, labels }: any) {
    return (
        <div>
            <h3 className="text-sm uppercase tracking-widest text-white/40 mb-4 pl-1">Trigger On-Chain Action</h3>
            <div className={`grid grid-cols-2 gap-4 transition-opacity ${disabled ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                {[0, 1, 2, 3].map((type) => (
                    <motion.button
                        key={type}
                        onClick={() => onTrigger(type)}
                        whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.1)" }}
                        whileTap={{ scale: 0.98 }}
                        className="relative group p-6 rounded-2xl bg-white/5 border border-white/10 text-left transition-all overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <div className="text-2xl mb-2">{(icons as any)[type]}</div>
                                <div className="font-bold text-lg">{(labels as any)[type]}</div>
                            </div>
                            <div className="text-white/20 font-mono text-xs">ID: {type}</div>
                        </div>
                    </motion.button>
                ))}
            </div>
        </div>
    );
}

function TimelineStatus({ state }: { state: ExecutionState }) {
    return (
        <div className="absolute inset-0 flex items-center justify-center z-20">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rdo-900/90 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 min-w-[300px]"
            >
                <div className="relative w-16 h-16">
                    <svg className="animate-spin w-full h-full text-white/20" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xl">
                        {state === 'SIGNING' ? '✍️' : state === 'MINING' ? '⛏️' : '📥'}
                    </div>
                </div>
                <div className="text-center">
                    <div className="font-bold text-xl mb-1">
                        {state === 'SIGNING' && 'Waiting for Signature'}
                        {state === 'MINING' && 'Mining Transaction...'}
                        {state === 'FETCHING' && 'Executing Action...'}
                    </div>
                    <div className="text-white/50 text-sm">
                        {state === 'SIGNING' && 'Please confirm in your wallet'}
                        {state === 'MINING' && 'Verifying on Sepolia'}
                        {state === 'FETCHING' && 'Fetching & Decrypting Payload'}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function LogPanel({ logs, actionLabels, onRefresh }: any) {
    return (
        <div className="bg-black/40 border border-white/10 rounded-3xl p-6 h-full min-h-[500px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm uppercase tracking-widest text-white/40">Evaluation Log</h3>
                <button onClick={onRefresh} className="text-white/30 hover:text-white text-xs hover:underline">Refresh State</button>
            </div>

            <div className="flex-grow space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                <AnimatePresence initial={false}>
                    {logs.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-white/20 text-center py-12 italic"
                        >
                            Waiting for interactions...
                        </motion.div>
                    )}

                    {logs.map((log: LogItem) => (
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
                                    <motion.div
                                        initial={{ x: 0 }}
                                        animate={{ x: [0, -5, 5, -5, 5, 0] }}
                                        transition={{ duration: 0.4 }}
                                        className="text-red-300/80 text-sm mt-1 bg-red-900/20 px-2 py-1 rounded inline-block"
                                    >
                                        Reason: "{log.reason}"
                                    </motion.div>
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
    );
}

function Modal({ data, onClose }: { data: any, onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-rdo-900 border border-white/20 p-8 rounded-3xl w-full max-w-lg shadow-2xl"
            >
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                        {data.type === 'TEXT' ? '🔓' : data.type === 'SHARE' ? '🔗' : '🎉'}
                    </div>
                    <h2 className="text-2xl font-serif font-bold">{data.title}</h2>
                </div>

                <div className="bg-black/50 rounded-xl p-4 font-mono text-sm break-all max-h-[400px] overflow-y-auto flex justify-center">
                    {data.type === 'IMAGE' ? (
                        <img src={data.content} alt="Decrypted RDO" className="max-w-full rounded-lg" />
                    ) : (
                        data.content
                    )}
                </div>

                <button
                    onClick={onClose}
                    className="w-full mt-6 bg-white text-black font-bold py-3 rounded-xl hover:bg-white/90 transition-colors"
                >
                    Close
                </button>
            </motion.div>
        </div>
    );
}
