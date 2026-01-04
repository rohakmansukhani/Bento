"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import CpuIcon from "@/components/ui/icons/CpuIcon";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@/context/ChatContext";

const models = [
    { id: "gemini", name: "GEMINI PRO", provider: "Google" },
    { id: "claude", name: "CLAUDE 3.5", provider: "Anthropic" },
    { id: "gpt4", name: "GPT-4o", provider: "OpenAI" },
];

export default function ModelSelector() {
    const { activeModel, setActiveModel } = useChat();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 rounded-full border border-white/5 bg-zinc_dark px-3 md:px-5 py-2.5 text-sm font-medium text-zinc-200 transition-all hover:bg-white/5 hover:text-white"
            >
                <CpuIcon size={18} className="text-safety_gold" />
                <span className="font-mono tracking-wide hidden md:inline">{activeModel.name}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 top-12 w-48 overflow-hidden rounded-xl border border-white/10 bg-zinc_dark shadow-2xl"
                    >
                        {models.map((model) => (
                            <button
                                key={model.id}
                                disabled={model.id !== "gemini"} // Disable others for now
                                onClick={() => {
                                    if (model.id === "gemini") {
                                        setActiveModel(model);
                                        setIsOpen(false);
                                    }
                                }}
                                className={`flex w-full flex-col px-4 py-3 text-left transition-colors ${model.id === "gemini"
                                    ? "hover:bg-white/5 cursor-pointer"
                                    : "opacity-40 cursor-not-allowed grayscale"
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className={`font-mono text-xs font-bold ${activeModel.id === model.id ? 'text-safety_gold' : 'text-zinc-300'}`}>
                                        {model.name}
                                    </span>
                                    {model.id !== "gemini" && (
                                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider border border-white/10 rounded px-1.5 py-0.5">Soon</span>
                                    )}
                                </div>
                                <span className="text-[10px] text-zinc-500 mt-0.5">{model.provider}</span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
