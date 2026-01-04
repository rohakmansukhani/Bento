import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ArrowRight, Check, X, Building, Lock } from "lucide-react";
import { useChat } from "@/context/ChatContext";
import { usePolicy } from "@/context/PolicyContext";
import { useSystem } from "@/context/SystemContext";

export default function PolicyWizard({ onClose }: { onClose: () => void }) {
    const { addSystemLog } = useSystem();
    const { addProfile } = usePolicy();
    const [step, setStep] = useState(0);

    const [answers, setAnswers] = useState({
        industry: "", // "finance", "health", "tech"
        dataTypes: [] as string[], // "email", "phone", "names"
        strictness: "balanced" // "loose", "balanced", "strict"
    });

    const toggleData = (type: string) => {
        if (answers.dataTypes.includes(type)) {
            setAnswers(prev => ({ ...prev, dataTypes: prev.dataTypes.filter(t => t !== type) }));
        } else {
            setAnswers(prev => ({ ...prev, dataTypes: [...prev.dataTypes, type] }));
        }
    };

    const finishWizard = async () => {
        // Generate Config Logic
        const toggles = {
            email: answers.dataTypes.includes("email") || answers.strictness === "strict",
            phone: answers.dataTypes.includes("phone") || answers.strictness === "strict",
            names: answers.dataTypes.includes("names") || answers.strictness === "strict",
            payment: answers.industry === "finance" || answers.strictness === "strict",
            location: false,
            credentials: answers.strictness === "strict"
        };

        await addProfile(
            `${answers.industry.charAt(0).toUpperCase() + answers.industry.slice(1)} Policy`,
            "Briefcase",
            "text-amber-400",
            toggles,
            []
        );

        addSystemLog("SYSTEM: NEW_POLICY_GENERATED_FROM_WIZARD");
        onClose();
    };

    const generatePrompt = (a: typeof answers) => {
        let prompt = "You are a specialized AI auditor. ";

        if (a.industry === "finance") prompt += "Your focus is protecting financial data and preventing insider trading leaks. ";
        if (a.industry === "health") prompt += "Your focus is HIPAA compliance and protecting patient PHI. ";
        if (a.industry === "tech") prompt += "Your focus is preventing IP leakage and source code exposure. ";

        if (a.strictness === "strict") prompt += "Be EXTREMELY strict. Block anything that looks remotely sensitive. ";
        if (a.strictness === "loose") prompt += "Be permissive. Only block explicit violations. ";

        return prompt;
    };

    const steps = [
        {
            title: "Welcome to Bento Shield",
            content: (
                <div className="space-y-4">
                    <p className="text-zinc-400">Let's configure your AI security perimeter in 3 simple steps.</p>
                    <button
                        onClick={() => setStep(1)}
                        className="w-full py-3 bg-safety_gold text-black font-bold rounded-xl hover:bg-amber-400 transition-colors flex items-center justify-center gap-2"
                    >
                        Start Configuration <ArrowRight size={18} />
                    </button>
                </div>
            )
        },
        {
            title: "What is your Industry?",
            content: (
                <div className="grid grid-cols-1 gap-3">
                    {["finance", "health", "tech", "general"].map((ind) => (
                        <button
                            key={ind}
                            onClick={() => {
                                setAnswers(prev => ({ ...prev, industry: ind }));
                                setStep(2);
                            }}
                            className="p-4 rounded-xl border border-white/10 hover:bg-white/5 hover:border-safety_gold/50 transition-all text-left uppercase font-mono text-sm tracking-wider"
                        >
                            {ind}
                        </button>
                    ))}
                </div>
            )
        },
        {
            title: "What data do you handle?",
            content: (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                        <button
                            onClick={() => toggleData("email")}
                            className={`p-4 rounded-xl border flex justify-between items-center ${answers.dataTypes.includes("email") ? "bg-safety_gold/10 border-safety_gold text-safety_gold" : "border-white/10 text-zinc-400"}`}
                        >
                            <span>Email Addresses</span>
                            {answers.dataTypes.includes("email") && <Check size={18} />}
                        </button>
                        <button
                            onClick={() => toggleData("phone")}
                            className={`p-4 rounded-xl border flex justify-between items-center ${answers.dataTypes.includes("phone") ? "bg-safety_gold/10 border-safety_gold text-safety_gold" : "border-white/10 text-zinc-400"}`}
                        >
                            <span>Phone Numbers</span>
                            {answers.dataTypes.includes("phone") && <Check size={18} />}
                        </button>
                        <button
                            onClick={() => toggleData("names")}
                            className={`p-4 rounded-xl border flex justify-between items-center ${answers.dataTypes.includes("names") ? "bg-safety_gold/10 border-safety_gold text-safety_gold" : "border-white/10 text-zinc-400"}`}
                        >
                            <span>Employee/Cust. Names</span>
                            {answers.dataTypes.includes("names") && <Check size={18} />}
                        </button>
                    </div>
                    <button
                        onClick={() => setStep(3)}
                        className="w-full py-3 bg-white/10 text-white hover:bg-white/20 rounded-xl transition-colors"
                    >
                        Next Step
                    </button>
                </div>
            )
        },
        {
            title: "Security Level",
            content: (
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => setAnswers(prev => ({ ...prev, strictness: "loose" }))} className={`p-2 rounded-lg text-xs border ${answers.strictness === 'loose' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-white/10 text-zinc-500'}`}>Permissive</button>
                        <button onClick={() => setAnswers(prev => ({ ...prev, strictness: "balanced" }))} className={`p-2 rounded-lg text-xs border ${answers.strictness === 'balanced' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'border-white/10 text-zinc-500'}`}>Balanced</button>
                        <button onClick={() => setAnswers(prev => ({ ...prev, strictness: "strict" }))} className={`p-2 rounded-lg text-xs border ${answers.strictness === 'strict' ? 'bg-red-500/20 border-red-500 text-red-400' : 'border-white/10 text-zinc-500'}`}>Fort Knox</button>
                    </div>
                    <button
                        onClick={finishWizard}
                        className="w-full py-4 bg-safety_gold text-black font-bold rounded-xl shadow-[0_0_20px_rgba(255,193,7,0.3)] hover:shadow-[0_0_30px_rgba(255,193,7,0.5)] transition-all flex items-center justify-center gap-2"
                    >
                        <Shield size={20} /> Generate Policy
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800">
                    <motion.div
                        className="h-full bg-safety_gold"
                        initial={{ width: 0 }}
                        animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
                    />
                </div>

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">{steps[step].title}</h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={20} /></button>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {steps[step].content}
                    </motion.div>
                </AnimatePresence>

            </motion.div>
        </div>
    );
}
