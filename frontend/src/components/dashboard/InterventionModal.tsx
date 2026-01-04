"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert } from "lucide-react"; // Fallback
import AlertIcon from "@/components/ui/icons/AlertIcon";
import ShieldCheckIcon from "@/components/ui/icons/ShieldCheckIcon";
import { Button } from "@/components/ui/Button";
import DiffSnippet from "./DiffSnippet";

interface Hit {
    type: string;
    value: string;
    line_number?: number;
    context: {
        before: string[];
        match: string;
        after: string[];
    } | string;
}

interface InterventionModalProps {
    isOpen: boolean;
    violationDetails: string;
    redactedPreview: string;
    hits?: Hit[]; // NEW: Detailed hit information
    onConfirmSafe: () => void;
    onConfirmUnsafe: () => void;
    onCancel: () => void;
}

export default function InterventionModal({
    isOpen,
    violationDetails,
    redactedPreview,
    hits = [],
    onConfirmSafe,
    onConfirmUnsafe,
    onCancel,
}: InterventionModalProps) {
    // Detect language from content (simple heuristic)
    const detectLanguage = (text: string): string => {
        if (text.includes('{') && text.includes('}')) return 'json';
        if (text.includes('def ') || text.includes('import ')) return 'python';
        if (text.includes('function') || text.includes('=>')) return 'javascript';
        return 'javascript'; // default
    };

    const language = detectLanguage(redactedPreview);
    const hasDetailedHits = hits && hits.length > 0;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-obsidian/80 backdrop-blur-md"
                        onClick={onCancel}
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-safety_gold/30 bg-zinc_dark shadow-2xl shadow-amber-900/20 flex flex-col"
                    >
                        {/* Header: Warning */}
                        <div className="flex items-center gap-4 border-b border-safety_gold/10 bg-amber-900/10 px-8 py-6">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 ring-1 ring-amber-500/30">
                                <AlertIcon size={24} className="text-safety_gold" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold tracking-wide text-white font-mono">INTERVENTION REQUIRED</h3>
                                <p className="text-sm text-amber-200/70 font-sans">{violationDetails || "Potential sensitive data detected."}</p>
                            </div>
                        </div>

                        {/* Body: Snippets or Full Preview */}
                        <div className="flex-1 overflow-y-auto p-8">
                            {hasDetailedHits ? (
                                <>
                                    <label className="mb-4 block text-xs font-bold text-zinc-500 font-mono uppercase">
                                        {hits.length} Leak{hits.length !== 1 ? 's' : ''} Detected
                                    </label>
                                    <div className="space-y-4">
                                        {hits.map((hit, idx) => (
                                            <DiffSnippet
                                                key={idx}
                                                hit={{
                                                    type: hit.type,
                                                    value: hit.value,
                                                    line_number: hit.line_number || 1,
                                                    context: typeof hit.context === 'string'
                                                        ? { before: [], match: hit.value, after: [] }
                                                        : hit.context
                                                }}
                                                language={language}
                                            />
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <label className="mb-3 block text-xs font-bold text-zinc-500 font-mono uppercase">
                                        Redacted Preview (Safe to Send)
                                    </label>
                                    <div className="rounded-lg border border-white/5 bg-obsidian p-4 font-mono text-sm text-zinc-300 max-h-96 overflow-y-auto">
                                        {redactedPreview}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer: Decisions */}
                        <div className="flex items-center justify-between gap-4 border-t border-white/5 bg-white/[0.02] px-8 py-6">
                            <Button variant="ghost" onClick={onCancel}>
                                ABORT
                            </Button>

                            <div className="flex gap-3">
                                <Button variant="secondary" onClick={onConfirmUnsafe} className="text-red-400 hover:text-red-300 ring-red-500/20">
                                    <ShieldAlert className="mr-2 h-4 w-4" />
                                    BYPASS SHIELD
                                </Button>
                                <Button variant="primary" onClick={onConfirmSafe}>
                                    <ShieldCheckIcon size={16} className="mr-2" />
                                    PROCEED SAFELY
                                </Button>
                            </div>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
