import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";
import TrashIcon from "./icons/trash-icon";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    isLoading?: boolean;
    confirmText?: string;
    cancelText?: string;
    type?: "danger" | "warning" | "info";
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    isLoading = false,
    confirmText = "Delete",
    cancelText = "Cancel",
    type = "danger"
}: ConfirmationModalProps) {
    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    const backdropRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (backdropRef.current === e.target) {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        ref={backdropRef}
                        onClick={handleBackdropClick}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{ type: "spring", duration: 0.3, bounce: 0.2 }}
                        className="relative w-full max-w-md bg-zinc_dark border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* Decorative Gradient Line */}
                        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${type === 'danger' ? 'from-red-500/50 via-red-500 to-red-500/50' : 'from-safety_gold/50 via-safety_gold to-safety_gold/50'}`} />

                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className={`p-3 rounded-full shrink-0 ${type === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                    {type === 'danger' ? <TrashIcon size={24} dangerHover={true} /> : <AlertTriangle size={24} />}
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                                    <p className="text-zinc-400 text-sm leading-relaxed">{message}</p>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="text-zinc-500 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex items-center justify-end gap-3 mt-8">
                                <button
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    disabled={isLoading}
                                    className={`relative min-w-[120px] px-6 py-2.5 text-sm font-semibold text-white rounded-xl transition-all active:scale-95 flex items-center justify-center
                                        ${type === 'danger'
                                            ? 'bg-red-500 hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                                            : 'bg-safety_gold hover:bg-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)] text-zinc-900'}
                                        disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100
                                    `}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Processing...</span>
                                        </div>
                                    ) : (
                                        confirmText
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
