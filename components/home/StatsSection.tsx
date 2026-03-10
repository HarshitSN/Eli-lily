'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Code, Zap, Award, Globe } from 'lucide-react';

const stats = [
    {
        icon: Users,
        value: "50M+",
        label: "Users Impacted",
        description: "Across enterprise deployments"
    },
    {
        icon: Code,
        value: "10M+",
        label: "Lines of Code Analyzed",
        description: "By our AI agents daily"
    },
    {
        icon: Zap,
        value: "85%",
        label: "Development Acceleration",
        description: "Average time savings"
    },
    {
        icon: Globe,
        value: "15+",
        label: "Countries Served",
        description: "Global enterprise footprint"
    },
    {
        icon: Award,
        value: "99.9%",
        label: "Uptime SLA",
        description: "Production reliability"
    },
    {
        icon: TrendingUp,
        value: "300%",
        label: "ROI Average",
        description: "Within first 6 months"
    }
];

function StatCard({ stat, index }: { stat: typeof stats[0]; index: number }) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, []);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="relative group"
        >
            <div className="text-center p-8 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-50 mb-6 group-hover:bg-slate-100 transition-colors">
                    <stat.icon className="w-8 h-8 text-slate-900" />
                </div>
                <div className="space-y-2">
                    <div className="text-4xl font-bold text-slate-900 tabular-nums">
                        {stat.value}
                    </div>
                    <div className="text-lg font-semibold text-slate-700">
                        {stat.label}
                    </div>
                    <div className="text-sm text-slate-500">
                        {stat.description}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export function StatsSection() {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, []);

    return (
        <section className="py-24 bg-gradient-to-br from-slate-50 to-blue-50 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 right-20 w-96 h-96 bg-blue-200/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 left-20 w-80 h-80 bg-purple-200/10 rounded-full blur-3xl"></div>
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    ref={ref}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isVisible ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50/50 px-4 py-1.5 text-xs font-bold tracking-widest text-slate-700 uppercase shadow-sm mb-6">
                        Proven Impact
                    </div>
                    <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-4">
                        Numbers That <span className="text-slate-600">Matter</span>
                    </h2>
                    <p className="max-w-2xl mx-auto text-lg text-slate-600 font-light">
                        Real-world results from enterprises leveraging our AI acceleration platform.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {stats.map((stat, index) => (
                        <StatCard key={stat.label} stat={stat} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
}
