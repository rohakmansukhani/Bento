"use client";
import { useState } from "react";
import { usePolicy, ProfileId } from "@/context/PolicyContext";
import { motion, AnimatePresence } from "framer-motion";
import TrashIcon from "@/components/ui/icons/trash-icon";
import XIcon from "@/components/ui/icons/x-icon";
import PlusIcon from "@/components/ui/icons/plus-icon";
import BriefcaseIcon from "@/components/ui/icons/briefcase-icon";
import BookIcon from "@/components/ui/icons/book-icon";
import HomeIcon from "@/components/ui/icons/home-icon";
import TerminalIcon from "@/components/ui/icons/TerminalIcon";
import LockIcon from "@/components/ui/icons/LockIcon";
import AlertIcon from "@/components/ui/icons/AlertIcon";
import { Switch } from "@/components/ui/Switch";
import { cn } from "@/lib/utils";
import ProfileOnboardingModal from "./ProfileOnboardingModal";

const ICONS = {
    Briefcase: BriefcaseIcon,
    BookOpen: BookIcon,
    Home: HomeIcon,
    Terminal: TerminalIcon,
    User: BriefcaseIcon, // Fallback
    Globe: BriefcaseIcon // Fallback
};

export default function PoliciesPage() {
    const {
        activeProfileId,
        setActiveProfileId,
        profiles,
        updateProfileToggle,
        updateCustomKeywords,
        deleteProfile
    } = usePolicy();

    const [selectedProfileForEdit, setSelectedProfileForEdit] = useState<ProfileId | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [confirmSwitch, setConfirmSwitch] = useState<{ from: ProfileId; to: ProfileId } | null>(null);
    const [newKeyword, setNewKeyword] = useState("");

    const handleToggleProfile = async (profileId: ProfileId) => {
        if (profileId === activeProfileId) return; // Already active

        // Show confirmation modal
        setConfirmSwitch({ from: activeProfileId!, to: profileId });
    };

    const confirmProfileSwitch = async () => {
        if (!confirmSwitch) return;

        await setActiveProfileId(confirmSwitch.to);
        setConfirmSwitch(null);
    };

    const handleAddKeyword = (pid: ProfileId) => {
        if (!newKeyword.trim()) return;
        const current = profiles[pid].customKeywords;
        if (!current.includes(newKeyword.trim())) {
            updateCustomKeywords(pid, [...current, newKeyword.trim()]);
        }
        setNewKeyword("");
    };

    const handleRemoveKeyword = (pid: ProfileId, keyword: string) => {
        const current = profiles[pid].customKeywords;
        updateCustomKeywords(pid, current.filter(k => k !== keyword));
    };

    const handleDeleteProfile = async () => {
        if (!selectedProfileForEdit) return;
        if (window.confirm("Are you sure you want to delete this profile? This action cannot be undone.")) {
            await deleteProfile(selectedProfileForEdit);
            setSelectedProfileForEdit(null);
        }
    };

    return (
        <div className="flex w-full h-full p-6 flex-col overflow-hidden">
            {/* Header with Create Button */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight text-white font-mono">My Privacy Rules</h1>
                    <p className="text-sm text-zinc-400">Choose a context to auto-configure your shield.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-amber_neon hover:bg-safety_gold transition-all text-black font-mono text-sm uppercase tracking-wider w-full md:w-auto justify-center"
                >
                    <PlusIcon size={16} />
                    New Profile
                </button>
            </div>

            {/* Grid of Profiles with Switches */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {(Object.values(profiles) as any[]).map((p) => {
                    const isActive = activeProfileId === p.id;
                    const Icon = ICONS[p.icon_name as keyof typeof ICONS] || BriefcaseIcon;

                    return (
                        <div
                            key={p.id}
                            className={cn(
                                "group relative flex flex-col gap-4 rounded-2xl border p-5 transition-all",
                                isActive
                                    ? "bg-zinc_dark/80 border-amber_neon/30 shadow-2xl shadow-amber_neon/5"
                                    : "bg-zinc_dark/30 border-white/5 hover:border-white/10"
                            )}
                        >
                            {/* Header with Icon and Switch */}
                            <div className="flex items-center justify-between">
                                <div
                                    onClick={() => setSelectedProfileForEdit(p.id)}
                                    className="flex items-center gap-3 cursor-pointer flex-1"
                                >
                                    <div className={cn(
                                        "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                                        isActive ? "bg-amber_neon/20 text-amber_neon" : "bg-white/5 text-zinc-400"
                                    )}>
                                        <Icon size={20} />
                                    </div>
                                    <div>
                                        <h3 className={cn("text-base font-bold font-mono", isActive ? "text-white" : "text-zinc-400")}>
                                            {p.name}
                                        </h3>
                                        <p className="text-xs text-zinc-500">{p.description}</p>
                                    </div>
                                </div>

                                {/* Active Toggle Switch */}
                                <div onClick={(e) => e.stopPropagation()}>
                                    <Switch
                                        checked={isActive}
                                        onCheckedChange={() => handleToggleProfile(p.id)}
                                    />
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="flex items-center gap-4 text-xs text-zinc-500 pt-2 border-t border-white/5">
                                <span>{Object.values(p.toggles).filter(Boolean).length}/6 protections</span>
                                <span>•</span>
                                <span>{p.customKeywords.length} keywords</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Confirmation Modal for Profile Switch */}
            <AnimatePresence>
                {confirmSwitch && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md"
                        >
                            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-obsidian shadow-2xl p-8">
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber_neon/10 text-amber_neon">
                                        <AlertIcon size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-1">Switch Active Profile?</h3>
                                        <p className="text-sm text-zinc-400">
                                            This will deactivate <span className="text-white font-medium">{profiles[confirmSwitch.from]?.name}</span> and activate <span className="text-amber_neon font-medium">{profiles[confirmSwitch.to]?.name}</span>.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setConfirmSwitch(null)}
                                        className="flex-1 rounded-full border border-white/10 bg-white/5 py-3 text-sm font-mono uppercase tracking-widest text-white hover:bg-white/10 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmProfileSwitch}
                                        className="flex-1 rounded-full bg-amber_neon py-3 text-sm font-mono uppercase tracking-widest text-black hover:bg-safety_gold transition-all"
                                    >
                                        Switch
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Profile Detail/Edit Modal */}
            <AnimatePresence>
                {selectedProfileForEdit && profiles[selectedProfileForEdit] && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 md:p-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-obsidian shadow-2xl">
                                {/* Close Button */}
                                <button
                                    onClick={() => setSelectedProfileForEdit(null)}
                                    className="absolute top-6 right-6 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    <XIcon size={16} className="text-zinc-400" />
                                </button>

                                <div className="p-4 md:p-8">
                                    {/* Header */}
                                    <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/5">
                                        <div className="text-amber_neon">
                                            <LockIcon size={24} />
                                        </div>
                                        <h2 className="text-xl font-bold text-white">
                                            What to hide in <span className="text-amber_neon">{profiles[selectedProfileForEdit].name}</span> mode?
                                        </h2>
                                    </div>

                                    {/* Privacy Toggles */}
                                    <div className="flex flex-col gap-3 mb-8">
                                        <ToggleItem
                                            label="Email Addresses"
                                            desc="Redact patterns like user@example.com"
                                            checked={profiles[selectedProfileForEdit].toggles.email}
                                            onChange={(v) => updateProfileToggle(selectedProfileForEdit, 'email', v)}
                                        />
                                        <ToggleItem
                                            label="Phone Numbers"
                                            desc="Redact mobile and landline numbers"
                                            checked={profiles[selectedProfileForEdit].toggles.phone}
                                            onChange={(v) => updateProfileToggle(selectedProfileForEdit, 'phone', v)}
                                        />
                                        <ToggleItem
                                            label="Real Names"
                                            desc="Start redacting detected person names"
                                            checked={profiles[selectedProfileForEdit].toggles.names}
                                            onChange={(v) => updateProfileToggle(selectedProfileForEdit, 'names', v)}
                                        />
                                        <ToggleItem
                                            label="Payment Info"
                                            desc="Credit cards, IBANs, and crypto addresses"
                                            checked={profiles[selectedProfileForEdit].toggles.payment}
                                            onChange={(v) => updateProfileToggle(selectedProfileForEdit, 'payment', v)}
                                        />
                                        <ToggleItem
                                            label="Location Data"
                                            desc="Home addresses, cities, and GPS coords"
                                            checked={profiles[selectedProfileForEdit].toggles.location}
                                            onChange={(v) => updateProfileToggle(selectedProfileForEdit, 'location', v)}
                                        />
                                        <ToggleItem
                                            label="Credentials"
                                            desc="API Keys, Passwords, and Secrets"
                                            checked={profiles[selectedProfileForEdit].toggles.credentials}
                                            onChange={(v) => updateProfileToggle(selectedProfileForEdit, 'credentials', v)}
                                        />
                                    </div>

                                    {/* Custom Keywords */}
                                    <div className="pt-6 border-t border-white/5">
                                        <label className="text-sm font-bold text-zinc-300 font-mono flex items-center gap-2 mb-4">
                                            CUSTOM KEYWORDS
                                            <span className="bg-white/10 text-zinc-400 text-[10px] px-1.5 py-0.5 rounded">Exact Match</span>
                                        </label>

                                        <div className="flex gap-2 mb-4">
                                            <input
                                                value={newKeyword}
                                                onChange={(e) => setNewKeyword(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword(selectedProfileForEdit)}
                                                placeholder="Enter project name or secret..."
                                                className="flex-1 bg-zinc_dark border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-amber_neon/50 outline-none placeholder:text-zinc-600"
                                            />
                                            <button
                                                onClick={() => handleAddKeyword(selectedProfileForEdit)}
                                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/5 transition-colors"
                                            >
                                                <PlusIcon size={18} />
                                            </button>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <AnimatePresence>
                                                {profiles[selectedProfileForEdit].customKeywords.map((k) => (
                                                    <motion.div
                                                        key={k}
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        exit={{ scale: 0 }}
                                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber_neon/10 text-amber_neon border border-amber_neon/20 text-xs font-medium group cursor-pointer hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all"
                                                        onClick={() => handleRemoveKeyword(selectedProfileForEdit, k)}
                                                    >
                                                        {k}
                                                        <XIcon size={12} className="opacity-50 group-hover:opacity-100" />
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                            {profiles[selectedProfileForEdit].customKeywords.length === 0 && (
                                                <span className="text-xs text-zinc-600 italic">No custom secrets added yet.</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Danger Zone */}
                                    <div className="mt-8 pt-6 border-t border-white/5">
                                        <button
                                            onClick={handleDeleteProfile}
                                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 hover:text-red-400 transition-all font-mono text-sm uppercase tracking-wider"
                                        >
                                            <TrashIcon size={16} dangerHover={true} shakeOnClick={true} />
                                            Delete Profile
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create Profile Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[200]">
                    <ProfileOnboardingModal />
                </div>
            )}
        </div>
    );
}

function ToggleItem({ label, desc, checked, onChange }: { label: string, desc: string, checked: boolean, onChange: (v: boolean) => void }) {
    return (
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
            <div>
                <h4 className="text-sm font-medium text-zinc-200">{label}</h4>
                <p className="text-xs text-zinc-500">{desc}</p>
            </div>
            <Switch checked={checked} onCheckedChange={onChange} />
        </div>
    );
}
