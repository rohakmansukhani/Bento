"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { usePolicy } from "./PolicyContext";
import { useSystem } from "./SystemContext";

// Types
export type Message = {
    id: number;
    text: string;
    sender: "user" | "ai";
    status?: "sending" | "scanning" | "verified" | "warning" | "insecure" | "glitch" | "canceled";
    timestamp: string;
    receipt?: {
        latency_ms: number;
        engine: string;
        scrubbed_count: number;
        policy_id?: string;
    };
};

type ChatStatus = "IDLE" | "SCANNING" | "INTERCEPTED" | "RESUMING";

interface ChatContextType {
    messages: Message[];
    status: ChatStatus;
    pendingBlockingId: string | null;
    redactedPreview: string | null;
    violationDetails: string | null;
    hits: { type: string; value: string; context: string }[] | null;
    lastBlockedInput: string | null;

    // Actions
    sendMessage: (text: string, model?: string) => Promise<void>;
    confirmAction: () => Promise<void>;
    bypassAction: () => Promise<void>;
    cancelAction: () => Promise<void>;
    clearBlockedInput: () => void;
    loadConversation: (id: string) => Promise<void>;
    resetChat: () => void;

    // UI State
    activeTab: string;
    setUiTab: (tab: string) => void;

    // Model State
    activeModel: { id: string, name: string, provider: string };
    setActiveModel: (model: { id: string, name: string, provider: string }) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
    const { policyConfig } = usePolicy();
    const { addSystemLog, updateSafetyScore } = useSystem();

    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: "Bento System initialized. Protection active.", sender: "ai", timestamp: "Now" }
    ]);
    const [conversationId, setConversationId] = useState<string>("");
    const [status, setStatus] = useState<ChatStatus>("IDLE");
    const [pendingBlockingId, setPendingBlockingId] = useState<string | null>(null);
    const [redactedPreview, setRedactedPreview] = useState<string | null>(null);
    const [violationDetails, setViolationDetails] = useState<string | null>(null);
    const [hits, setHits] = useState<{ type: string; value: string; context: string }[] | null>(null);
    const [lastBlockedInput, setLastBlockedInput] = useState<string | null>(null);
    const [activeTab, setActiveTabInternal] = useState("overview");
    const [activeModel, setActiveModel] = useState({ id: "gemini", name: "GEMINI PRO", provider: "Google" });

    useEffect(() => {
        setConversationId(crypto.randomUUID());
    }, []);

    const setUiTab = (tab: string) => setActiveTabInternal(tab);

    const resetChat = () => {
        setMessages([{ id: Date.now(), text: "Bento System initialized. Protection active.", sender: "ai", timestamp: "Now" }]);
        setStatus("IDLE");
        setPendingBlockingId(null);
        setRedactedPreview(null);
        setViolationDetails(null);
        setHits(null);
        setLastBlockedInput(null);
        setConversationId(crypto.randomUUID());
        addSystemLog(`SYSTEM: New session initialized.`);
    };

    const clearBlockedInput = () => setLastBlockedInput(null);

    const loadConversation = async (id: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/history/${id}`, {
                headers: { 'X-Bento-Secret-Key': 'sk-demo-key' }
            });

            if (!res.ok) throw new Error("Failed to fetch conversation");
            const data = await res.json();

            // Handle nested messages array if exists
            if (data.messages && Array.isArray(data.messages)) {
                const restoredMessages: Message[] = data.messages.map((msg: { content?: string; role?: string; status?: string; timestamp?: string }, index: number) => ({
                    id: Date.now() + index,
                    text: msg.content || (msg.role === 'ai' || msg.role === 'assistant' ? "System: Content not available." : "User: Content not available."),
                    sender: (msg.role === 'user') ? 'user' : 'ai',
                    status: (msg.status as Message["status"]) || 'verified',
                    timestamp: msg.timestamp ? new Date(msg.timestamp).toLocaleString() : "Unknown",
                    receipt: { latency_ms: 0, engine: "Archive", scrubbed_count: 0 }
                }));
                setMessages(restoredMessages);
            } else if (data.input) {
                // Fallback for flat legacy response
                const restoredMessages: Message[] = [];
                restoredMessages.push({
                    id: Date.now(),
                    text: data.input,
                    sender: "user",
                    timestamp: data.created_at ? new Date(data.created_at).toLocaleTimeString() : "Now"
                });

                let aiText = "Start of restored session.";
                let status: Message["status"] = "verified";

                if (data.verdict === "ALLOWED") {
                    aiText = "Transmission allowed. Secure channel active.";
                    status = "verified";
                } else if (data.verdict === "FLAGGED") {
                    aiText = `Security Alert: ${data.reasoning || "Potential policy violation detected."}`;
                    status = "warning";
                } else if (data.verdict === "REJECTED") {
                    aiText = `Transmission Blocked: ${data.reasoning || "Content violates security policy."}`;
                    status = "insecure";
                }

                restoredMessages.push({
                    id: Date.now() + 1,
                    text: aiText,
                    sender: "ai",
                    timestamp: data.created_at ? new Date(data.created_at).toLocaleTimeString() : "Now",
                    status: status,
                    receipt: { latency_ms: 0, engine: "Archive", scrubbed_count: 0 }
                });
                setMessages(restoredMessages);
            }

            setConversationId(id);
            setStatus("IDLE");
            setUiTab("chat");
            addSystemLog(`RESTORED: Conversation #${id.substring(0, 8)} loaded.`);
        } catch (error) {
            console.error("Failed to restore conversation:", error);
            addSystemLog(`ERROR: Failed to restore conversation #${id.substring(0, 8)}`);
        }
    };

    const sendMessage = async (text: string, modelOverride?: string) => {
        const model = modelOverride || activeModel.id;
        const newMsg: Message = { id: Date.now(), text, sender: "user", status: "scanning", timestamp: "Now" };
        setMessages(prev => [...prev, newMsg]);
        setStatus("SCANNING");
        setLastBlockedInput(text);

        addSystemLog(`INGEST: HEADERS_CHECK... OK`);
        addSystemLog(`SCAN: ANALYZING_PAYLOAD (${text.length} bytes)...`);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/intercept`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Bento-Secret-Key": "sk-demo-key"
                },
                body: JSON.stringify({
                    payload: { input: text, model: model },
                    source: "web-dashboard",
                    policy_config: policyConfig,
                    metadata: { conversation_id: conversationId }
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Server Error: ${response.status}`);
            }

            const data = await response.json();

            if (data.status === "REQUIRES_CONFIRMATION") {
                setStatus("INTERCEPTED");
                setPendingBlockingId(data.pending_id);
                setRedactedPreview(data.redacted_payload?.input || "Content Redacted");
                setViolationDetails(data.violation_details || "Potential PII Detected");
                setHits(data.hits || null);
                setLastBlockedInput(text);
                addSystemLog(`ALERT: THREAT_DETECTED [${data.pending_id}]`);
            } else {
                setStatus("IDLE");
                setLastBlockedInput(null);
                setMessages(prev => prev.map(m => m.id === newMsg.id ? {
                    ...m, status: "verified", receipt: data.receipt
                } : m));

                const aiResponseText = data.ai_response || `(System): Payload valid. Forwarded securely to ${model}.`;
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    text: aiResponseText,
                    sender: "ai",
                    timestamp: "Now",
                    status: "verified",
                    receipt: data.receipt
                }]);
                addSystemLog(`SHIELD: SCAN_COMPLETE (0 hits)`);
            }
        } catch (error: unknown) {
            const err = error instanceof Error ? error : new Error("Unknown error");
            console.error("Intercept failed:", err);
            setStatus("IDLE");
            setLastBlockedInput(null);
            addSystemLog(`ERROR: ${err.message || "BACKEND_CONNECTION_FAILED"}`);
            setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: "glitch" } : m));
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: `System Error: ${err.message || "Could not reach security gateway."}`,
                sender: "ai",
                timestamp: "Now"
            }]);
        }
    };

    const confirmAction = async () => {
        if (!pendingBlockingId) return;
        setStatus("RESUMING");
        addSystemLog(`ACTION: ADMIN_OVERRIDE_GRANTED`);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/intercept/confirm`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-Bento-Secret-Key": "sk-demo-key" },
                body: JSON.stringify({ pending_id: pendingBlockingId, choice: "SAFE" })
            });

            const data = await response.json();
            setStatus("IDLE");
            setPendingBlockingId(null);
            setRedactedPreview(null);
            setLastBlockedInput(null);
            updateSafetyScore(1);

            setMessages(prev => {
                const lastUserMsg = [...prev].reverse().find(m => m.sender === 'user');
                if (lastUserMsg) {
                    return prev.map(m => m.id === lastUserMsg.id ? { ...m, status: 'verified', receipt: data.receipt } : m);
                }
                return prev;
            });

            if (data.ai_response) {
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    text: data.ai_response,
                    sender: "ai",
                    timestamp: "Now",
                    status: "verified",
                    receipt: data.receipt
                }]);
            }
        } catch (error) {
            console.error("Confirm failed:", error);
            setStatus("IDLE");
        }
    };

    const bypassAction = async () => {
        if (!pendingBlockingId) return;
        setStatus("RESUMING");
        addSystemLog(`WARN: SECURITY_PROTOCOL_BYPASSED (User Override)`);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/intercept/confirm`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-Bento-Secret-Key": "sk-demo-key" },
                body: JSON.stringify({ pending_id: pendingBlockingId, choice: "ORIGINAL" })
            });

            const data = await response.json();
            setStatus("IDLE");
            setPendingBlockingId(null);
            setRedactedPreview(null);
            setLastBlockedInput(null);

            setMessages(prev => {
                const lastUserMsg = [...prev].reverse().find(m => m.sender === 'user');
                if (lastUserMsg) {
                    return prev.map(m => m.id === lastUserMsg.id ? { ...m, status: 'insecure', receipt: data.receipt } : m);
                }
                return prev;
            });

            const aiResponseText = data.ai_response || "I received the original data. (Shield Warning: Unredacted PII exposed)";
            setMessages(prev => [...prev, {
                id: Date.now(),
                text: aiResponseText,
                sender: "ai",
                timestamp: "Now",
                status: "insecure",
                receipt: data.receipt
            }]);
        } catch (error) {
            console.error("Bypass failed:", error);
            setStatus("IDLE");
        }
    };

    const cancelAction = async () => {
        if (pendingBlockingId) {
            try {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/cancel`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "X-Bento-Secret-Key": "sk-demo-key" },
                    body: JSON.stringify({ pending_id: pendingBlockingId, conversation_id: conversationId })
                });
            } catch (err) {
                console.error("Cancel API Error:", err);
            }
        }

        setStatus("IDLE");
        setPendingBlockingId(null);
        setRedactedPreview(null);

        setMessages(prev => {
            const lastUserMsgIndex = [...prev].map(m => m.sender).lastIndexOf('user');
            if (lastUserMsgIndex !== -1) {
                const newMessages = [...prev];
                newMessages.splice(lastUserMsgIndex, 1);
                return newMessages;
            }
            return prev;
        });

        addSystemLog(`ACTION: TERMINATED_BY_USER`);
    };

    return (
        <ChatContext.Provider value={{
            messages,
            status,
            pendingBlockingId,
            redactedPreview,
            violationDetails,
            hits,
            lastBlockedInput,
            loadConversation,
            resetChat,
            activeTab,
            setUiTab,
            sendMessage,
            confirmAction,
            bypassAction,
            cancelAction,
            clearBlockedInput,
            activeModel,
            setActiveModel
        }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error("useChat must be used within a ChatProvider");
    }
    return context;
}
