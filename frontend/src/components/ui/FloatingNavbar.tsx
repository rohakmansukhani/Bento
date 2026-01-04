"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import ShieldIcon from "@/components/ui/icons/ShieldIcon";
import HistoryIcon from "@/components/ui/icons/HistoryIcon";
import { FileJson, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useChat } from "@/context/ChatContext";
import { useSystem } from "@/context/SystemContext";

import { LayoutDashboard, Plus } from "lucide-react";
import MessageCircleIcon from "@/components/ui/icons/MessageCircleIcon";
import TerminalIcon from "@/components/ui/icons/TerminalIcon";

interface FloatingNavbarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onNewChat: () => void;
}

export default function FloatingNavbar({ activeTab, setActiveTab, onNewChat }: FloatingNavbarProps) {
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.refresh();
    };

    const navItems = [
        { id: "overview", label: "OVERVIEW", icon: LayoutDashboard },
        { id: "chat", label: "CHAT", icon: MessageCircleIcon },
        { id: "terminal", label: "TERMINAL", icon: TerminalIcon },
        { id: "history", label: "HISTORY", icon: HistoryIcon },
        { id: "policies", label: "POLICIES", icon: FileJson },
    ];

    const { safetyScore } = useSystem();
    const [displayScore, setDisplayScore] = useState(safetyScore || 100);
    const [scoreFlash, setScoreFlash] = useState<'green' | 'red' | null>(null);

    // Animate score changes
    useEffect(() => {
        if (safetyScore !== displayScore) {
            const isIncrease = safetyScore > displayScore;
            setScoreFlash(isIncrease ? 'green' : 'red');

            const diff = safetyScore - displayScore;
            const steps = Math.min(Math.abs(diff), 20);
            const stepDuration = 30;

            let currentStep = 0;
            const interval = setInterval(() => {
                currentStep++;
                const progress = currentStep / steps;
                const newScore = Math.round(displayScore + (diff * progress));
                setDisplayScore(newScore);

                if (currentStep >= steps) {
                    clearInterval(interval);
                    setDisplayScore(safetyScore);
                    setTimeout(() => setScoreFlash(null), 500);
                }
            }, stepDuration);

            return () => clearInterval(interval);
        }
    }, [safetyScore, displayScore]);

    const score = displayScore || 100;

    // Gauge Maths
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    const baseColor = score > 90 ? "#10b981" : score > 70 ? "#fbbf24" : "#ef4444";
    const color = scoreFlash === 'green' ? "#10b981" : scoreFlash === 'red' ? "#ef4444" : baseColor;

    return (
        <div className="fixed z-50 flex items-center justify-center 
            bottom-6 left-1/2 -translate-x-1/2 w-full px-4
            md:w-auto md:px-0 md:bottom-auto md:left-6 md:top-1/2 md:translate-x-0 md:-translate-y-1/2"
        >
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex items-center gap-1.5 md:gap-3 rounded-2xl md:rounded-full border border-white/10 bg-zinc_dark/90 p-2 md:p-3 shadow-2xl backdrop-blur-xl
                    flex-row md:flex-col overflow-x-auto md:overflow-visible max-w-full no-scrollbar"
            >
                {/* New Chat Button (Integrated) */}
                <button
                    onClick={() => {
                        setActiveTab("chat");
                        onNewChat();
                    }}
                    className="group flex-shrink-0 flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl md:rounded-full bg-safety_gold/10 text-safety_gold border border-safety_gold/20 hover:bg-safety_gold hover:text-black transition-all shadow-lg"
                >
                    <Plus size={20} />
                    <span className="hidden md:flex absolute left-16 rounded-md border border-white/10 bg-zinc_dark px-2 py-1 text-xs text-zinc-200 opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50">
                        New Chat
                    </span>
                </button>

                <div className="mx-1 h-8 w-px bg-white/5 md:my-1 md:h-px md:w-8" />

                <div className="flex items-center gap-1 md:gap-2 flex-row md:flex-col">
                    {navItems.map((item) => {
                        const isActive = activeTab === item.id;
                        const Icon = item.icon;

                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={cn(
                                    "group relative flex-shrink-0 flex h-10 w-10 md:h-10 md:w-10 items-center justify-center rounded-xl md:rounded-full transition-all hover:bg-white/5",
                                    isActive ? "bg-white/10 text-white" : "text-zinc-400"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="active-pill"
                                        className="absolute inset-0 rounded-xl md:rounded-full bg-white/10"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <Icon
                                    size={20}
                                    className={cn(
                                        "relative z-10 transition-colors",
                                        isActive ? "text-safety_gold" : "group-hover:text-zinc-200",
                                        item.id === "policies" && "group-hover:rotate-12 transition-transform duration-300"
                                    )}
                                />

                                {/* Tooltip on Hover (Desktop Only) */}
                                <span className="hidden md:flex absolute left-14 rounded-md border border-white/10 bg-zinc_dark px-2 py-1 text-xs text-zinc-200 opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50">
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="mx-1 h-8 w-px bg-white/5 md:my-1 md:h-px md:w-8" />

                <div className="flex items-center gap-1 md:gap-2 flex-row md:flex-col">
                    {/* Safety Score Gauge */}
                    <div className="group relative flex-shrink-0 flex h-9 w-9 items-center justify-center cursor-help">
                        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 40 40">
                            {/* Track */}
                            <circle
                                cx="20"
                                cy="20"
                                r={radius}
                                fill="transparent"
                                stroke="#27272a" // zinc-800
                                strokeWidth="3"
                            />
                            {/* Progress */}
                            <circle
                                cx="20"
                                cy="20"
                                r={radius}
                                fill="transparent"
                                stroke={color}
                                strokeWidth="3"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <motion.span
                            key={score}
                            initial={{ scale: scoreFlash ? 1.3 : 1 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className={`absolute text-[9px] font-bold ${scoreFlash === 'green' ? 'text-emerald-400' :
                                scoreFlash === 'red' ? 'text-red-400' :
                                    score > 90 ? "text-emerald-400" :
                                        score > 70 ? "text-amber-400" :
                                            "text-red-400"
                                }`}
                        >
                            {score}
                        </motion.span>
                        <span className="hidden md:flex absolute left-14 rounded-md border border-white/10 bg-zinc_dark px-2 py-1 text-xs text-zinc-200 opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50">
                            Safety Score
                        </span>
                    </div>

                    <div className="hidden md:block mx-1 h-8 w-px bg-white/10 md:my-1 md:h-px md:w-8" />

                    <button
                        onClick={handleLogout}
                        className="group relative flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl md:rounded-full text-zinc-400 transition-all hover:bg-red-500/10 hover:text-red-400"
                    >
                        <LogOut size={18} />
                        <span className="hidden md:flex absolute left-14 rounded-md border border-white/10 bg-zinc_dark px-2 py-1 text-xs text-zinc-200 opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50">
                            Logout
                        </span>
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
