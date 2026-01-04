import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ChatIcon from "../ui/icons/ChatIcon";
import SearchIcon from "../ui/icons/SearchIcon";
import CalendarIcon from "../ui/icons/CalendarIcon";
import ChevronRightIcon from "../ui/icons/ChevronRightIcon";
import DownloadIcon from "../ui/icons/DownloadIcon";
import TrashIcon from "../ui/icons/trash-icon";
import ConfirmationModal from "../ui/ConfirmationModal"; // Imported Modal
import { useChat } from "@/context/ChatContext";


// Types
interface HistoryItem {
    id: string;
    title: string;
    date: string;
    model: string;
    preview: string;
    messages: number;
    status: string;
    verdict_color?: string; // Optional custom color from backend
}

export default function HistoryPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const { loadConversation, setUiTab } = useChat();
    const [chats, setChats] = useState<HistoryItem[]>([]);

    // Modal State
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/history`, {
                headers: { 'X-Bento-Secret-Key': 'sk-demo-key' }
            });
            if (res.ok) {
                const data = await res.json();
                setChats(data);
            }
        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter chats based on search
    const filteredChats = chats.filter(chat =>
        (chat.title?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (chat.preview?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col gap-6 h-full p-6 overflow-hidden">
                <div className="flex flex-col gap-2">
                    <div className="h-8 w-48 bg-zinc-800/50 rounded animate-pulse" />
                    <div className="h-4 w-96 bg-zinc-800/50 rounded animate-pulse" />
                </div>
                <div className="h-14 w-full bg-zinc-800/30 rounded-xl animate-pulse" />
                <div className="flex-1 flex flex-col gap-3">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-24 w-full bg-zinc-800/30 rounded-xl animate-pulse border border-white/5" />
                    ))}
                </div>
            </div>
        );
    }

    const handleExport = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/export/audit-csv`, {
                headers: { 'X-Bento-Secret-Key': 'sk-demo-key' }
            });

            if (res.ok) {
                // Trigger download
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `bento_audit_report_${new Date().toISOString().slice(0, 10)}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error("Export failed:", error);
        }
    };

    // Open Modal
    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeleteId(id);
    };

    // Perform Delete
    const confirmDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/history/${deleteId}`, {
                method: 'DELETE',
                headers: { 'X-Bento-Secret-Key': 'sk-demo-key' }
            });

            if (res.ok) {
                // Remove from local state
                setChats(current => current.filter(c => c.id !== deleteId));
                setDeleteId(null);
            }
        } catch (error) {
            console.error("Delete failed", error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 h-full p-6 overflow-hidden relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Chat History</h1>
                    <p className="text-zinc-400 text-sm">Access and manage your past AI conversations.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExport}
                        className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc_dark border border-white/10 text-zinc-300 hover:bg-zinc-800 transition-colors text-sm hover:text-white"
                    >
                        <DownloadIcon size={16} className="text-zinc-400 group-hover:text-white" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-safety_gold transition-colors">
                    <SearchIcon size={18} />
                </div>
                <input
                    type="text"
                    placeholder="Search conversations..."
                    className="w-full bg-zinc_dark/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-safety_gold/50 focus:ring-1 focus:ring-safety_gold/50 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {filteredChats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-4">
                        <div className="p-4 rounded-full bg-zinc-800/50">
                            <ChatIcon size={32} className="opacity-50 text-zinc-600" />
                        </div>
                        <p>No chat history available.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {filteredChats.map((chat, i) => (
                            <motion.div
                                key={chat.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => {
                                    loadConversation(chat.id);
                                    setUiTab("chat");
                                }}
                                className="flex flex-col md:flex-row items-center justify-between p-4 rounded-xl bg-zinc_dark/30 border border-white/5 hover:border-white/10 hover:bg-zinc_dark/80 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 border border-white/5 transition-colors ${chat.status === 'Canceled' ? 'bg-red-500/10 border-red-500/20' : 'bg-zinc-800'}`}>
                                        <ChatIcon size={20} className={`${chat.status === 'Canceled' ? 'text-red-400' : 'text-zinc-400'} group-hover:text-safety_gold transition-colors`} />
                                    </div>
                                    <div className="flex flex-col min-w-0 gap-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-semibold text-zinc-200 truncate">{chat.title}</h3>
                                            <span className="text-[10px] font-mono text-zinc-500 px-1.5 py-0.5 rounded bg-white/5">{chat.model}</span>
                                            {chat.status === 'Canceled' && (
                                                <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded">CANCELED</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-zinc-500 truncate">{chat.preview}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 mt-4 md:mt-0 pl-4 md:pl-0 border-t md:border-t-0 border-white/5 w-full md:w-auto pt-3 md:pt-0">
                                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                                        <CalendarIcon size={12} />
                                        {new Date(chat.date).toLocaleString(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: 'numeric',
                                            minute: 'numeric',
                                        })}
                                    </div>
                                    <div className="hidden md:block w-px h-8 bg-white/5" />
                                    <div className="flex items-center gap-4 text-zinc-400">
                                        <span className={`text-xs ${chat.verdict_color || 'text-zinc-400'}`}>{chat.status}</span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={(e) => handleDeleteClick(e, chat.id)}
                                                className="p-2 rounded-full hover:bg-white/10 text-zinc-500 hover:text-red-400 transition-colors"
                                                title="Delete Conversation"
                                            >
                                                <TrashIcon size={16} dangerHover={true} shakeOnClick={true} />
                                            </button>
                                            <button className="p-2 rounded-full hover:bg-white/10 text-zinc-500 hover:text-white transition-colors">
                                                <ChevronRightIcon size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Conversation"
                message="Are you sure you want to permanently delete this conversation? This action cannot be undone."
                confirmText="Delete Forever"
                isLoading={isDeleting}
                type="danger"
            />
        </div>
    );
}
