import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Server, Activity, ShieldAlert, Building2 } from "lucide-react";

export default function AdminPage() {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/admin/stats`, {
            headers: { 'X-Bento-Secret-Key': 'sk-demo-key' }
        })
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch admin stats");
                return res.json();
            })
            .then(data => setStats(data)) // Fixed: setStats handles the data
            .catch(err => {
                console.error(err);
                // Set fallback stats to avoid crashing
                setStats({
                    total_tenants: 0,
                    global_requests_24h: 0,
                    global_blocked_24h: 0,
                    system_health: "Offline",
                    tenants: []
                });
            });
    }, []);

    if (!stats) return <div className="p-10 text-zinc-500">Loading Admin Dashboard...</div>;

    return (
        <div className="flex flex-col gap-6 h-full p-6 overflow-hidden">
            <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-white tracking-tight">Global Admin View</h1>
                <p className="text-zinc-400 text-sm">System-wide monitoring and multi-tenant oversight.</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard title="Total Tenants" value={stats?.total_tenants || 0} icon={Building2} color="text-sky-400" />
                <MetricCard title="Global Requests (24h)" value={(stats?.global_requests_24h || 0).toLocaleString()} icon={Activity} color="text-emerald-400" />
                <MetricCard title="Blocked Threats" value={stats?.global_blocked_24h || 0} icon={ShieldAlert} color="text-red-400" />
                <MetricCard title="System Health" value={stats?.system_health || "Unknown"} icon={Server} color="text-safety_gold" />
            </div>

            {/* Tenant List */}
            <div className="flex-1 rounded-2xl bg-zinc_dark/30 border border-white/5 p-4 md:p-6 flex flex-col gap-4 overflow-hidden">
                <h3 className="font-semibold text-zinc-200">Tenant Status</h3>
                <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
                    <table className="w-full min-w-[600px] text-left text-sm text-zinc-400">
                        <thead className="text-xs uppercase text-zinc-500 border-b border-white/5">
                            <tr>
                                <th className="pb-3 pl-2">Tenant Name</th>
                                <th className="pb-3">Status</th>
                                <th className="pb-3">Requests</th>
                                <th className="pb-3">Risk Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {(stats?.tenants || []).map((t: any, i: number) => (
                                <tr key={i} className="group hover:bg-white/5 transition-colors">
                                    <td className="py-3 pl-2 font-medium text-zinc-200">{t.name}</td>
                                    <td className="py-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${t.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                            {t.status}
                                        </span>
                                    </td>
                                    <td className="py-3 font-mono">{t.requests.toLocaleString()}</td>
                                    <td className="py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${t.risk_score > 50 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${t.risk_score}%` }}
                                                />
                                            </div>
                                            <span className="text-xs">{t.risk_score}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, icon: Icon, color }: any) {
    return (
        <div className="p-4 rounded-xl bg-zinc_dark/50 border border-white/5 flex items-center gap-4">
            <div className={`p-3 rounded-lg bg-zinc-800/50 ${color}`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-zinc-500 text-xs font-mono uppercase">{title}</p>
                <p className="text-xl font-bold text-white">{value}</p>
            </div>
        </div>
    );
}
