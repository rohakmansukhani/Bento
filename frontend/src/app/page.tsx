"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Check } from "lucide-react";
import BentoLogo from "@/components/ui/BentoLogo";
import ShieldIcon from "@/components/ui/icons/ShieldIcon";

export default function LandingPage() {
    const [scanComplete, setScanComplete] = useState(false);

    // Loop the animation
    useEffect(() => {
        if (scanComplete) {
            const timer = setTimeout(() => {
                setScanComplete(false);
            }, 3000); // Wait 3 seconds in success state before restarting
            return () => clearTimeout(timer);
        }
    }, [scanComplete]);

    return (
        <main className="flex min-h-screen w-full flex-col bg-obsidian text-zinc_text selection:bg-safety_gold selection:text-obsidian">
            {/* Header */}
            <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-obsidian/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                    <BentoLogo withText size={24} />

                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                            Log In
                        </Link>
                        <Link
                            href="/login"
                            className="rounded-full bg-white px-5 py-2 text-sm font-bold text-obsidian transition-transform hover:scale-105 hover:bg-safety_gold"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative flex flex-1 flex-col items-center justify-center px-6 pt-32 text-center">
                {/* Ambient Glow */}
                <div className="absolute top-1/2 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-safety_gold/5 blur-[100px]" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex flex-col items-center max-w-4xl"
                >
                    <div className="mb-6 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
                        <span className="flex h-2 w-2 rounded-full bg-safety_gold animate-pulse"></span>
                        <span className="text-xs font-mono font-medium tracking-wide text-safety_gold">BENTO ENGINE LIVE</span>
                    </div>

                    <h1 className="mb-8 font-sans text-5xl font-bold tracking-tight text-white sm:text-7xl md:text-8xl">
                        Privacy is not a
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-safety_gold to-amber_neon">
                            checkbox.
                        </span>
                    </h1>

                    <p className="mb-12 max-w-2xl text-lg text-zinc-400 sm:text-xl">
                        The enterprise-grade privacy firewall for your LLM interactions.
                        Redact sensitive data, enforce compliance, and audit every prompt
                        in real-time.
                    </p>

                    <div className="flex flex-col gap-4 sm:flex-row">
                        <Link
                            href="/login"
                            className="flex h-12 items-center justify-center rounded-full bg-safety_gold px-8 text-base font-bold text-obsidian hover:bg-amber_neon transition-all hover:scale-105"
                        >
                            Deploy Shield
                        </Link>
                    </div>
                </motion.div>

                {/* Feature Grid Preview */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="mt-24 w-full max-w-6xl rounded-t-3xl border border-white/10 bg-zinc_dark/50 p-2 backdrop-blur-sm ring-1 ring-white/5"
                >
                    <div className="rounded-2xl border border-white/5 bg-obsidian p-8 aspect-[16/9] flex items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,192,51,0.03),transparent_50%)]" />

                        {/* Interaction Mockup */}
                        <div className="flex flex-col items-center gap-6 h-[140px] justify-center">
                            <AnimatePresence mode="wait">
                                {!scanComplete ? (
                                    <motion.div
                                        key="scanning"
                                        exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                                        transition={{ duration: 0.5 }}
                                        className="flex flex-col items-center gap-6"
                                    >
                                        <ShieldIcon size={64} className="text-safety_gold opacity-80" />
                                        <div className="flex flex-col gap-2 w-64">
                                            <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden border border-white/5">
                                                <motion.div
                                                    className="h-full bg-safety_gold shadow-[0_0_15px_rgba(255,193,7,0.5)]"
                                                    initial={{ width: "0%" }}
                                                    animate={{ width: "100%" }}
                                                    transition={{ duration: 2.5, ease: "easeInOut" }}
                                                    onAnimationComplete={() => setTimeout(() => setScanComplete(true), 500)}
                                                />
                                            </div>
                                            <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                                                <span className="animate-pulse">SCANNING_PII...</span>
                                                <ScanProgress />
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="secure"
                                        initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 260,
                                            damping: 20,
                                            duration: 0.5
                                        }}
                                        className="flex flex-col items-center gap-4"
                                    >
                                        <div className="relative flex items-center justify-center">
                                            <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl animate-pulse" />
                                            <div className="relative rounded-full bg-emerald-500/10 p-5 ring-1 ring-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                                                <Check className="h-10 w-10 text-emerald-500" strokeWidth={3} />
                                            </div>
                                        </div>
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="text-sm font-bold tracking-[0.2em] text-emerald-500 font-mono"
                                        >
                                            REDACTION COMPLETE
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            </section>
        </main>
    );
}

function ScanProgress() {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const duration = 2500; // Match the bar duration
        const startTime = performance.now();
        let animationFrameId: number;

        const update = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Cubic ease in/out to match framer motion's default easeInOut fairly well
            const eased = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            setCount(Math.floor(eased * 100));

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(update);
            }
        };

        animationFrameId = requestAnimationFrame(update);

        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    return <span>{count}%</span>;
}
