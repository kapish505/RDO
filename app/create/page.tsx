'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { compileRules, RDOType, type RuleIntent } from '@/lib/rules';
import RDORegistryABI from '@/artifacts/contracts/RDORegistry.sol/RDORegistry.json';
import { uploadRDO } from '@/lib/ipfs';
import {
    type RDOMetadata
} from '@/lib/ipfs';
import { generateKey, exportKey, encryptBinary } from '@/lib/crypto';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

export default function CreateRDO() {
    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash });

    // Extract RDO ID from logs (RDOCreated event)
    // Event: RDOCreated(uint256 indexed rdoId, address indexed creator, ...)
    // Topic0: Hash, Topic1: rdoId, Topic2: creator
    const rdoId = receipt?.logs.find(l => l.address.toLowerCase() === CONTRACT_ADDRESS?.toLowerCase())?.topics[1]
        ? parseInt(receipt.logs.find(l => l.address.toLowerCase() === CONTRACT_ADDRESS?.toLowerCase())!.topics[1] as string, 16)
        : null;

    const [step, setStep] = useState(0); // 0=Type, 1=Payload, 2=Rules, 3=Review

    // Core State
    const [formData, setFormData] = useState<RuleIntent>({
        type: RDOType.MESSAGE,
        name: '',
        description: '',
        payload: { text: '' },
        allowedUsers: 'LINK',
        forbiddenActions: ['FORWARD'],
        expirySeconds: 3600,
        violationAction: 'REFUSE',
        maxUses: 0, // Unlimited
        requireIdentity: 'NEVER',
        whitelist: [] as string[]
    });

    // Helper for Payload Updates
    const updatePayload = (key: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            payload: { ...prev.payload, [key]: value }
        }));
    };

    const handleNext = () => {
        // Validation check
        if (step === 1) {
            if (!formData.name.trim()) {
                alert("Please name your object first.");
                return;
            }
            if (formData.type === RDOType.MESSAGE && !formData.payload.text?.trim()) {
                alert("Please enter a message content.");
                return;
            }
            if (formData.type === RDOType.FILE && !formData.payload.file) {
                alert("Please upload a file.");
                return;
            }
            if (formData.type === RDOType.LINK && !formData.payload.url?.trim()) {
                alert("Please enter a destination URL.");
                return;
            }
        }
        setStep(step + 1);
    };
    const handleBack = () => setStep(step - 1);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [encKey, setEncKey] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (isSubmitting || isPending) return;
        setIsSubmitting(true);
        try {
            // 1. Compile Rules
            const { hash: rulesHash, rules } = compileRules(formData);

            // 2. Prepare Payload & Key Generation
            const key = await generateKey();
            const keyJwk = await exportKey(key);
            setEncKey(keyJwk); // Store key for Success View

            let contentBuffer: ArrayBuffer;
            let imageURI = "ipfs://bafkreidmvnotre7527r4jjk3v3i5h3qaqy2q2f22cbe62g3aa22a4z3w7u";

            // Logic for different types
            if (formData.type === RDOType.FILE && formData.payload.file) {
                contentBuffer = await formData.payload.file.arrayBuffer();
            } else if (formData.type === RDOType.MESSAGE) {
                contentBuffer = new TextEncoder().encode(formData.payload.text || '').buffer;
            } else {
                const contentJson = JSON.stringify(formData.payload);
                contentBuffer = new TextEncoder().encode(contentJson).buffer;
            }

            // Encrypt Content
            const { iv, ciphertext } = await encryptBinary(key, contentBuffer);
            const encryptedBlob = new Blob([ciphertext]);

            // 3. Upload to IPFS via Pinata
            let metadataCID = "";
            try {
                metadataCID = await uploadRDO({
                    name: formData.name,
                    description: formData.description,
                    image: imageURI,
                    properties: {
                        rulesHash,
                        encryptedContentCID: "", // Filled by uploader
                        iv, // Store IV publicly
                        createdAt: Date.now(),
                    }
                }, encryptedBlob);
            } catch (e: any) {
                alert(`Upload Failed: ${e.message}`);
                setIsSubmitting(false);
                return;
            }

            // 4. Construct Compact Rules (Struct)
            // Must match Contract Struct Order:
            // forbidCopy, forbidForward, forbidExport, expiry, accessType, maxUses, lockOnViolation, requireIdentity
            const compactRules = {
                forbidCopy: formData.forbiddenActions.includes('COPY'),
                forbidForward: formData.forbiddenActions.includes('FORWARD'),
                forbidExport: formData.forbiddenActions.includes('EXPORT'),
                expiry: formData.expirySeconds > 0 ? Math.floor(Date.now() / 1000) + formData.expirySeconds : 0,
                accessType: mapAccessType(formData.allowedUsers),
                maxUses: formData.maxUses,
                lockOnViolation: formData.violationAction === 'LOCK',
                requireIdentity: formData.requireIdentity !== 'NEVER'
            };

            // 5. Write Contract
            const typeEnumMap = {
                'MESSAGE': 0, 'FILE': 1, 'LINK': 2, 'PERMISSION': 3
            };

            writeContract({
                address: CONTRACT_ADDRESS as `0x${string}`,
                abi: RDORegistryABI.abi,
                functionName: 'createRDO',
                args: [
                    rulesHash,
                    typeEnumMap[formData.type],
                    compactRules,
                    metadataCID,
                    formData.whitelist // Pass whitelist
                ],
            }, {
                onSettled: () => setIsSubmitting(false)
            });
        } catch (e) {
            console.error(e);
            setIsSubmitting(false);
        }
    };

    // Mapping helper
    const mapAccessType = (access: string) => {
        switch (access) {
            case 'ANY': return 0;
            case 'LINK': return 1;
            case 'CREATOR_ONLY': return 2;
            case 'SINGLE_USE': return 3; // Though maxUses handles this too
            case 'LIST': return 4;
            default: return 0;
        }
    };

    if (isSuccess && hash) {
        return <SuccessView hash={hash} rdoId={rdoId} encKey={encKey} />;
    } return (
        <div className="max-w-3xl mx-auto pt-20 pb-12 px-6">
            <Header step={step} />

            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="min-h-[400px]"
                >
                    {step === 0 && (
                        <TypeSelection
                            selected={formData.type}
                            onSelect={(t) => setFormData({ ...formData, type: t })}
                        />
                    )}

                    {step === 1 && (
                        <PayloadInput
                            type={formData.type}
                            data={formData}
                            onChange={setFormData}
                            onPayloadChange={updatePayload}
                        />
                    )}

                    {step === 2 && (
                        <RulesConfig formData={formData} setFormData={setFormData} />
                    )}

                    {step === 3 && (
                        <ReviewScreen formData={formData} />
                    )}
                </motion.div>
            </AnimatePresence>

            <Navigation
                step={step}
                onBack={handleBack}
                onNext={handleNext}
                onSubmit={handleSubmit}
                isPending={isPending || isConfirming || isSubmitting}
            />
        </div>
    );
}

// --- Subcomponents ---

function Header({ step }: { step: number }) {
    const titles = ["Select Type", "Content", "Define Rules", "Review"];
    return (
        <div className="mb-8">
            <h1 className="text-4xl font-serif font-bold mb-2">{titles[step]}</h1>
            <div className="flex gap-2 mt-4">
                {[0, 1, 2, 3].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? 'bg-rdo-accent' : 'bg-white/10'}`} />
                ))}
            </div>
        </div>
    );
}

function TypeSelection({ selected, onSelect }: { selected: RDOType, onSelect: (t: RDOType) => void }) {
    const types = [
        { id: RDOType.MESSAGE, icon: "💬", label: "Message", desc: "Secure text that refuses to be forwarded." },
        { id: RDOType.FILE, icon: "📄", label: "File", desc: "Documents/Images that delete themselves." },
        { id: RDOType.LINK, icon: "🔗", label: "Link", desc: "A URL that only opens for specific people." },
        { id: RDOType.PERMISSION, icon: "🔑", label: "Permission", desc: "A verifiable right to do something." },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {types.map(t => (
                <button
                    key={t.id}
                    onClick={() => onSelect(t.id)}
                    className={`p-6 rounded-2xl border text-left transition-all hover:scale-[1.02] ${selected === t.id
                        ? 'bg-rdo-accent border-rdo-accent text-white shadow-lg shadow-rdo-accent/20'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                >
                    <div className="text-3xl mb-2">{t.icon}</div>
                    <div className="font-bold text-lg">{t.label}</div>
                    <div className="text-sm opacity-70">{t.desc}</div>
                </button>
            ))}
        </div>
    );
}

function PayloadInput({ type, data, onChange, onPayloadChange }: any) {
    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium mb-2 text-white/80">Name your Object</label>
                <input
                    type="text"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:ring-2 focus:ring-rdo-accent outline-none"
                    value={data.name}
                    onChange={e => onChange({ ...data, name: e.target.value })}
                    placeholder="e.g. Q4 Financials"
                />
            </div>

            {/* Dynamic Inputs based on Type */}
            {type === RDOType.MESSAGE && (
                <div>
                    <label className="block text-sm font-medium mb-2 text-white/80">Secret Message</label>
                    <textarea
                        rows={6}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:ring-2 focus:ring-rdo-accent outline-none font-mono text-sm"
                        value={data.payload.text || ''}
                        onChange={e => onPayloadChange('text', e.target.value)}
                        placeholder="Type sensitive content..."
                    />
                </div>
            )}

            {type === RDOType.FILE && (
                <div>
                    <label className="block text-sm font-medium mb-2 text-white/80">Upload File</label>
                    <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:bg-white/5 transition-colors cursor-pointer relative">
                        <input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => {
                                if (e.target.files?.[0]) {
                                    onPayloadChange('file', e.target.files[0]);
                                    onPayloadChange('fileName', e.target.files[0].name);
                                }
                            }}
                        />
                        <div className="text-3xl mb-2">📂</div>
                        <p>{data.payload.fileName || "Click to select file"}</p>
                    </div>
                </div>
            )}

            {type === RDOType.LINK && (
                <div>
                    <label className="block text-sm font-medium mb-2 text-white/80">Destination URL</label>
                    <input
                        type="url"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:ring-2 focus:ring-rdo-accent outline-none font-mono"
                        value={data.payload.url || ''}
                        onChange={e => onPayloadChange('url', e.target.value)}
                        placeholder="https://secret-vault.com/resource/123"
                    />
                </div>
            )}

            {type === RDOType.PERMISSION && (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-white/80">Scope</label>
                        <input
                            type="text"
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none"
                            value={data.payload.scope || ''}
                            onChange={e => onPayloadChange('scope', e.target.value)}
                            placeholder="ADMIN_ACCESS"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2 text-white/80">Resource ID</label>
                        <input
                            type="text"
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none"
                            value={data.payload.resource || ''}
                            onChange={e => onPayloadChange('resource', e.target.value)}
                            placeholder="server-01"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function RulesConfig({ formData, setFormData }: any) {
    const toggleAction = (a: string) => {
        const current = formData.forbiddenActions;
        setFormData({
            ...formData,
            forbiddenActions: current.includes(a) ? current.filter((x: string) => x !== a) : [...current, a]
        });
    };

    return (
        <div className="space-y-8">
            {/* Section 1: Usage Limits */}
            <div>
                <h3 className="text-white/60 uppercase text-xs font-bold tracking-wider mb-4">Core Constraints</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm mb-2 block">Access Control</label>
                        <select
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none"
                            value={formData.allowedUsers}
                            onChange={e => setFormData({ ...formData, allowedUsers: e.target.value as any })}
                        >
                            <option value="ANY">Everyone (Public)</option>
                            <option value="LINK">Anyone with Link (Capability)</option>
                            <option value="LIST">Specific People (Whitelist)</option>
                            <option value="CREATOR">Only Me</option>
                        </select>

                        {formData.allowedUsers === 'LIST' && (
                            <div className="mt-4">
                                <label className="text-sm mb-2 block text-rdo-accent font-bold">Allowed Wallet Addresses</label>
                                <textarea
                                    rows={4}
                                    placeholder="0x123...&#10;0x456...&#10;(One per line or comma separated)"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none font-mono text-xs"
                                    value={formData.whitelist?.join('\n') || ''}
                                    onChange={e => {
                                        // Simple split by newline or comma
                                        const raw = e.target.value;
                                        const list = raw.split(/[\n,]/).map(s => s.trim()).filter(s => s.length > 0);
                                        setFormData({ ...formData, whitelist: list });
                                    }}
                                />
                                <div className="text-right text-xs text-white/30 mt-1">
                                    {formData.whitelist?.length || 0} addresses
                                </div>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="text-sm mb-2 block">Max Uses</label>
                        <select
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none"
                            value={formData.maxUses}
                            onChange={e => setFormData({ ...formData, maxUses: Number(e.target.value) })}
                        >
                            <option value={0}>Unlimited</option>
                            <option value={1}>One Time Only</option>
                            <option value={5}>5 Times</option>
                            <option value={10}>10 Times</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm mb-2 block">Expiry</label>
                        <select
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none"
                            value={formData.expirySeconds}
                            onChange={e => setFormData({ ...formData, expirySeconds: Number(e.target.value) })}
                        >
                            <option value={3600}>1 Hour</option>
                            <option value={86400}>24 Hours</option>
                            <option value={604800}>1 Week</option>
                            <option value={0}>Never</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Section 2: Forbidden Actions */}
            <div>
                <h3 className="text-white/60 uppercase text-xs font-bold tracking-wider mb-4">Forbidden Actions</h3>
                <div className="flex flex-wrap gap-3">
                    {['FORWARD', 'COPY', 'EXPORT'].map(action => (
                        <button
                            key={action}
                            onClick={() => toggleAction(action)}
                            className={`px-4 py-2 rounded-lg border text-sm transition-all ${formData.forbiddenActions.includes(action)
                                ? 'bg-red-500/20 border-red-500 text-red-200'
                                : 'border-white/10 hover:bg-white/5'
                                }`}
                        >
                            ⛔ {action}
                        </button>
                    ))}
                </div>
            </div>

            {/* Section 3: Consequences */}
            <div>
                <h3 className="text-white/60 uppercase text-xs font-bold tracking-wider mb-4">Check Enforcement</h3>
                <label className="flex items-center gap-3 p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition">
                    <input
                        type="checkbox"
                        checked={formData.violationAction === 'LOCK'}
                        onChange={e => setFormData({ ...formData, violationAction: e.target.checked ? 'LOCK' : 'REFUSE' })}
                        className="w-5 h-5 accent-rdo-accent"
                    />
                    <div>
                        <div className="font-bold">Permanent Lock on Violation</div>
                        <div className="text-xs text-white/60">If a user tries a forbidden action, the object destroys itself.</div>
                    </div>
                </label>
            </div>
        </div>
    );
}

function ReviewScreen({ formData }: any) {
    return (
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl font-mono text-sm space-y-4">
            <div className="flex justify-between border-b border-white/10 pb-4">
                <span className="text-white/40">Type</span>
                <span className="text-rdo-accent font-bold">{formData.type}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-white/40">Name</span>
                <span>{formData.name}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-white/40">Expires</span>
                <span>{formData.expirySeconds === 0 ? 'Never' : `In ${formData.expirySeconds / 3600} hours`}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-white/40">Max Uses</span>
                <span>{formData.maxUses === 0 ? 'Unlimited' : formData.maxUses}</span>
            </div>
            <div className="flex justify-between text-red-300">
                <span className="opacity-60">Forbidden</span>
                <span>{formData.forbiddenActions.join(', ')}</span>
            </div>

            {formData.violationAction === 'LOCK' && (
                <div className="p-3 bg-red-500/20 text-red-200 text-center rounded-lg mt-4">
                    ⚠️ Lock on Violation Enabled
                </div>
            )}
        </div>
    );
}

function Navigation({ step, onBack, onNext, onSubmit, isPending }: any) {
    return (
        <div className="flex justify-between mt-8 pt-8 border-t border-white/10">
            {step > 0 ? (
                <button onClick={onBack} className="text-white/60 hover:text-white px-6 py-2">Back</button>
            ) : <div />}

            {step < 3 ? (
                <button
                    onClick={onNext}
                    className="bg-white text-black font-bold rounded-full px-8 py-3 hover:scale-105 transition"
                >
                    Continue
                </button>
            ) : (
                <button
                    onClick={onSubmit}
                    disabled={isPending}
                    className="bg-rdo-accent text-white font-bold rounded-full px-8 py-3 hover:scale-105 transition disabled:opacity-50 disabled:cursor-wait"
                >
                    {isPending ? 'Minting...' : 'Mint RDO'}
                </button>
            )}
        </div>
    );
}

function SuccessView({ hash, rdoId, encKey }: { hash: string, rdoId: number | null, encKey: string | null }) {
    const magicLink = typeof window !== 'undefined' && rdoId && encKey
        ? `${window.location.origin}/rdo/${rdoId}#${btoa(encKey)}`
        : '';

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-24 h-24 bg-rdo-accent rounded-full flex items-center justify-center text-5xl mb-4 shadow-[0_0_30px_rgba(225,29,72,0.4)]"
            >
                ✓
            </motion.div>

            <div>
                <h2 className="text-4xl font-serif font-bold mb-2">Object Minted</h2>
                <p className="text-white/60">Your Refusable Digital Object is live on Sepolia.</p>
            </div>

            {rdoId && (
                <div className="py-2">
                    <div className="text-sm uppercase tracking-widest text-white/40 mb-1">Object ID</div>
                    <div className="text-5xl font-mono font-bold text-white">#{rdoId}</div>
                </div>
            )}

            {/* MAGIC LINK CARD */}
            {magicLink && (
                <div className="w-full max-w-md p-6 bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-rdo-accent/10 to-transparent opacity-50" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-rdo-accent mb-3 relative z-10">Secret Share Link</h3>
                    <p className="text-xs text-white/60 mb-4 relative z-10">
                        This link contains the <strong>decryption key</strong>. It is the ONLY way to view the content.
                    </p>

                    <div className="flex gap-2 relative z-10">
                        <input
                            readOnly
                            value={magicLink}
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white/60 outline-none"
                        />
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(magicLink);
                                alert("Link Copied!");
                            }}
                            className="bg-white text-black font-bold px-4 rounded-lg text-sm hover:scale-105 transition"
                        >
                            Copy
                        </button>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-4 w-full max-w-sm pt-4">
                <a
                    href={`https://sepolia.etherscan.io/tx/${hash}`}
                    target="_blank"
                    className="border border-white/10 rounded-xl px-8 py-3 hover:bg-white/5 transition font-mono text-sm text-white/60 flex items-center justify-center gap-2"
                >
                    <span>📜 Etherscan Receipt</span>
                </a>

                <a href="/" className="text-white/40 hover:text-white text-sm">Make Another</a>
            </div>
        </div>
    );
}
