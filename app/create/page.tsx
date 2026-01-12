'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { compileRules, type RuleIntent } from '@/lib/rules';
import RDORegistryABI from '@/artifacts/contracts/RDORegistry.sol/RDORegistry.json';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
if (!CONTRACT_ADDRESS) {
    console.error("Missing NEXT_PUBLIC_CONTRACT_ADDRESS");
}

export default function CreateRDO() {
    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<RuleIntent>({
        name: '',
        description: '',
        allowedUsers: 'LINK',
        forbiddenActions: ['FORWARD'],
        expirySeconds: 3600, // 1 hour default
        violationAction: 'REFUSE',
    });

    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    const handleSubmit = async () => {
        // 1. Compile Rules
        const { hash: rulesHash } = compileRules(formData);

        // 2. Upload Metadata
        let metadataCID = "";
        try {
            // Create a blob for content. Ensure it's not empty as IPFS/Pinata might reject 0-byte blobs.
            const contentText = formData.description && formData.description.length > 0
                ? formData.description
                : "RDO Encrypted Content"; // Fallback to ensure non-zero size

            const contentBlob = new Blob([contentText], { type: 'text/plain' });

            metadataCID = await uploadRDO({
                name: formData.name,
                description: formData.description,
                image: "ipfs://bafkreidmvnotre7527r4jjk3v3i5h3qaqy2q2f22cbe62g3aa22a4z3w7u", // Default placeholder image
                properties: {
                    rulesHash,
                    encryptedContentCID: "", // Will be filled by uploadRDO
                    createdAt: Date.now(),
                }
            }, contentBlob);
        } catch (e: any) {
            console.error("IPFS Upload failed:", e);
            alert(`IPFS Upload Failed: ${e.message || e.toString()}\n\nPlease ensure 'NEXT_PUBLIC_PINATA_JWT' is set correctly in your Vercel Environment Variables.`);
            return;
        }

        // 3. Write Contract
        writeContract({
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi: RDORegistryABI.abi,
            functionName: 'createRDO',
            args: [rulesHash, metadataCID],
        });
    };

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] text-center space-y-6">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-4xl"
                >
                    ✓
                </motion.div>
                <h2 className="text-4xl font-serif font-bold">RDO Created</h2>
                <p className="text-white/60">Your object is now live on chain.</p>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10 font-mono text-xs break-all max-w-lg">
                    Tx: {hash}
                </div>
                <a href="/" className="text-rdo-accent hover:underline">Return Home</a>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto pt-24 pb-12 px-6">
            <div className="mb-12">
                <h1 className="text-4xl font-serif font-bold mb-2">Define Your Object</h1>
                <p className="text-white/60">Step {step} of 3: {step === 1 ? 'Identity' : step === 2 ? 'Rules' : 'Review'}</p>
            </div>

            <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
            >
                {step === 1 && (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-white/80">What is this object?</label>
                            <input
                                type="text"
                                placeholder="e.g. Secret Memos"
                                className="w-full bg-rdo-800 border border-white/10 rounded-xl p-4 focus:ring-2 focus:ring-rdo-accent outline-none transition-all"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-white/80">Description</label>
                            <textarea
                                rows={4}
                                placeholder="What is the intent?"
                                className="w-full bg-rdo-800 border border-white/10 rounded-xl p-4 focus:ring-2 focus:ring-rdo-accent outline-none transition-all"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-white/80">What should NEVER happen?</label>
                            <div className="flex gap-4">
                                {['FORWARD', 'COPY', 'EXPORT'].map((action) => (
                                    <button
                                        key={action}
                                        onClick={() => {
                                            const current = formData.forbiddenActions;
                                            const included = current.includes(action as 'FORWARD' | 'COPY' | 'EXPORT');
                                            setFormData({
                                                ...formData,
                                                forbiddenActions: included
                                                    ? current.filter(a => a !== action)
                                                    : [...current, action as 'FORWARD' | 'COPY' | 'EXPORT']
                                            });
                                        }}
                                        className={`px-6 py-3 rounded-full border transition-all ${formData.forbiddenActions.includes(action as 'FORWARD' | 'COPY' | 'EXPORT')
                                            ? 'bg-rdo-accent border-rdo-accent text-white'
                                            : 'bg-transparent border-white/20 text-white/60 hover:border-white/40'
                                            }`}
                                    >
                                        {action}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-white/80">When should it expire?</label>
                            <select
                                className="w-full bg-rdo-800 border border-white/10 rounded-xl p-4 focus:ring-2 focus:ring-rdo-accent outline-none appearance-none"
                                value={formData.expirySeconds}
                                onChange={(e) => setFormData({ ...formData, expirySeconds: Number(e.target.value) })}
                            >
                                <option value={300}>5 Minutes</option>
                                <option value={3600}>1 Hour</option>
                                <option value={86400}>24 Hours</option>
                                <option value={0}>Never</option>
                            </select>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="bg-rdo-800/50 p-6 rounded-2xl border border-white/10 space-y-4">
                        <h3 className="font-serif text-xl font-bold">Review Intent</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="text-white/40">Name</div>
                            <div>{formData.name}</div>
                            <div className="text-white/40">Forbidden</div>
                            <div>{formData.forbiddenActions.join(', ')}</div>
                            <div className="text-white/40">Expiry</div>
                            <div>{formData.expirySeconds === 0 ? 'Never' : `${formData.expirySeconds / 60} mins`}</div>
                        </div>
                        <p className="text-xs text-white/30 pt-4">
                            By creating this RDO, you are minting immutable rules to the Ethereum blockchain.
                            The object will autonomously refuse any action violating these rules.
                        </p>
                    </div>
                )}

                <div className="flex justify-between pt-8">
                    {step > 1 ? (
                        <button
                            onClick={handleBack}
                            className="px-8 py-3 rounded-full text-white/60 hover:text-white transition-colors"
                        >
                            Back
                        </button>
                    ) : <div />}

                    {step < 3 ? (
                        <button
                            onClick={handleNext}
                            className="px-8 py-3 rounded-full bg-white text-rdo-900 font-bold hover:bg-white/90 transition-colors"
                        >
                            Continue
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isPending || isConfirming}
                            className="px-8 py-3 rounded-full bg-rdo-accent text-white font-bold hover:bg-rdo-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPending ? 'Confirm in Wallet...' : isConfirming ? 'Minting...' : 'Mint RDO'}
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
