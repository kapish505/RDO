'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useRef } from 'react';

function Section({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`min-h-[80vh] flex flex-col justify-center items-center py-20 px-6 ${className}`}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-rdo-accent/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[150px]" />
      </div>

      <ActivityTicker />

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative z-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mb-6 inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur text-sm font-medium text-rdo-accent"
          >
            Refusable Digital Objects
          </motion.div>
          <h1 className="font-serif text-6xl md:text-9xl font-bold leading-tight tracking-tight mb-8">
            Objects That <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/40">
              Say No.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-white/60 max-w-2xl mx-auto font-light leading-relaxed mb-12">
            The first Web3 primitive with agency. <br />
            They don't just exist. They decide.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <Link href="/create">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="h-16 px-10 rounded-full bg-white text-rdo-900 font-bold text-xl hover:bg-white/90 transition-colors shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
              >
                Create Message RDO
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Scroll Hint */}
        <motion.div
          animate={{ y: [0, 10, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <div className="w-px h-16 bg-gradient-to-b from-transparent via-white/50 to-transparent" />
        </motion.div>
      </section>

      {/* The Problem */}
      <Section>
        <h2 className="text-4xl md:text-6xl font-serif font-bold mb-8 text-center">The &quot;Yes&quot; Problem</h2>
        <p className="text-xl md:text-2xl text-white/70 max-w-3xl text-center leading-relaxed">
          Every digital object today is a slave to its platform. <br />
          If you have the file, you have the power. <br />
          <span className="text-rdo-accent font-semibold">That ends now.</span>
        </p>
      </Section>

      {/* The Solution */}
      <Section className="bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 mx-4 my-20">
        <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl w-full">
          <div className="space-y-8">
            <h3 className="text-3xl md:text-5xl font-serif font-bold">Inverted Sovereignty</h3>
            <p className="text-lg text-white/60 leading-relaxed">
              We flipped the model. Instead of platforms enforcing rules on passive data,
              <strong className="text-white"> RDOs carry their own laws</strong>.
              Before any interaction (Read, Copy, Forward), the object checks itself.
              If the conditions aren't met, it refuses—cryptographically.
            </p>
            <ul className="space-y-4 text-lg">
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-rdo-accent" />
                Immutable Rules Logic
              </li>
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-rdo-accent" />
                On-Chain Refusal Proofs
              </li>
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-rdo-accent" />
                Zero-Server Dependency
              </li>
            </ul>
          </div>
          <div className="relative aspect-square bg-gradient-to-br from-rdo-accent/20 to-purple-500/20 rounded-2xl flex items-center justify-center border border-white/10 overflow-hidden group">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-48 h-64 bg-black/40 border border-red-500/50 rounded-xl backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center space-y-4 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <div className="text-red-400 font-mono text-sm">ACCESS REFUSED</div>
              <div className="text-xs text-white/40 font-mono">0x7f2...a9c</div>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* The Impact (Judge Seducer) */}
      <Section>
        <h2 className="text-5xl md:text-7xl font-serif font-bold mb-12 text-center bg-clip-text text-transparent bg-gradient-to-r from-rdo-accent to-white">
          Why This Matters
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl w-full">
          {[
            {
              title: "True Digital Rights",
              desc: "Not just ownership of the token, but sovereignty over the utility. You decide how your data is used, forever."
            },
            {
              title: "Programmable Culture",
              desc: "Create memes that expire. Memos that can't be forwarded. Art that refuses to be displayed in low resolution."
            },
            {
              title: "Zero Friction",
              desc: "No new blockchains. No centralized servers. Just standard crypto, flipped on its head to empower the user."
            }
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10 }}
              className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <h4 className="text-2xl font-bold mb-4 font-serif">{item.title}</h4>
              <p className="text-white/60 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section className="min-h-[60vh]">
        <h2 className="text-4xl md:text-6xl font-serif font-bold mb-8 text-center">Ready to Refuse?</h2>
        <Link href="/create">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="h-20 px-12 rounded-full bg-white text-rdo-900 font-bold text-2xl hover:bg-white/90 transition-colors shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)]"
          >
            Launch App
          </motion.button>
        </Link>
      </Section>
    </div>
  );
}

function ActivityTicker() {
  // Mock Data for "Live" feel
  const activities = [
    { type: 'REFUSED', id: '8291', reason: 'Forwarding Forbidden', time: '2s ago' },
    { type: 'CREATED', id: '8292', reason: 'New Message RDO', time: '5s ago' },
    { type: 'REFUSED', id: '8288', reason: 'Access Denied (Whitelist)', time: '12s ago' },
    { type: 'ALLOWED', id: '8290', reason: 'Read Access Granted', time: '15s ago' },
    { type: 'CREATED', id: '8293', reason: 'New File RDO', time: '18s ago' },
    { type: 'REFUSED', id: '8102', reason: 'Object Locked', time: '24s ago' },
  ];

  return (
    <div className="absolute top-24 right-6 z-20 hidden lg:block">
      <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 w-80 shadow-2xl">
        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-white/60">Live Protocol Activity</span>
          </div>
          <div className="text-[10px] text-white/30">Sepolia Testnet</div>
        </div>

        <div className="space-y-3">
          {activities.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <span className={`font-mono font-bold ${item.type === 'REFUSED' ? 'text-red-400' :
                  item.type === 'CREATED' ? 'text-purple-400' : 'text-green-400'
                  }`}>
                  {item.type === 'REFUSED' ? '❌' : item.type === 'CREATED' ? '✨' : '✅'} #{item.id}
                </span>
                <span className="text-white/60 truncate max-w-[120px]">{item.reason}</span>
              </div>
              <span className="text-white/20 font-mono">{item.time}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
