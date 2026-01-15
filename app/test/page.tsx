'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TestLanding() {
    const [rdoId, setRdoId] = useState('');
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (rdoId.trim()) {
            router.push(`/test/${rdoId}`);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">

            {/* Background Ambience */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-md"
            >
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">
                            🛠️
                        </div>
                        <h1 className="text-3xl font-serif font-bold mb-2">Test RDO Behavior</h1>
                        <p className="text-white/50 text-sm">
                            Enter an Object ID to verify its on-chain rules and refusal logic.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs uppercase tracking-widest text-white/40 block mb-2 pl-1">
                                Object ID
                            </label>
                            <input
                                type="number"
                                value={rdoId}
                                onChange={(e) => setRdoId(e.target.value)}
                                placeholder="e.g. 42"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-4 text-center font-mono text-xl focus:outline-none focus:border-white/30 focus:bg-black/40 transition-all placeholder:text-white/10"
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!rdoId}
                            className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-white/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Start Testing
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-xs text-white/30">
                            Don't have an ID? <a href="/create" className="text-white hover:underline">Create one</a>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
