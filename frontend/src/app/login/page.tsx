"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { motion } from "framer-motion";
import BentoLogo from "@/components/ui/BentoLogo";

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const handleLogin = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${location.origin}/auth/callback`,
            },
        });

        if (error) {
            console.error("Login failed:", error);
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-obsidian text-zinc_text selection:bg-safety_gold selection:text-obsidian">

            {/* Container: The "Monolith" */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative flex w-full max-w-[400px] flex-col items-center gap-8 rounded-2xl bg-zinc_dark p-12 shadow-2xl ring-1 ring-white/5"
            >

                {/* Header: Minimal & Industrial */}
                <div className="flex flex-col items-center gap-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10 shadow-2xl">
                        <BentoLogo size={40} />
                    </div>
                    <div className="text-center">
                        <h1 className="font-sans text-3xl font-bold tracking-tight text-white">
                            BENTO
                        </h1>
                        <p className="mt-2 text-base text-zinc-400 font-sans max-w-[280px]">
                            Enterprise-Grade Privacy Firewall for AI
                        </p>
                    </div>
                </div>

                {/* Action: "Safety Gold" Buton */}
                <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="group relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-safety_gold px-8 py-4 font-sans text-sm font-bold tracking-wide text-obsidian transition-all hover:bg-amber_neon hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-amber-500/10"
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-obsidian"></span>
                            CONNECTING...
                        </span>
                    ) : (
                        "CONNECT TERMINAL"
                    )}
                </button>

                {/* Footer: Version */}
                <div className="absolute bottom-4 text-[10px] text-zinc-700 font-mono">
                    SYSTEM_READY // v1.0.0
                </div>

            </motion.div>
        </div>
    );
}
