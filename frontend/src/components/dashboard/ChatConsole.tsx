"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
// import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import SendIcon from "@/components/ui/icons/SendIcon";
import ChatIcon from "@/components/ui/icons/ChatIcon";
import UsersIcon from "@/components/ui/icons/UsersIcon";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@/context/ChatContext";
// import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react"; // Removed Lucide usage
import ShieldCheckIcon from "@/components/ui/icons/ShieldCheckIcon";
import ShieldAlertIcon from "@/components/ui/icons/shield-alert-icon";
import ShieldXIcon from "@/components/ui/icons/shield-x-icon";
import XIcon from "@/components/ui/icons/x-icon";
import ReactMarkdown from 'react-markdown';

export default function ChatConsole() {
    const { messages, sendMessage, status, lastBlockedInput, clearBlockedInput } = useChat();
    const [input, setInput] = useState("");
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (scrollContainerRef.current) {
            const { scrollHeight, clientHeight } = scrollContainerRef.current;
            // Scroll to the very bottom (max scroll height) to reveal the padding
            scrollContainerRef.current.scrollTop = scrollHeight - clientHeight;
        }
    }, [messages, status]);

    useEffect(() => {
        if (status === "IDLE" && lastBlockedInput) {
            setInput(lastBlockedInput);
            clearBlockedInput();
        }
    }, [status, lastBlockedInput, clearBlockedInput]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || status !== "IDLE") return;

        const text = input;
        setInput("");
        await sendMessage(text); // Use default/active model from context
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as any);
        }
    };

    return (
        <div className="relative flex h-full w-full flex-col bg-obsidian">
            {/* Messages Area */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 scrollbar-hide">
                {messages.map((msg) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={msg.id}
                        className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {msg.sender === 'ai' && (
                            <div className="h-8 w-8 rounded-full bg-zinc_dark border border-white/5 flex items-center justify-center shrink-0">
                                <ChatIcon size={16} className="text-safety_gold" />
                            </div>
                        )}

                        <div className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl px-6 py-4 text-sm leading-relaxed shadow-lg ${msg.sender === 'user'
                            ? 'bg-zinc_dark text-white border border-white/5'
                            : 'text-zinc-300 bg-white/5'
                            }`}>
                            {/* Markdown Content */}
                            <div className="markdown-content">
                                <ReactMarkdown
                                    components={{
                                        p: (props: any) => <p className="mb-2 last:mb-0">{props.children}</p>,
                                        ul: (props: any) => <ul className="list-disc ml-4 mb-2 space-y-1">{props.children}</ul>,
                                        ol: (props: any) => <ol className="list-decimal ml-4 mb-2 space-y-1">{props.children}</ol>,
                                        li: (props: any) => <li>{props.children}</li>,
                                        strong: (props: any) => <span className="font-semibold text-safety_gold">{props.children}</span>,
                                        code: (props: any) => <code className="bg-black/30 px-1 py-0.5 rounded text-xs font-mono">{props.children}</code>
                                    }}
                                >
                                    {msg.text}
                                </ReactMarkdown>
                            </div>

                            {/* Scanning Animation for specific message */}
                            {msg.status === 'scanning' && (
                                <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                                    <motion.div
                                        className="h-full w-full bg-gradient-to-b from-transparent via-safety_gold/10 to-transparent"
                                        initial={{ top: "-100%" }}
                                        animate={{ top: "100%" }}
                                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                    />
                                    <div className="absolute bottom-2 right-4 text-[10px] text-safety_gold font-mono animate-pulse">
                                        SCANNING_PAYLOAD...
                                    </div>
                                </div>
                            )}

                            {/* Verified Badge with Receipt */}
                            {msg.status === 'verified' && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -bottom-2 -right-2 group/shield z-10 w-fit"
                                >
                                    <div className="bg-emerald-500/10 text-emerald-400 p-1.5 rounded-full border border-emerald-500/20 backdrop-blur-md cursor-help hover:bg-emerald-500/20 transition-all hover:scale-110">
                                        <ShieldCheckIcon size={14} />
                                    </div>

                                    {/* Verified Tooltip */}
                                    <div className="absolute bottom-full right-0 mb-2 w-48 p-3 rounded-lg border border-emerald-500/20 bg-zinc_dark/95 backdrop-blur-xl shadow-xl opacity-0 translate-y-2 group-hover/shield:opacity-100 group-hover/shield:translate-y-0 transition-all pointer-events-none z-[100]">
                                        <div className="flex flex-col gap-1.5">
                                            <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest border-b border-emerald-500/20 pb-1 mb-1">Passed Audit</p>
                                            <div className="flex justify-between text-[10px]">
                                                <span className="text-zinc-500">Scan Time</span>
                                                <span className="text-emerald-400 font-mono">{msg.receipt?.latency_ms || 0}ms</span>
                                            </div>
                                            <div className="flex justify-between text-[10px]">
                                                <span className="text-zinc-500">Scrubbed</span>
                                                <span className="text-zinc-300 font-mono">{msg.receipt?.scrubbed_count || 0} items</span>
                                            </div>
                                            <div className="flex justify-between text-[10px]">
                                                <span className="text-zinc-500">Engine</span>
                                                <span className="text-zinc-300 truncate max-w-[80px]">{msg.receipt?.engine || 'SENSE'}</span>
                                            </div>
                                            <p className="text-[10px] text-zinc-500 mt-1 italic leading-tight">
                                                Payload verified safe for processing.
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Warning Badge (Bypassed) */}
                            {msg.status === 'warning' && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -bottom-2 -right-2 group/shield z-10 w-fit"
                                >
                                    <div className="bg-amber-500/20 text-amber-400 p-1 rounded-full border border-amber-500/30 backdrop-blur-md shadow-[0_0_10px_rgba(251,191,36,0.2)]">
                                        <ShieldAlertIcon size={12} />
                                    </div>
                                    {/* Warning Tooltip */}
                                    <div className="absolute bottom-full right-0 mb-2 w-48 p-3 rounded-lg border border-amber-500/20 bg-zinc_dark/95 backdrop-blur-xl shadow-xl opacity-0 translate-y-2 group-hover/shield:opacity-100 group-hover/shield:translate-y-0 transition-all pointer-events-none z-[100]">
                                        <div className="flex flex-col gap-1.5">
                                            <p className="text-[10px] font-mono text-amber-400 uppercase tracking-widest border-b border-amber-500/20 pb-1 mb-1">Security Bypassed</p>
                                            <p className="text-[10px] text-zinc-400 leading-tight">
                                                Standard PII protection was overridden by user. AI response may contain sensitive data.
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Insecure Badge (Blocked) */}
                            {msg.status === 'insecure' && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -bottom-2 -right-2 group/shield z-10 w-fit"
                                >
                                    <div className="bg-red-500/20 text-red-400 p-1 rounded-full border border-red-500/30 backdrop-blur-md shadow-[0_0_10px_rgba(248,113,113,0.2)]">
                                        <ShieldXIcon size={12} />
                                    </div>
                                    {/* Blocked Tooltip */}
                                    <div className="absolute bottom-full right-0 mb-2 w-48 p-3 rounded-lg border border-red-500/20 bg-zinc_dark/95 backdrop-blur-xl shadow-xl opacity-0 translate-y-2 group-hover/shield:opacity-100 group-hover/shield:translate-y-0 transition-all pointer-events-none z-[100]">
                                        <div className="flex flex-col gap-1.5">
                                            <p className="text-[10px] font-mono text-red-400 uppercase tracking-widest border-b border-red-500/20 pb-1 mb-1">Transmission Blocked</p>
                                            <p className="text-[10px] text-zinc-400 leading-tight">
                                                Critical PII violation detected. Request blocked by policy firewall.
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Canceled Badge (Aborted) */}
                            {msg.status === 'canceled' && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -bottom-2 -right-2 group/shield z-10 w-fit"
                                >
                                    <div className="bg-zinc-500/20 text-zinc-400 p-1 rounded-full border border-zinc-500/30 backdrop-blur-md">
                                        <XIcon size={12} />
                                    </div>
                                    <div className="absolute bottom-full right-0 mb-2 w-48 p-3 rounded-lg border border-zinc-500/20 bg-zinc_dark/95 backdrop-blur-xl shadow-xl opacity-0 translate-y-2 group-hover/shield:opacity-100 group-hover/shield:translate-y-0 transition-all pointer-events-none z-[100]">
                                        <div className="flex flex-col gap-1.5">
                                            <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest border-b border-zinc-500/20 pb-1 mb-1">Intervention Aborted</p>
                                            <p className="text-[10px] text-zinc-500 leading-tight">
                                                User manually canceled the request during security intervention.
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {msg.sender === 'user' && (
                            <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                <UsersIcon size={16} className="text-white" />
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Input Area - Static Flow (Not Absolute) */}
            <div className="w-full px-4 pb-6 pt-2 z-20 bg-obsidian">
                <form onSubmit={handleSubmit} className="relative mx-auto max-w-3xl">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="relative group"
                    >
                        {/* Laser Scan Border Effect */}
                        {status === "SCANNING" && (
                            <>
                                <motion.div
                                    layoutId="laser-scan"
                                    className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-transparent via-safety_gold to-transparent opacity-50 blur-sm"
                                    animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                                {/* Horizontal Laser Line */}
                                <motion.div
                                    className="absolute inset-x-0 h-[2px] bg-amber_neon shadow-[0_0_10px_#FFB000] z-20 pointer-events-none"
                                    initial={{ top: "0%", opacity: 0 }}
                                    animate={{ top: ["0%", "100%", "0%"], opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                                />
                                {/* Glow Effect */}
                                <motion.div
                                    className="absolute inset-0 bg-safety_gold/5 z-0"
                                    animate={{ opacity: [0, 0.2, 0] }}
                                    transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                                />
                            </>
                        )}

                        <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={status === "INTERCEPTED" ? "Security Intervention Active..." : "Type a command or query..."}
                            disabled={status === "INTERCEPTED" || status === "SCANNING"}
                            className={`min-h-[56px] py-4 pl-6 pr-14 md:pr-16 rounded-2xl border bg-zinc_dark/80 backdrop-blur-xl text-zinc-200 placeholder:text-zinc-500 focus:ring-1 focus:ring-safety_gold/50 shadow-2xl transition-all ${status === "INTERCEPTED" ? "border-red-500/50 opacity-50 cursor-not-allowed" : "border-white/10 hover:bg-zinc_dark/90 hover:border-white/20"
                                }`}
                            maxHeight={200}
                        />
                        <div className="absolute right-2 top-2 bottom-2">
                            <Button
                                type="submit"
                                variant="primary"
                                className="h-full rounded-xl w-10 md:w-12 aspect-square p-0 bg-safety_gold/10 hover:bg-safety_gold/20 text-safety_gold border border-safety_gold/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!input.trim() || status !== "IDLE"}
                            >
                                {status === "SCANNING" ? (
                                    <div className="h-4 w-4 rounded-full border-2 border-safety_gold border-t-transparent animate-spin" />
                                ) : (
                                    <SendIcon size={18} />
                                )}
                            </Button>
                        </div>
                    </motion.div>
                </form>
            </div>
        </div >
    );
}
