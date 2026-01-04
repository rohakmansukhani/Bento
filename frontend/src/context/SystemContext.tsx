"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";

const supabase = createClient();

interface HealthData {
    status: "healthy" | "degraded" | "error";
    latency?: number;
    db?: string;
    lastChecked: string;
}

interface UserData {
    name: string;
    email: string;
    avatar_url?: string;
}

interface SystemContextType {
    health: HealthData;
    terminalLogs: string[];
    safetyScore: number;
    userData: UserData | null;

    // Actions
    addSystemLog: (log: string, timeOverride?: string) => void;
    updateSafetyScore: (delta: number) => void;
    refreshHealth: () => Promise<void>;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export function SystemProvider({ children }: { children: ReactNode }) {
    const [health, setHealth] = useState<HealthData>({
        status: "healthy",
        lastChecked: new Date().toISOString()
    });
    const [terminalLogs, setTerminalLogs] = useState<string[]>([
        "> SYSTEM_INIT_COMPLETE",
        "> CONNECTED_TO_BENTO_SHIELD_V1"
    ]);
    const [safetyScore, setSafetyScore] = useState(100);
    const [userData, setUserData] = useState<UserData | null>(null);

    // Fetch User Data
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Try to get name from metadata, fallback to email prefix
                const name = user.user_metadata?.full_name || user.email?.split('@')[0] || "User";
                setUserData({
                    name,
                    email: user.email || "",
                    avatar_url: user.user_metadata?.avatar_url
                });
            }
        };
        fetchUser();
    }, []);

    // Health Polling
    const refreshHealth = useCallback(async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/health`, {
                cache: 'no-store'
            });

            if (!res.ok) throw new Error("API Offline");

            const data = await res.json();
            setHealth({
                status: data.status === "healthy" ? "healthy" : "degraded",
                latency: 45, // Placeholder for now, could be calculated
                db: data.checks?.database?.status || "unknown",
                lastChecked: new Date().toISOString()
            });
        } catch {
            setHealth({
                status: "error",
                lastChecked: new Date().toISOString()
            });
        }
    }, []);

    useEffect(() => {
        refreshHealth();
        const interval = setInterval(refreshHealth, 30000); // 30s polling
        return () => clearInterval(interval);
    }, [refreshHealth]);

    // System Logs
    const addSystemLog = useCallback((log: string, timeOverride?: string) => {
        const timestamp = timeOverride || new Date().toLocaleTimeString('en-US', { hour12: false });
        setTerminalLogs(prev => {
            const newLogs = [...prev, `[${timestamp}] ${log}`];
            return newLogs.slice(-100); // Keep last 100 logs
        });
    }, []);

    // Realtime System Sync (Supabase)
    useEffect(() => {
        const channel = supabase
            .channel('realtime_logs')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'audit_logs' },
                (payload) => {
                    const log = payload.new;
                    const verdict = log.verdict || "UNKNOWN";
                    const source = log.metadata?.source || "SYSTEM";
                    const idShort = log.id ? log.id.substring(0, 8) : "????";
                    const ledgerEntry = `LEDGER: [${verdict}] (${source}) #${idShort}`;
                    const serverTime = log.created_at
                        ? new Date(log.created_at).toLocaleTimeString('en-US', { hour12: false })
                        : undefined;

                    addSystemLog(ledgerEntry, serverTime);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [addSystemLog]);

    // Initial Safety Score Fetch
    useEffect(() => {
        const fetchScore = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/analytics?range=24h`, {
                    headers: { 'X-Bento-Secret-Key': 'sk-demo-key' }
                });
                if (res.ok) {
                    const data = await res.json();
                    setSafetyScore(data.safety_score || 100);
                }
            } catch (e) {
                console.error("Failed to fetch score", e);
            }
        };
        fetchScore();
    }, []);

    return (
        <SystemContext.Provider value={{
            health,
            terminalLogs,
            safetyScore,
            userData,
            addSystemLog,
            updateSafetyScore: (delta: number) => setSafetyScore(prev => Math.min(100, Math.max(0, prev + delta))),
            refreshHealth
        }}>
            {children}
        </SystemContext.Provider>
    );
}

export function useSystem() {
    const context = useContext(SystemContext);
    if (context === undefined) {
        throw new Error("useSystem must be used within a SystemProvider");
    }
    return context;
}
