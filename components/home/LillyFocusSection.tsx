'use client';

import { motion } from "framer-motion";
import { ShieldCheck, Zap, Network, Database, Lock, ArrowRight } from "lucide-react";

const features = [
    {
        icon: ShieldCheck,
        title: "Enterprise Grade Compliance",
        description: "Built from the ground up to meet stringent healthcare regulatory standards, ensuring all MLR and data privacy requirements are satisfied automatically."
    },
    {
        icon: Network,
        title: "Seamless Ecosystem Integration",
        description: "Connects directly into existing commercial, medical, and clinical data lakes to provide context-aware intelligence across the entire organization."
    },
    {
        icon: Zap,
        title: "Real-time Autonomous Action",
        description: "Beyond just chat—these agents proactively monitor data, detect anomalies, and execute complex workflows without manual intervention."
    }
];

export function LillyFocusSection() {
    return (
        <section className="py-20 sm:py-24 bg-slate-50 relative overflow-hidden border-t border-slate-200">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-red-100/50 blur-[100px] mix-blend-multiply opacity-50"></div>
                <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-slate-200/50 blur-[100px] mix-blend-multiply opacity-50"></div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">

                    {/* Left side text content */}
                    <div className="space-y-8">
                        <div>
                            <div className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold tracking-widest text-red-600 uppercase mb-6">
                                The Lilly AI Advantage
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
                                Purpose-built for the <br className="hidden sm:block" />
                                <span className="text-red-700">Future of Healthcare</span>
                            </h2>
                            <p className="text-lg text-slate-600 font-light max-w-lg leading-relaxed">
                                Our AgenticAI Factory isn't just a suite of tools—it's a comprehensive nervous system designed to accelerate innovation, ensure compliance, and drive commercial excellence across the enterprise.
                            </p>
                        </div>

                        <div className="space-y-6">
                            {features.map((feature, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                                    className="flex items-start gap-4"
                                >
                                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm text-red-600 flex-shrink-0">
                                        <feature.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-base font-bold text-slate-900 mb-1">{feature.title}</h4>
                                        <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Right side visual diagram */}
                    <div className="relative w-full h-full min-h-[400px] lg:min-h-[500px] flex items-center justify-center">
                        <div className="relative w-full max-w-[400px] aspect-square">
                            {/* Central Hub */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white rounded-2xl shadow-xl border border-red-100 flex items-center justify-center z-20">
                                <div className="absolute inset-0 bg-red-50 rounded-2xl animate-pulse"></div>
                                <img src="/lilly-logo.svg" alt="Lilly" className="w-16 relative z-10" />
                            </div>

                            {/* Orbiting Elements */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 border border-slate-200 rounded-full border-dashed"
                            >
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-xl shadow-md border border-slate-200 flex items-center justify-center">
                                    <Database className="w-5 h-5 text-blue-500" />
                                </div>
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-12 h-12 bg-white rounded-xl shadow-md border border-slate-200 flex items-center justify-center">
                                    <Lock className="w-5 h-5 text-indigo-500" />
                                </div>
                            </motion.div>

                            <motion.div
                                animate={{ rotate: -360 }}
                                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-12 border border-slate-200 rounded-full border-dashed"
                            >
                                <div className="absolute top-1/2 -left-6 -translate-y-1/2 w-12 h-12 bg-white rounded-xl shadow-md border border-slate-200 flex items-center justify-center" style={{ transform: 'translateY(-50%) rotate(360deg)' }}>
                                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                </div>
                                <div className="absolute top-1/2 -right-6 -translate-y-1/2 w-12 h-12 bg-white rounded-xl shadow-md border border-slate-200 flex items-center justify-center" style={{ transform: 'translateY(-50%) rotate(360deg)' }}>
                                    <Network className="w-5 h-5 text-orange-500" />
                                </div>
                            </motion.div>

                            {/* Decorative dots */}
                            <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-red-400 rounded-full"></div>
                            <div className="absolute bottom-1/4 left-1/4 w-3 h-3 bg-red-300 rounded-full"></div>
                            <div className="absolute top-1/2 left-10 w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
