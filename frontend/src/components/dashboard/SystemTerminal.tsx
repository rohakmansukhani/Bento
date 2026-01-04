"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { useSystem } from "@/context/SystemContext";

export default function SystemTerminal() {
    const { terminalLogs } = useSystem();
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [terminalLogs]);

    return (
        <div className="h-full w-full bg-black/80 rounded-2xl border border-white/10 p-4 md:p-6 font-mono text-xs text-green-500/80 overflow-hidden flex flex-col shadow-inner">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-4">
                <span className="text-zinc-500">root@bento-system:~</span>
                <div className="flex gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500/50" />
                    <div className="h-2 w-2 rounded-full bg-yellow-500/50" />
                    <div className="h-2 w-2 rounded-full bg-green-500/50" />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hide space-y-1">
                {terminalLogs.map((log: string, i: number) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="break-all"
                    >
                        {log}
                    </motion.div>
                ))}
                <div ref={bottomRef} />
            </div>
            <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-2">
                <span className="text-zinc-600">$</span>
                <input
                    type="text"
                    disabled
                    className="bg-transparent border-none outline-none text-zinc-600 w-full cursor-not-allowed italic font-mono text-xs"
                    value="Interactive Mode Coming Soon (Read Only)"
                />
            </div>
        </div>
    );
}
