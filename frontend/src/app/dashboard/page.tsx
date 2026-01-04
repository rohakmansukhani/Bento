"use client";

import FloatingNavbar from "@/components/ui/FloatingNavbar";
import ChatConsole from "@/components/dashboard/ChatConsole";
import ModelSelector from "@/components/dashboard/ModelSelector";
import ProfileSelector from "@/components/dashboard/ProfileSelector";
import InterventionModal from "@/components/dashboard/InterventionModal";
import ProfileOnboardingModal from "@/components/dashboard/ProfileOnboardingModal";
import BentoLogo from "@/components/ui/BentoLogo";

import AnalyticsDashboard from "@/components/dashboard/AnalyticsDashboard";
import SystemTerminal from "@/components/dashboard/SystemTerminal";
import HistoryPage from "@/components/dashboard/HistoryPage";
import PoliciesPage from "@/components/dashboard/PoliciesPage";
import AdminPage from "@/components/dashboard/AdminPage";

import { ChatProvider, useChat } from "@/context/ChatContext";
import { SystemProvider, useSystem } from "@/context/SystemContext";
import { PolicyProvider } from "@/context/PolicyContext";

export default function Home() {
  return (
    <SystemProvider>
      <PolicyProvider>
        <ChatProvider>
          <DashboardContent />
        </ChatProvider>
      </PolicyProvider>
    </SystemProvider>
  );
}

function DashboardContent() {
  const { activeTab, setUiTab, resetChat } = useChat();
  const { health } = useSystem();

  const handleNewChat = () => {
    resetChat();
    setUiTab("chat");
  };

  const getHealthColor = () => {
    if (health.status === "healthy") return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
    if (health.status === "degraded") return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]";
    return "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]";
  };

  const getHealthText = () => {
    if (health.status === "healthy") return "SHIELD ACTIVE";
    if (health.status === "degraded") return "PERFORMANCE DEGRADED";
    return "ENGINE OFFLINE";
  };

  return (
    <main className="relative flex h-screen w-full flex-col bg-obsidian text-zinc_text font-sans overflow-hidden selection:bg-safety_gold selection:text-obsidian">
      {/* Floating Navbar */}
      <FloatingNavbar activeTab={activeTab} setActiveTab={setUiTab} onNewChat={handleNewChat} />

      {/* Profile Onboarding Modal */}
      <ProfileOnboardingModal />

      {/* Header */}
      <header className="absolute top-0 left-0 w-full p-6 flex items-center justify-between z-40 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-4">
          <BentoLogo withText size={24} />
          {/* System Status Indicators */}
          <div className="group relative flex items-center justify-center h-8 w-8 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-help">
            <div className={`h-2 w-2 rounded-full ${getHealthColor()} animate-pulse`} />
            {/* Tooltip */}
            <div className="absolute top-full left-0 mt-2 w-48 p-3 rounded-lg border border-white/10 bg-zinc_dark/95 backdrop-blur-xl shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all pointer-events-none">
              <p className="text-[10px] font-mono text-zinc-400 mb-1">SYSTEM STATUS</p>
              <p className={`text-xs font-medium ${health.status === 'healthy' ? 'text-emerald-400' : health.status === 'degraded' ? 'text-amber-400' : 'text-rose-400'}`}>
                {getHealthText()}
              </p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-[8px] font-mono">
                  <span className="text-zinc-500">Latency</span>
                  <span className="text-zinc-300">{health.latency || '--'}ms</span>
                </div>
                <div className="flex justify-between text-[8px] font-mono">
                  <span className="text-zinc-500">Database</span>
                  <span className={health.db === 'healthy' ? 'text-emerald-500' : 'text-rose-500'}>
                    {health.db || 'offline'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="pointer-events-auto flex items-center gap-3">
          {activeTab === "chat" && <ProfileSelector />}
          {activeTab === "chat" && <ModelSelector />}
        </div>
      </header>

      <section className="relative flex flex-1 flex-col min-w-0 pt-20 pb-24 md:pb-0 px-4 md:px-8 ml-0 md:ml-20 h-full overflow-hidden">
        <div className="flex-1 h-full w-full max-w-7xl mx-auto">
          {activeTab === "overview" && <AnalyticsDashboard />}
          {activeTab === "chat" && <ChatConsole />}
          {activeTab === "terminal" && <SystemTerminal />}
          {activeTab === "history" && <HistoryPage />}
          {activeTab === "policies" && <PoliciesPage />}
          {activeTab === "admin" && <AdminPage />}
        </div>
      </section>

      {/* Intervention Modal */}
      <InterventionModalWrapper />

    </main>
  );
}

function InterventionModalWrapper() {
  const { status, violationDetails, redactedPreview, hits, confirmAction, bypassAction, cancelAction } = useChat();

  return (
    <InterventionModal
      isOpen={status === "INTERCEPTED"}
      violationDetails={violationDetails || "Security Policy Violation Detected"}
      redactedPreview={redactedPreview || "Content Redacted"}
      hits={hits || []}
      onConfirmSafe={confirmAction}
      onConfirmUnsafe={bypassAction}
      onCancel={cancelAction}
    />
  );
}
