'use client';

import { motion } from 'framer-motion';

export default function About() {
    return (
        <div className="max-w-4xl mx-auto pt-24 pb-20 px-6 space-y-20">

            {/* Header */}
            <section className="text-center space-y-6">
                <h1 className="text-5xl md:text-7xl font-serif font-bold">The Manifesto</h1>
                <p className="text-xl text-white/60 font-light max-w-2xl mx-auto">
                    Why we built Refusable Digital Objects, and why they matter for the future of the internet.
                </p>
            </section>

            {/* Core Concept */}
            <section className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                    <h2 className="text-3xl font-serif font-bold">The Core Problem</h2>
                    <p className="text-white/70 leading-relaxed">
                        Today, digital objects (files, images, messages) are passive. They rely on platforms to protect them.
                        Once copied, they are defenseless. If a platform decides to censor them, they die. If an admin wants to peek, they can.
                    </p>
                    <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <h3 className="font-bold text-red-400 mb-2">The Current State</h3>
                        <ul className="list-disc list-inside space-y-2 text-sm text-white/60">
                            <li>Platforms own permissions, not users.</li>
                            <li>Data can be copied without consequence.</li>
                            <li>Rules are mutable by admins.</li>
                        </ul>
                    </div>
                </div>
                <div className="space-y-6">
                    <h2 className="text-3xl font-serif font-bold text-white">The RDO Solution</h2>
                    <p className="text-white/70 leading-relaxed">
                        RDOs are active. They carry their logic with them. They decide who can read them and how they can be used.
                    </p>
                    <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-xl">
                        <h3 className="font-bold text-green-400 mb-2">The RDO State</h3>
                        <ul className="list-disc list-inside space-y-2 text-sm text-white/60">
                            <li>Objects enforce their own rules.</li>
                            <li>Violations emit cryptographic refusal proofs.</li>
                            <li>No admins. No backdoors.</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* 5 Laws */}
            <section className="space-y-8">
                <h2 className="text-3xl font-serif font-bold text-center">The 5 Laws of RDOs</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    {[
                        { title: "Self-Sovereignty", desc: "The object defines its permissions, not the platform." },
                        { title: "Immutability", desc: "Once minted, the rules cannot be changed by anyone." },
                        { title: "Cryptographic Refusal", desc: "Objects don't just fail; they prove they refused you." },
                        { title: "No Overrides", desc: "No admin, creator, or server can bypass the rules." },
                        { title: "Stateful History", desc: "Every access attempt is recorded on chain." }
                    ].map((law, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ y: -5 }}
                            className="p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                        >
                            <div className="text-4xl font-serif font-bold text-rdo-accent mb-4">{i + 1}</div>
                            <h3 className="font-bold text-lg mb-2">{law.title}</h3>
                            <p className="text-sm text-white/60">{law.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Architecture */}
            <section className="space-y-8 p-8 bg-white/5 border border-white/10 rounded-2xl">
                <h2 className="text-3xl font-serif font-bold">Architecture</h2>
                <div className="grid md:grid-cols-2 gap-8 text-sm">
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg">On-Chain (Ethereum Sepolia)</h3>
                        <ul className="list-disc list-inside space-y-2 text-white/60">
                            <li>RDORegistry.sol: The immutable ledger.</li>
                            <li>Rules Hash: keccak256(canonical_json).</li>
                            <li>Event Log: ActionRefused(rdoId, actor, reason).</li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg">Off-Chain (IPFS & Client)</h3>
                        <ul className="list-disc list-inside space-y-2 text-white/60">
                            <li>Metadata stored on IPFS via nft.storage.</li>
                            <li>Client-side encryption (AES-GCM).</li>
                            <li>Capability Tokens (JWS) for access sharing.</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Demo Script */}
            <section className="space-y-6 pt-12 border-t border-white/10">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-serif font-bold">Judge Demo Script</h2>
                    <button className="px-4 py-2 bg-white text-rdo-900 rounded-full font-bold text-sm">Download PDF</button>
                </div>
                <div className="bg-black/50 p-6 rounded-xl font-mono text-sm text-white/70 overflow-x-auto whitespace-pre-wrap border border-white/10">
                    # RDO Judging Demo{"\n\n"}
                    1. Create an RDO{"\n"}
                    - Go to /create{"\n"}
                    - Name: "Top Secret"{"\n"}
                    - Forbidden: "FORWARD"{"\n"}
                    - Expiry: 1 Hour{"\n"}
                    - Click "Mint" - Confirm Wallet{"\n"}
                    - Wait for "RDO Created" success screen.{"\n\n"}
                    2. Verify Creation{"\n"}
                    - Click transaction hash link to see on Etherscan.{"\n"}
                    - Note the emitted RDOCreated event.{"\n\n"}
                    3. Attempt Violation{"\n"}
                    - Go to /view/[id] (Use the ID from creation){"\n"}
                    - Click "Forward" button.{"\n"}
                    - OBSERVE: The Refusal Animation triggers.{"\n"}
                    - OBSERVE: "Access Refused" overlay appears with reason "Forwarding is not allowed".{"\n\n"}
                    4. Verify Refusal Proof{"\n"}
                    - Copy the TX hash from the refusal overlay.{"\n"}
                    - Check Etherscan.{"\n"}
                    - Verify "ActionRefused" event was emitted.
                </div>
            </section>

        </div>
    );
}
