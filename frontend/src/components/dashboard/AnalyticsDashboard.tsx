import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowUpRight, ArrowDownRight, CircleDollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import ChartLineIcon from "../ui/icons/ChartLineIcon";
import PenIcon from "../ui/icons/PenIcon";
import CurrencyRupeeIcon from "../ui/icons/CurrencyRupeeIcon";
import ShieldScanIcon from "../ui/icons/ShieldScanIcon";
import CartIcon from "../ui/icons/CartIcon";

interface AnalyticsData {
    safety_score: number;
    total_tokens: number;
    est_cost: number;
    stats: {
        title: string;
        value: string;
        change: string;
        trend: string;
        color: string;
    }[];
    recent_alerts: {
        id: string;
        type: string;
        source: string;
        time: string;
        status: string;
    }[];
    traffic_chart: {
        name: string;
        requests: number;
        blocked: number;
    }[];
}

const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border border-white/10 bg-zinc_dark/95 p-3 shadow-xl backdrop-blur-xl">
                <p className="mb-2 font-mono text-xs text-zinc-400">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-xs font-medium text-zinc-200">
                            {entry.name}: {entry.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const AnalyticsCard = ({ stat, index, IconComponent, iconColor }: {
    stat: { title: string; value: string; trend: string; change: string },
    index: number,
    IconComponent: React.ComponentType<{ ref?: any; size: number; className: string }>,
    iconColor: string
}) => {
    const iconRef = useRef<any>(null);
    const isHoveredRef = useRef(false);

    useEffect(() => {
        // Initial animation on mount
        setTimeout(() => {
            if (iconRef.current?.startAnimation) {
                iconRef.current.startAnimation();
            }
        }, 500 + (index * 100)); // Staggered initial animation

        const interval = setInterval(() => {
            // Only animate periodically if hovered
            if (isHoveredRef.current && iconRef.current?.startAnimation) {
                iconRef.current.startAnimation();
            }
        }, 7000);

        return () => clearInterval(interval);
    }, [index]);

    const handleHover = () => {
        isHoveredRef.current = true;
        if (iconRef.current?.startAnimation) {
            iconRef.current.startAnimation();
        }
    };

    const handleLeave = () => {
        isHoveredRef.current = false;
        if (iconRef.current?.stopAnimation) {
            iconRef.current.stopAnimation();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-5 rounded-2xl bg-gradient-to-br from-zinc-900/80 to-black/80 border border-white/5 backdrop-blur-md relative overflow-hidden group hover:border-white/10 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,0,0,0.5)]"
            onMouseEnter={handleHover}
            onMouseLeave={handleLeave}
        >
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none group-hover:scale-110 transform">
                <IconComponent ref={iconRef} size={64} className={iconColor} />
            </div>

            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />

            <div className="flex flex-col gap-2 relative z-10 w-full h-full justify-between">
                <div>
                    <div className="flex items-center justify-between">
                        <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest">{stat.title}</p>
                    </div>
                    <h3 className="text-3xl font-bold text-white mt-2 tracking-tight">{stat.value}</h3>
                </div>

                <div className="flex items-center gap-2 text-xs mt-2 border-t border-white/5 pt-3">
                    <span className={cn(
                        "flex items-center px-1.5 py-0.5 rounded-full bg-white/5 border border-white/5",
                        stat.trend === "up" ? "text-emerald-400" : stat.trend === "down" ? "text-red-400" : "text-zinc-400"
                    )}>
                        {stat.trend === "up" ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowDownRight size={12} className="mr-1" />}
                        {stat.change}
                    </span>
                    <span className="text-zinc-600">vs last period</span>
                </div>
            </div>
        </motion.div>
    );
};

import { useSystem } from "@/context/SystemContext";

export default function AnalyticsDashboard() {
    const { userData } = useSystem();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState("24h");

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    useEffect(() => {
        setLoading(true);
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/analytics?range=${timeRange.toLowerCase()}`, {
            headers: {
                'X-Bento-Secret-Key': 'sk-demo-key'
            }
        })
            .then(res => res.json())
            .then(data => {
                setData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch analytics", err);
                setLoading(false);
            });
    }, [timeRange]);

    const getIcon = (title: string) => {
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes("total")) return ChartLineIcon;
        if (lowerTitle.includes("tokens") || lowerTitle.includes("processed")) return CartIcon;
        if (lowerTitle.includes("cost") || lowerTitle.includes("saved") || lowerTitle.includes("inr")) return CurrencyRupeeIcon;
        if (lowerTitle.includes("pii") || lowerTitle.includes("detected")) return ShieldScanIcon;
        if (lowerTitle.includes("violations")) return PenIcon;
        return CircleDollarSign;
    };

    if (loading) {
        return (
            <div className="flex flex-col gap-6 h-full p-4 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 rounded-2xl bg-zinc_dark/50 border border-white/5 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 animate-shimmer" />
                            <div className="p-5 flex flex-col gap-3">
                                <div className="h-3 w-24 bg-zinc-800 rounded animate-pulse" />
                                <div className="h-8 w-32 bg-zinc-800 rounded animate-pulse" />
                                <div className="h-3 w-16 bg-zinc-800 rounded animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 h-full p-4 overflow-y-auto scrollbar-hide">
            {/* Header / Greeting */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-2"
            >
                <h1 className="text-3xl font-bold text-white tracking-tight">
                    {getGreeting()}, <span className="text-safety_gold">{userData?.name || "Member"}</span>
                </h1>
                <p className="text-zinc-500 text-sm mt-1">
                    System operational. {(data?.recent_alerts || []).length} interventions recorded today.
                </p>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {data && data.stats?.map((stat, i) => {
                    const IconComponent = getIcon(stat.title);

                    const isTotal = stat.title.toLowerCase().includes("total");
                    const isPII = stat.title.toLowerCase().includes("pii") || stat.title.toLowerCase().includes("detected");
                    const isViolations = stat.title.toLowerCase().includes("violations");
                    const isSaved = stat.title.toLowerCase().includes("cost") || stat.title.toLowerCase().includes("saved") || stat.title.toLowerCase().includes("inr");
                    const isTokens = stat.title.toLowerCase().includes("tokens") || stat.title.toLowerCase().includes("processed");

                    // Keep existing color logic but make consistent
                    let iconColor = "text-zinc-500";
                    let bgGlow = "bg-zinc-500/10";

                    if (isTotal) { iconColor = "text-sky-400"; bgGlow = "bg-sky-500/10"; }
                    else if (isPII) { iconColor = "text-emerald-400"; bgGlow = "bg-emerald-500/10"; }
                    else if (isViolations) { iconColor = "text-amber-400"; bgGlow = "bg-amber-500/10"; }
                    else if (isSaved) { iconColor = "text-safety_gold"; bgGlow = "bg-safety_gold/10"; }
                    else if (isTokens) { iconColor = "text-purple-400"; bgGlow = "bg-purple-500/10"; } // Add specific color for tokens

                    return (
                        <AnalyticsCard
                            key={stat.title}
                            stat={stat}
                            index={i}
                            IconComponent={IconComponent}
                            iconColor={iconColor}
                        />
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[300px]">
                {/* Main Chart Area */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 rounded-2xl bg-zinc_dark/30 border border-white/5 p-6 flex flex-col"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="text-sm font-medium text-white">Traffic Volume</h4>
                        <div className="flex gap-2">
                            {["1H", "24H", "7D", "30D"].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setTimeRange(t.toLowerCase())}
                                    className={cn(
                                        "px-2 py-1 text-[10px] rounded transition-colors",
                                        timeRange === t.toLowerCase() ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 w-full min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.traffic_chart || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#52525b"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#52525b"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#ffffff05' }} />
                                <Legend
                                    content={({ payload }) => (
                                        <div className="flex items-center justify-center gap-6 pt-6">
                                            {payload?.map((entry, index) => (
                                                <div key={`legend-${index}`} className="flex items-center gap-2">
                                                    <div
                                                        className="w-3 h-3 rounded-sm"
                                                        style={{ backgroundColor: entry.color }}
                                                    />
                                                    <span className="text-xs text-zinc-400 font-light">
                                                        {entry.value}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                />
                                <Bar
                                    dataKey="requests"
                                    name="Total Requests"
                                    fill="#fbbf24"
                                    radius={[4, 4, 0, 0]}
                                    barSize={20}
                                />
                                <Bar
                                    dataKey="blocked"
                                    name="Threats Blocked"
                                    fill="#ef4444"
                                    radius={[4, 4, 0, 0]}
                                    barSize={20}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Recent Alerts List */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="rounded-2xl bg-zinc_dark/30 border border-white/5 p-6 flex flex-col"
                >
                    <h4 className="text-sm font-medium text-white mb-4">Recent Interventions</h4>
                    <div className="flex flex-col gap-3 overflow-y-auto max-h-[400px] scrollbar-hide">
                        {data?.recent_alerts?.map((alert) => (
                            <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "h-2 w-2 rounded-full",
                                        alert.status === "FLAGGED" ? "bg-red-500" : "bg-emerald-500"
                                    )} />
                                    <div className="flex flex-col">
                                        <span className="text-xs text-zinc-200 font-medium group-hover:text-white capitalize">{alert.type}</span>
                                        <span className="text-[10px] text-zinc-500">{alert.source}</span>
                                    </div>
                                </div>
                                <span className="text-[10px] text-zinc-600 font-mono">
                                    {new Date(alert.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))}
                        {(!data?.recent_alerts || data.recent_alerts.length === 0) && (
                            <div className="text-center text-zinc-500 py-8 text-xs">No alerts recorded yet.</div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
