"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
// import { ArrowRight, ArrowLeft, Check } from "lucide-react"; // Removed Lucide imports
import { usePolicy } from "@/context/PolicyContext";
import ArrowNarrowRightIcon from "@/components/ui/icons/arrow-narrow-right-icon";
import ArrowNarrowLeftIcon from "@/components/ui/icons/arrow-narrow-left-icon";
import SimpleCheckedIcon from "@/components/ui/icons/simple-checked-icon";

// Import custom animated icons
import BriefcaseIcon from "@/components/ui/icons/briefcase-icon";
import BookIcon from "@/components/ui/icons/book-icon";
import HomeIcon from "@/components/ui/icons/home-icon";
import TerminalIcon from "@/components/ui/icons/TerminalIcon";
import UsersIcon from "@/components/ui/icons/UsersIcon";
import WorldIcon from "@/components/ui/icons/world-icon";

const ICONS = [
    { id: 'Briefcase', icon: BriefcaseIcon, label: 'Work' },
    { id: 'BookOpen', icon: BookIcon, label: 'Research' },
    { id: 'Home', icon: HomeIcon, label: 'Personal' },
    { id: 'Terminal', icon: TerminalIcon, label: 'Dev' },
    { id: 'User', icon: UsersIcon, label: 'Custom' },
    { id: 'Globe', icon: WorldIcon, label: 'General' }
];

const PRIVACY_TOGGLES = [
    { key: 'email', label: 'Email Addresses', description: 'Redact patterns like user@example.com' },
    { key: 'phone', label: 'Phone Numbers', description: 'Redact mobile and landline numbers' },
    { key: 'names', label: 'Real Names', description: 'Start redacting detected person names' },
    { key: 'payment', label: 'Payment Info', description: 'Credit cards, IBANs, and crypto addresses' },
    { key: 'location', label: 'Location Data', description: 'Home addresses, cities, and GPS coords' },
    { key: 'credentials', label: 'Credentials', description: 'API Keys, Passwords, and Secrets' }
];

export default function ProfileOnboardingModal() {
    const { profiles, addProfile, profilesLoaded } = usePolicy();
    // Only show modal if profiles have loaded AND there are no profiles
    const isOpen = profilesLoaded && Object.keys(profiles).length === 0;

    const [step, setStep] = useState(1); // 1: Name & Icon, 2: Privacy Settings, 3: Custom Keywords
    const [name, setName] = useState("");
    const [selectedIcon, setSelectedIcon] = useState(ICONS[0].id);
    const [toggles, setToggles] = useState({
        email: true,
        phone: true,
        names: true,
        payment: true,
        location: true,
        credentials: true
    });
    const [customKeywords, setCustomKeywords] = useState<string[]>([]);
    const [keywordInput, setKeywordInput] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const handleNext = () => {
        if (step === 1 && !name.trim()) return;
        setStep(step + 1);
    };

    const handleBack = () => {
        setStep(step - 1);
    };

    const handleCreate = async () => {
        if (!name.trim() || isCreating) return;

        setIsCreating(true);
        try {
            await addProfile(name.trim(), selectedIcon, "text-amber_neon", toggles, customKeywords);
            // Modal will auto-close when profiles.length > 0
        } catch (error) {
            console.error("Failed to create profile:", error);
            setIsCreating(false);
        }
    };

    const handleAddKeyword = () => {
        if (keywordInput.trim() && !customKeywords.includes(keywordInput.trim())) {
            setCustomKeywords([...customKeywords, keywordInput.trim()]);
            setKeywordInput("");
        }
    };

    const handleRemoveKeyword = (keyword: string) => {
        setCustomKeywords(customKeywords.filter(k => k !== keyword));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-2xl"
            >
                {/* Minimal Card */}
                <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-obsidian shadow-2xl">
                    {/* Subtle Top Accent */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber_neon/20 to-transparent" />

                    {/* Progress Indicator */}
                    <div className="flex items-center justify-center gap-2 pt-8 pb-4">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={`h-1 rounded-full transition-all duration-300 ${s === step ? 'w-8 bg-amber_neon' : s < step ? 'w-6 bg-amber_neon/50' : 'w-6 bg-white/10'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Content */}
                    <div className="p-12 pt-6">
                        <AnimatePresence mode="wait">
                            {/* Step 1: Name & Icon */}
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {/* Header */}
                                    <div className="mb-10 text-center">
                                        <h1 className="text-2xl font-light tracking-tight text-white mb-2">
                                            Name Your Shield
                                        </h1>
                                        <p className="text-sm text-zinc-500 font-light">
                                            Create your first privacy context
                                        </p>
                                    </div>

                                    {/* Input */}
                                    <div className="mb-8">
                                        <input
                                            autoFocus
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                                            placeholder="Work, Personal, Research..."
                                            className="w-full bg-transparent border-b border-white/10 px-0 py-4 text-lg text-white placeholder:text-zinc-700 focus:border-amber_neon/50 focus:outline-none transition-colors font-light tracking-wide"
                                        />
                                    </div>

                                    {/* Icon Selector */}
                                    <div className="mb-10">
                                        <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-600 mb-4">
                                            Icon
                                        </label>
                                        <div className="grid grid-cols-6 gap-2">
                                            {ICONS.map((item) => {
                                                const Icon = item.icon;
                                                const isSelected = selectedIcon === item.id;
                                                return (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => setSelectedIcon(item.id)}
                                                        className="group relative aspect-square"
                                                    >
                                                        {isSelected && (
                                                            <motion.div
                                                                layoutId="icon-selector"
                                                                className="absolute inset-0 rounded-lg border border-amber_neon/40 bg-amber_neon/10"
                                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                            />
                                                        )}
                                                        <div className={`
                                                            relative flex h-full w-full items-center justify-center rounded-lg
                                                            transition-all duration-200
                                                            ${isSelected ? 'text-amber_neon' : 'text-zinc-600 hover:text-zinc-400'}
                                                        `}>
                                                            <Icon size={24} strokeWidth={2.5} />
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleNext}
                                        disabled={!name.trim()}
                                        className="group relative w-full overflow-hidden rounded-full bg-amber_neon py-4 transition-all hover:bg-safety_gold disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <span className="flex items-center justify-center gap-2 text-sm font-mono uppercase tracking-widest text-black font-medium">
                                            Next
                                            <ArrowNarrowRightIcon size={16} className="transition-transform group-hover:translate-x-1" />
                                        </span>
                                    </button>
                                </motion.div>
                            )}

                            {/* Step 2: Privacy Settings */}
                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="mb-8 text-center">
                                        <h1 className="text-2xl font-light tracking-tight text-white mb-2">
                                            What to Hide in {name} Mode?
                                        </h1>
                                        <p className="text-sm text-zinc-500 font-light">
                                            Choose what data types to protect
                                        </p>
                                    </div>

                                    <div className="space-y-3 mb-8 max-h-[400px] overflow-y-auto pr-2">
                                        {PRIVACY_TOGGLES.map((toggle) => (
                                            <button
                                                key={toggle.key}
                                                onClick={() => setToggles(prev => ({ ...prev, [toggle.key]: !prev[toggle.key as keyof typeof toggles] }))}
                                                className="w-full flex items-start gap-4 p-4 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all group"
                                            >
                                                <div className={`
                                                    mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                                                    ${toggles[toggle.key as keyof typeof toggles]
                                                        ? 'border-amber_neon bg-amber_neon'
                                                        : 'border-zinc-600 group-hover:border-zinc-500'
                                                    }
                                                `}>
                                                    {toggles[toggle.key as keyof typeof toggles] && (
                                                        <SimpleCheckedIcon size={12} className="text-black" />
                                                    )}
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <div className="text-sm font-medium text-white mb-0.5">
                                                        {toggle.label}
                                                    </div>
                                                    <div className="text-xs text-zinc-600 font-light">
                                                        {toggle.description}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleBack}
                                            className="flex-1 rounded-full border border-white/10 bg-white/5 py-4 transition-all hover:bg-white/10"
                                        >
                                            <span className="flex items-center justify-center gap-2 text-sm font-mono uppercase tracking-widest text-white">
                                                <ArrowNarrowLeftIcon size={16} />
                                                Back
                                            </span>
                                        </button>
                                        <button
                                            onClick={handleNext}
                                            className="flex-[2] rounded-full bg-amber_neon py-4 transition-all hover:bg-safety_gold"
                                        >
                                            <span className="flex items-center justify-center gap-2 text-sm font-mono uppercase tracking-widest text-black font-medium">
                                                Next
                                                <ArrowNarrowRightIcon size={16} />
                                            </span>
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3: Custom Keywords */}
                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="mb-8 text-center">
                                        <h1 className="text-2xl font-light tracking-tight text-white mb-2">
                                            Custom Keywords
                                        </h1>
                                        <p className="text-sm text-zinc-500 font-light">
                                            Add specific words or phrases to redact (optional)
                                        </p>
                                    </div>

                                    <div className="mb-6">
                                        <div className="flex gap-2">
                                            <input
                                                value={keywordInput}
                                                onChange={(e) => setKeywordInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                                                placeholder="Project name, company, etc..."
                                                className="flex-1 bg-transparent border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-zinc-700 focus:border-amber_neon/50 focus:outline-none transition-colors"
                                            />
                                            <button
                                                onClick={handleAddKeyword}
                                                disabled={!keywordInput.trim()}
                                                className="px-6 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <span className="text-sm font-mono uppercase tracking-widest text-white">Add</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mb-8 min-h-[120px] max-h-[200px] overflow-y-auto">
                                        {customKeywords.length === 0 ? (
                                            <div className="flex items-center justify-center h-[120px] text-zinc-600 text-sm font-light">
                                                No custom keywords added yet
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {customKeywords.map((keyword) => (
                                                    <div
                                                        key={keyword}
                                                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber_neon/10 border border-amber_neon/20"
                                                    >
                                                        <span className="text-sm text-amber_neon font-mono">{keyword}</span>
                                                        <button
                                                            onClick={() => handleRemoveKeyword(keyword)}
                                                            className="text-amber_neon/60 hover:text-amber_neon transition-colors"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleBack}
                                            className="flex-1 rounded-full border border-white/10 bg-white/5 py-4 transition-all hover:bg-white/10"
                                        >
                                            <span className="flex items-center justify-center gap-2 text-sm font-mono uppercase tracking-widest text-white">
                                                <ArrowNarrowLeftIcon size={16} />
                                                Back
                                            </span>
                                        </button>
                                        <button
                                            onClick={handleCreate}
                                            disabled={isCreating}
                                            className="flex-[2] rounded-full bg-amber_neon py-4 transition-all hover:bg-safety_gold disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <span className="flex items-center justify-center gap-2 text-sm font-mono uppercase tracking-widest text-black font-medium">
                                                {isCreating ? "Creating..." : "Create Shield"}
                                                {!isCreating && <SimpleCheckedIcon size={16} />}
                                            </span>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                </div>

                <p className="mt-6 text-center text-xs text-zinc-700 font-light">
                    Step {step} of 3 • You can customize this later
                </p>
            </motion.div>
        </div>
    );
}
