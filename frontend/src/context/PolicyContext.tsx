"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase";

const supabase = createClient();

// Types
export type ProfileId = string;

export interface PolicyProfile {
    id: ProfileId;
    name: string;
    icon_name: string;
    color: string;
    description: string;
    toggles: {
        email: boolean;
        phone: boolean;
        names: boolean;
        payment: boolean;
        location: boolean;
        credentials: boolean;
    };
    customKeywords: string[];
}

interface PolicyContextType {
    activeProfileId: ProfileId | null;
    setActiveProfileId: (id: ProfileId) => Promise<void>;
    profiles: Record<ProfileId, PolicyProfile>;
    profilesLoaded: boolean;
    policyConfig: {
        redact_email?: boolean;
        redact_phone?: boolean;
        redact_person?: boolean;
        redact_payment?: boolean;
        redact_location?: boolean;
        redact_credentials?: boolean;
        custom_keywords: string[];
        auditor_prompt: string;
    };

    // Actions
    addProfile: (name: string, icon: string, color: string, toggles?: PolicyProfile['toggles'], customKeywords?: string[]) => Promise<void>;
    deleteProfile: (profileId: ProfileId) => Promise<void>;
    updateProfileToggle: (profileId: ProfileId, key: keyof PolicyProfile['toggles'], value: boolean) => Promise<void>;
    updateCustomKeywords: (profileId: ProfileId, keywords: string[]) => Promise<void>;
}

const PolicyContext = createContext<PolicyContextType | undefined>(undefined);

export function PolicyProvider({ children }: { children: ReactNode }) {
    const [activeProfileId, setActiveProfileIdInternal] = useState<ProfileId | null>(null);
    const [profiles, setProfiles] = useState<Record<ProfileId, PolicyProfile>>({});
    const [profilesLoaded, setProfilesLoaded] = useState(false);

    // Helper to get auth headers with Supabase JWT
    const getAuthHeaders = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
            throw new Error("Not authenticated");
        }
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
        };
    };

    // Load profiles from backend on mount
    useEffect(() => {
        const loadProfiles = async () => {
            try {
                const headers = await getAuthHeaders();
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/profiles/status`, {
                    headers
                });

                if (!res.ok) throw new Error('Failed to load profiles');

                const data = await res.json();

                if (data.setup_required) {
                    setActiveProfileIdInternal(null);
                    setProfiles({});
                } else {
                    const profilesMap: Record<ProfileId, PolicyProfile> = {};
                    data.profiles.forEach((p: {
                        id: string;
                        name: string;
                        icon_name: string;
                        color: string;
                        description: string;
                        redact_email: boolean;
                        redact_phone: boolean;
                        redact_names: boolean;
                        redact_payment: boolean;
                        redact_location: boolean;
                        redact_credentials: boolean;
                        custom_keywords?: string[];
                    }) => {
                        profilesMap[p.id] = {
                            id: p.id,
                            name: p.name,
                            icon_name: p.icon_name,
                            color: p.color,
                            description: p.description,
                            toggles: {
                                email: p.redact_email,
                                phone: p.redact_phone,
                                names: p.redact_names,
                                payment: p.redact_payment,
                                location: p.redact_location,
                                credentials: p.redact_credentials
                            },
                            customKeywords: p.custom_keywords || []
                        };
                    });
                    setProfiles(profilesMap);
                    setActiveProfileIdInternal(data.active_profile_id);
                }
                setProfilesLoaded(true);
            } catch (e) {
                console.error('Failed to load profiles:', e);
                setProfilesLoaded(true);
            }
        };

        loadProfiles();
    }, []);

    // Computed Policy Config for Backend
    const policyConfig = useMemo(() => {
        if (!activeProfileId || !profiles[activeProfileId]) {
            return {
                custom_keywords: [],
                auditor_prompt: "Standard security protocols active."
            };
        }
        const p = profiles[activeProfileId];
        return {
            redact_email: p.toggles.email,
            redact_phone: p.toggles.phone,
            redact_person: p.toggles.names,
            redact_payment: p.toggles.payment,
            redact_location: p.toggles.location,
            redact_credentials: p.toggles.credentials,
            custom_keywords: p.customKeywords,
            auditor_prompt: `You are a compliance officer for ${p.name} context. Policy: ${p.name}.`
        };
    }, [activeProfileId, profiles]);

    const addProfile = async (
        name: string,
        icon: string,
        color: string,
        toggles?: PolicyProfile['toggles'],
        customKeywords?: string[]
    ) => {
        try {
            const headers = await getAuthHeaders();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/profiles`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    name,
                    icon_name: icon,
                    color,
                    toggles: toggles || {
                        email: true,
                        phone: true,
                        names: true,
                        payment: true,
                        location: true,
                        credentials: true
                    },
                    custom_keywords: customKeywords || []
                })
            });

            if (!res.ok) throw new Error('Failed to create profile');

            const newProfile = await res.json();

            const profileData: PolicyProfile = {
                id: newProfile.id,
                name: newProfile.name,
                icon_name: newProfile.icon_name,
                color: newProfile.color,
                description: newProfile.description,
                toggles: {
                    email: newProfile.redact_email,
                    phone: newProfile.redact_phone,
                    names: newProfile.redact_names,
                    payment: newProfile.redact_payment,
                    location: newProfile.redact_location,
                    credentials: newProfile.redact_credentials
                },
                customKeywords: newProfile.custom_keywords || []
            };

            setProfiles(prev => ({ ...prev, [newProfile.id]: profileData }));
            setActiveProfileIdInternal(newProfile.id);
        } catch (e) {
            console.error('Failed to create profile:', e);
            throw e;
        }
    };

    const updateProfileToggle = async (pid: ProfileId, key: keyof PolicyProfile['toggles'], value: boolean) => {
        const originalProfiles = { ...profiles };
        setProfiles(prev => ({
            ...prev,
            [pid]: {
                ...prev[pid],
                toggles: { ...prev[pid].toggles, [key]: value }
            }
        }));

        try {
            const profile = profiles[pid];
            const updatedToggles = { ...profile.toggles, [key]: value };

            const headers = await getAuthHeaders();
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/profiles/${pid}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ toggles: updatedToggles })
            });
        } catch (e) {
            console.error('Failed to update profile toggle:', e);
            setProfiles(originalProfiles);
            throw e;
        }
    };

    const updateCustomKeywords = async (pid: ProfileId, keywords: string[]) => {
        const originalKeywords = profiles[pid]?.customKeywords;
        setProfiles(prev => ({
            ...prev,
            [pid]: { ...prev[pid], customKeywords: keywords }
        }));

        try {
            const headers = await getAuthHeaders();
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/profiles/${pid}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ custom_keywords: keywords })
            });
        } catch (e) {
            console.error('Failed to update custom keywords:', e);
            setProfiles(prev => ({
                ...prev,
                [pid]: { ...prev[pid], customKeywords: originalKeywords }
            }));
            throw e;
        }
    };

    const setActiveProfileId = async (pid: ProfileId) => {
        try {
            const headers = await getAuthHeaders();
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/profiles/${pid}/activate`, {
                method: 'POST',
                headers
            });

            setActiveProfileIdInternal(pid);
        } catch (e) {
            console.error('Failed to activate profile:', e);
            throw e;
        }
    };

    const deleteProfile = async (pid: ProfileId) => {
        try {
            const headers = await getAuthHeaders();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/profiles/${pid}`, {
                method: 'DELETE',
                headers
            });

            if (!res.ok) throw new Error('Failed to delete profile');

            setProfiles(prev => {
                const newProfiles = { ...prev };
                delete newProfiles[pid];
                return newProfiles;
            });

            if (activeProfileId === pid) {
                setActiveProfileIdInternal(null);
            }
        } catch (e) {
            console.error('Failed to delete profile:', e);
            throw e;
        }
    };

    return (
        <PolicyContext.Provider value={{
            activeProfileId,
            setActiveProfileId,
            profiles,
            profilesLoaded,
            policyConfig,
            addProfile,
            deleteProfile,
            updateProfileToggle,
            updateCustomKeywords
        }}>
            {children}
        </PolicyContext.Provider>
    );
}

export function usePolicy() {
    const context = useContext(PolicyContext);
    if (context === undefined) {
        throw new Error("usePolicy must be used within a PolicyProvider");
    }
    return context;
}
