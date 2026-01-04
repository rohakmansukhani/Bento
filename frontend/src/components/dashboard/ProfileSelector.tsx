"use client";
import { useState } from "react";
import DownCheveron from "@/components/ui/icons/down-cheveron";
import BriefcaseIcon from "@/components/ui/icons/briefcase-icon";
import BookIcon from "@/components/ui/icons/book-icon";
import HomeIcon from "@/components/ui/icons/home-icon";
import TerminalIcon from "@/components/ui/icons/TerminalIcon";
import UsersIcon from "@/components/ui/icons/UsersIcon";
import WorldIcon from "@/components/ui/icons/world-icon";
import { motion, AnimatePresence } from "framer-motion";
import { usePolicy } from "@/context/PolicyContext";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, any> = {
    Briefcase: BriefcaseIcon,
    BookOpen: BookIcon,
    Home: HomeIcon,
    Terminal: TerminalIcon,
    User: UsersIcon,
    Globe: WorldIcon
};

export default function ProfileSelector() {
    const { activeProfileId, setActiveProfileId, profiles } = usePolicy();
    const [isOpen, setIsOpen] = useState(false);

    if (!activeProfileId || !profiles[activeProfileId]) return null;

    const activeProfile = profiles[activeProfileId];
    const ActiveIcon = ICON_MAP[activeProfile.icon_name] || UsersIcon;

    return (
        <div className="relative z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 rounded-full border border-white/5 bg-zinc_dark px-3 md:px-5 py-2.5 text-sm font-medium text-zinc-200 transition-all hover:bg-white/5 hover:text-white"
            >
                <ActiveIcon size={16} className={activeProfile.color} />
                <span className="font-mono tracking-wide uppercase hidden md:inline">{activeProfile.name}</span>
                <DownCheveron className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 top-12 w-48 overflow-hidden rounded-xl border border-white/10 bg-zinc_dark shadow-2xl"
                    >
                        {(Object.values(profiles) as any[]).map((p) => {
                            const Icon = ICON_MAP[p.icon_name] || UsersIcon;
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => {
                                        setActiveProfileId(p.id);
                                        setIsOpen(false);
                                    }}
                                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
                                >
                                    <Icon size={16} className={p.color} />
                                    <span className={cn(
                                        "font-mono text-xs font-bold uppercase",
                                        activeProfileId === p.id ? "text-white" : "text-zinc-400"
                                    )}>
                                        {p.name}
                                    </span>
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
