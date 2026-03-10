import Link from "next/link";
import {
    Plane, Heart, Building, Database,
    Box, FileText, BarChart,
    Cpu, Bot, Zap,
    Code2, Terminal, GitBranch, CheckCircle2,
    ArrowRight, ShieldCheck, Smartphone, Eye, LayoutTemplate, Layers, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// --- Orbit Component for Products ---
const ProductOrbit = () => {
    // Two orbits: outer orbit has 3 products, inner orbit has 2 products
    const outerOrbit = [
        { name: "NeoLens", icon: Eye, color: "text-blue-500", bgGlow: "bg-blue-50", borderColor: "border-blue-100" },
        { name: "NeoArkitect", icon: Layers, color: "text-purple-500", bgGlow: "bg-purple-50", borderColor: "border-purple-100" },
        { name: "FinOps", icon: BarChart3, color: "text-emerald-500", bgGlow: "bg-emerald-50", borderColor: "border-emerald-100" },
    ];

    const innerOrbit = [
        { name: "RearPortal", icon: LayoutTemplate, color: "text-indigo-500", bgGlow: "bg-indigo-50", borderColor: "border-indigo-100" },
        { name: "Testkraft", icon: "/image.png", color: "text-red-500", bgGlow: "bg-red-50", borderColor: "border-red-100", isImage: true },
    ];

    // Responsive orbit dimensions (percentages of container)
    const getOrbitDimensions = () => {
        // For mobile screens
        if (typeof window !== 'undefined' && window.innerWidth < 640) {
            return {
                outer: { rx: 35, ry: 12, cy: 75, duration: 25 },
                inner: { rx: 25, ry: 8, cy: 80, duration: 20 }
            };
        }
        // For tablet screens
        else if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            return {
                outer: { rx: 45, ry: 16, cy: 72, duration: 22 },
                inner: { rx: 35, ry: 11, cy: 77, duration: 18 }
            };
        }
        // For desktop screens
        else {
            return {
                outer: { rx: 52, ry: 20, cy: 70, duration: 20 },
                inner: { rx: 42, ry: 14, cy: 75, duration: 16 }
            };
        }
    };

    const { outer, inner } = getOrbitDimensions();

    /**
     * Generate N evenly-spaced keyframe positions along the TOP semicircle
     * of an ellipse. Each logo gets its own animation with a phase offset
     * so they are spread out and move together around the arc.
     */
    const buildOrbitKeyframes = (
        name: string,
        rx: number,
        ry: number,
        cy: number,
        totalLogos: number,
        logoIndex: number,
        duration: number,
    ) => {
        // Phase offset so logos are evenly spread around the orbit
        const phaseOffset = (logoIndex / totalLogos) * 360;
        const keyframeName = `${name}-${logoIndex}`;
        const steps = 60; // smooth animation
        let css = `@keyframes ${keyframeName} {\n`;
        for (let s = 0; s <= steps; s++) {
            const pct = (s / steps) * 100;
            // angle goes from 0 to 360 degrees continuously
            const angleDeg = (s / steps) * 360 + phaseOffset;
            const angleRad = (angleDeg * Math.PI) / 180;
            // Elliptical path: x = cx + rx*cos(θ), y = cy - ry*sin(θ)
            // We only want the top semicircle visible, so we'll let it go full circle
            // but the container clips the bottom half
            const x = 50 + rx * Math.cos(angleRad);
            const y = cy - ry * Math.sin(angleRad);
            css += `  ${pct.toFixed(2)}% { left: ${x.toFixed(2)}%; top: ${y.toFixed(2)}%; }\n`;
        }
        css += `}\n`;
        return { keyframeName, css, duration };
    };

    // Build all keyframe CSS
    let allKeyframes = '';
    const outerAnimations: { keyframeName: string; duration: number }[] = [];
    const innerAnimations: { keyframeName: string; duration: number }[] = [];

    outerOrbit.forEach((_, i) => {
        const result = buildOrbitKeyframes('outer', outer.rx, outer.ry, outer.cy, outerOrbit.length, i, outer.duration);
        allKeyframes += result.css;
        outerAnimations.push({ keyframeName: result.keyframeName, duration: result.duration });
    });

    innerOrbit.forEach((_, i) => {
        const result = buildOrbitKeyframes('inner', inner.rx, inner.ry, inner.cy, innerOrbit.length, i, inner.duration);
        allKeyframes += result.css;
        innerAnimations.push({ keyframeName: result.keyframeName, duration: result.duration });
    });

    const renderLogo = (
        item: typeof outerOrbit[0] | typeof innerOrbit[0],
        anim: { keyframeName: string; duration: number },
    ) => {
        const handleLogoClick = (name: string) => {
            if (name === "Testkraft") {
                window.open("http://54.224.179.89:3000/dashboard", "_blank");
            }
        };

        return (
            <div
                key={item.name}
                className="absolute pointer-events-auto"
                style={{
                    animation: `${anim.keyframeName} ${anim.duration}s linear infinite`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 5,
                }}
            >
                <div className="flex flex-col items-center gap-0.5 sm:gap-1 md:gap-1.5 group cursor-pointer" onClick={() => handleLogoClick(item.name)}>
                    <div className={`p-1.5 sm:p-2 md:p-3 bg-white rounded-xl sm:rounded-2xl shadow-lg ${item.borderColor} border transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl ${!('isImage' in item) ? '' : 'bg-transparent border-transparent shadow-none'}`}>
                        {'isImage' in item ? (
                            <img src={item.icon as string} alt={item.name} className="w-6 h-6 sm:w-8 md:w-10 sm:h-8 md:h-10" />
                        ) : (
                            <item.icon className={`w-3 h-3 sm:w-4 md:w-5 sm:h-4 md:h-5 ${item.color}`} />
                        )}
                    </div>
                    {!('isImage' in item) && (
                        <span className={`text-[6px] sm:text-[7px] md:text-[8px] font-bold uppercase tracking-widest text-slate-400 ${item.bgGlow} backdrop-blur-md px-1 sm:px-2 py-0.5 rounded-full ${item.borderColor} border whitespace-nowrap transition-colors group-hover:text-slate-600`}>
                            {item.name}
                        </span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <>
            {/* --- ORBIT TRACKS + MOVING LOGOS --- */}
            <div className="absolute inset-0 pointer-events-none">
                {/* SVG orbit track lines */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none">
                    {/* Outer orbit track */}
                    <ellipse
                        cx="50" cy={outer.cy}
                        rx={outer.rx} ry={outer.ry}
                        stroke="rgba(100,116,139,0.2)"
                        strokeWidth="0.2"
                        strokeDasharray="1 0.5"
                        fill="none"
                        className="sm:stroke-opacity-30 md:stroke-opacity-40"
                    />
                    {/* Inner orbit track */}
                    <ellipse
                        cx="50" cy={inner.cy}
                        rx={inner.rx} ry={inner.ry}
                        stroke="rgba(100,116,139,0.2)"
                        strokeWidth="0.2"
                        strokeDasharray="1 0.5"
                        fill="none"
                        className="sm:stroke-opacity-30 md:stroke-opacity-40"
                    />
                </svg>

                {/* Outer orbit logos */}
                {outerOrbit.map((item, i) => renderLogo(item, outerAnimations[i]))}

                {/* Inner orbit logos */}
                {innerOrbit.map((item, i) => renderLogo(item, innerAnimations[i]))}
            </div>

            {/* --- GENERATED ORBIT KEYFRAMES --- */}
            <style>{allKeyframes}</style>
        </>
    );
};

// --- 1. Vertical Solutions Diagram (Mimics the "Platform Migration" grid style) ---
const VerticalDiagram = () => {
    return (
        <div className="flex items-center justify-between w-full h-full px-2 sm:px-4 gap-2 sm:gap-4">
            {/* Input Side */}
            <div className="flex flex-col gap-1 sm:gap-2">
                <div className="bg-slate-100 p-1.5 sm:p-2 rounded-md border border-slate-200">
                    <div className="flex gap-1 sm:gap-2 mb-1 sm:mb-2">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded bg-white border border-slate-200 flex items-center justify-center">
                            <Database className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                        </div>
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded bg-white border border-slate-200 flex items-center justify-center">
                            <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                        </div>
                    </div>
                    <div className="text-[8px] sm:text-[10px] text-slate-500 font-medium text-center">Raw Data</div>
                </div>
            </div>

            {/* Animation Flow */}
            <div className="flex-1 relative h-[1px] bg-slate-200">
                <motion.div
                    className="absolute top-1/2 -translate-y-1/2 left-0 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                    animate={{ left: ["0%", "100%"], opacity: [0, 1, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-blue-100 p-1 sm:p-1.5 rounded-full shadow-sm z-10">
                    <Cpu className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                </div>
            </div>

            {/* Output Side (The Verticals) */}
            <div className="bg-white border border-slate-200 rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-sm flex flex-col gap-1 sm:gap-2 min-w-[80px] sm:min-w-[120px]">
                <div className="flex items-center gap-1 sm:gap-2 p-1 sm:p-1.5 bg-sky-50 rounded-lg border border-sky-100">
                    <Plane className="w-2 h-2 sm:w-3 sm:h-3 text-sky-600" />
                    <span className="text-[8px] sm:text-[10px] font-semibold text-sky-700">Aviation</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 p-1 sm:p-1.5 bg-red-50 rounded-lg border border-red-100">
                    <Heart className="w-2 h-2 sm:w-3 sm:h-3 text-red-600" />
                    <span className="text-[8px] sm:text-[10px] font-semibold text-red-700">Healthcare</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 p-1 sm:p-1.5 bg-indigo-50 rounded-lg border border-indigo-100">
                    <Building className="w-2 h-2 sm:w-3 sm:h-3 text-indigo-600" />
                    <span className="text-[8px] sm:text-[10px] font-semibold text-indigo-700">BFSI</span>
                </div>
            </div>
        </div>
    );
};

// --- 2. Products Diagram (Mimics "Mask Data" checkbox style) ---
const ProductsDiagram = () => {
    return (
        <div className="flex items-center justify-center w-full h-full gap-3 px-2">
            {/* List Input */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-3 w-32 space-y-2">
                <div className="text-[10px] text-slate-400 font-bold mb-2">UNSTRUCTURED</div>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm border border-slate-300 bg-slate-50" />
                        <div className="h-2 w-16 bg-slate-100 rounded-full" />
                    </div>
                ))}
            </div>

            {/* Processor */}
            <div className="relative flex items-center">
                <motion.div
                    className="text-slate-300"
                    animate={{ color: ["#cbd5e1", "#a855f7", "#cbd5e1"] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <ArrowRight className="w-5 h-5" />
                </motion.div>
                <motion.div
                    className="absolute -top-6 left-1/2 -translate-x-1/2 bg-purple-100 text-purple-700 text-[9px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap border border-purple-200"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    Extract
                </motion.div>
            </div>

            {/* Result Output */}
            <div className="bg-purple-50 border border-purple-100 rounded-lg shadow-sm p-3 w-32 space-y-2">
                <div className="text-[10px] text-purple-400 font-bold mb-2">INTELLIGENCE</div>
                <div className="flex items-center gap-2 bg-white/60 p-1 rounded">
                    <Box className="w-3 h-3 text-purple-600" />
                    <div className="text-[9px] font-medium text-purple-700">Entities Found</div>
                </div>
                <div className="flex items-center gap-2 bg-white/60 p-1 rounded">
                    <BarChart className="w-3 h-3 text-purple-600" />
                    <div className="text-[9px] font-medium text-purple-700">Analytics Ready</div>
                </div>
            </div>
        </div>
    );
};

// --- 3. Super Agents (Mimics "Route to Storage" flow) ---
const AgentsDiagram = () => {
    return (
        <div className="flex flex-col items-center justify-center w-full h-full pt-4">
            <div className="flex items-center gap-6 relative">
                {/* Connection Lines (SVG) */}
                <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-24 pointer-events-none" style={{ zIndex: 0 }}>
                    <path d="M 50 20 L 150 20 L 150 50" fill="none" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="4 2" />
                    <path d="M 250 20 L 150 20" fill="none" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="4 2" />
                    <motion.path
                        d="M 50 20 L 150 20 L 150 50"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                </svg>

                {/* Nodes */}
                <div className="z-10 bg-white border border-slate-200 p-2 rounded-lg shadow-sm flex flex-col items-center gap-1 w-20">
                    <Smartphone className="w-5 h-5 text-slate-400" />
                    <span className="text-[9px] text-slate-500 font-medium">Request</span>
                </div>

                <div className="z-10 bg-emerald-50 border border-emerald-100 p-3 rounded-xl shadow-md flex flex-col items-center gap-1 w-24">
                    <div className="relative">
                        <div className="absolute inset-0 bg-emerald-400 blur-lg opacity-20 rounded-full animate-pulse"></div>
                        <Bot className="w-8 h-8 text-emerald-600 relative z-10" />
                    </div>
                    <div className="flex gap-0.5">
                        <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                </div>

                <div className="z-10 bg-white border border-slate-200 p-2 rounded-lg shadow-sm flex flex-col items-center gap-1 w-20">
                    <Database className="w-5 h-5 text-slate-400" />
                    <span className="text-[9px] text-slate-500 font-medium">Action</span>
                </div>
            </div>

            <div className="mt-4 bg-emerald-100/50 px-3 py-1 rounded-full border border-emerald-100">
                <span className="text-[10px] text-emerald-700 font-semibold">Autonomous Reasoning</span>
            </div>
        </div>
    );
};

// --- 4. SDLC Diagram (Mimics "Reduce Log Volume" filter flow) ---
const SDLCDiagram = () => {
    return (
        <div className="flex items-center justify-between w-full h-full px-2 sm:px-4 md:px-6">
            {/* Step 1: Code */}
            <div className="flex flex-col items-center gap-1 sm:gap-2 group">
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white border border-slate-200 rounded-lg sm:rounded-xl shadow-sm flex items-center justify-center group-hover:border-orange-200 transition-colors">
                    <Code2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-slate-400 group-hover:text-orange-500 transition-colors" />
                </div>
                <span className="text-[8px] sm:text-[9px] md:text-[10px] font-medium text-slate-500">Commit</span>
            </div>

            {/* Connection 1 */}
            <div className="flex-1 h-[1px] bg-slate-200 mx-1 sm:mx-2 relative">
                <motion.div
                    className="absolute inset-0 bg-orange-400"
                    initial={{ scaleX: 0, originX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                />
            </div>

            {/* Step 2: AI Agent (The Filter) */}
            <div className="relative">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-orange-50 border border-orange-100 rounded-lg sm:rounded-xl shadow-sm flex flex-col items-center justify-center z-10 relative">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 text-orange-500 fill-orange-500" />
                    <span className="text-[6px] sm:text-[7px] md:text-[8px] font-bold text-orange-600 mt-0.5 sm:mt-1">AI TEST</span>
                </div>
                {/* Floating badge */}
                <motion.div
                    className="absolute -top-2 sm:-top-3 -right-4 sm:-right-6 bg-white border border-slate-100 shadow-sm px-1 sm:px-1.5 py-0.5 rounded text-[6px] sm:text-[8px] font-medium text-green-600 flex items-center gap-0.5 sm:gap-1"
                    animate={{ y: [0, -3, 0], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity }}
                >
                    <CheckCircle2 className="w-1.5 h-1.5 sm:w-2 sm:h-2" />
                    <span className="hidden sm:inline">Bug Free</span>
                    <span className="sm:hidden">✓</span>
                </motion.div>
            </div>

            {/* Connection 2 */}
            <div className="flex-1 h-[1px] bg-slate-200 mx-1 sm:mx-2 relative">
                <motion.div
                    className="absolute inset-0 bg-orange-400"
                    initial={{ scaleX: 0, originX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.7 }}
                />
            </div>

            {/* Step 3: Deploy */}
            <div className="flex flex-col items-center gap-1 sm:gap-2 group">
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white border border-slate-200 rounded-lg sm:rounded-xl shadow-sm flex items-center justify-center group-hover:border-green-200 transition-colors">
                    <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-slate-400 group-hover:text-green-500 transition-colors" />
                </div>
                <span className="text-[8px] sm:text-[9px] md:text-[10px] font-medium text-slate-500">Production</span>
            </div>
        </div>
    );
};


// --- Main Component ---
const pillars = [
    {
        title: "BUSINESS INTELLIGENCE & ANALYTICS",
        description: "AI-Powered Commercial Insights Generator, Conversational Commercial Analytics Assistant, etc.",
        icon: Building,
        href: "/business-intelligence",
        className: "md:col-span-1 md:row-span-1",
        diagram: <VerticalDiagram />
    },
    {
        title: "GOSO – FIELD FORCE EFFECTIVENESS",
        description: "AI Rep Copilot for HCP Engagement, Intelligent Next-Best-Action Recommendation Engine, etc.",
        icon: Box,
        href: "/field-force-effectiveness",
        className: "md:col-span-1 md:row-span-1",
        diagram: <ProductsDiagram />
    },
    {
        title: "GLOBAL CONTENT HUB (GCH)",
        description: "AI-Assisted Medical and Commercial Content Creation, Intelligent Content Reuse, etc.",
        icon: Bot,
        href: "/global-content-hub",
        className: "md:col-span-1 md:row-span-1",
        diagram: <AgentsDiagram />
    },
    {
        title: "OMNICHANNEL & PERSONALIZATION",
        description: "Personalized HCP Engagement Content Generator, Campaign Performance Intelligence Assistant, etc.",
        icon: Terminal,
        href: "/omnichannel-personalization",
        className: "md:col-span-1 md:row-span-1 md:col-start-2",
        diagram: <SDLCDiagram />
    },
    {
        title: "COMMERCIAL LEARNING SERVICES",
        description: "AI-Assisted Training Content Development, Learning Copilot for Field Teams, etc.",
        icon: Layers,
        href: "/commercial-learning-services",
        className: "md:col-span-1 md:row-span-1 md:col-start-3",
        diagram: <VerticalDiagram /> // reusing for now
    },
];

export function BentoGrid() {
    return (
        <section className="container mx-auto px-4 py-16 sm:py-20 md:py-24 bg-white relative">
            <div className="flex flex-col items-center mb-16 sm:mb-20 md:mb-24 text-center space-y-4 sm:space-y-6 relative z-10">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
                    The 5 Pillars of Eli Lilly Agentic Innovation
                </h2>
                <p className="max-w-2xl text-base sm:text-lg text-slate-600 px-4">
                    A comprehensive ecosystem designed to bring autonomous capability to your enterprise.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
                {pillars.map((pillar) => (
                    <Link
                        key={pillar.title}
                        href={pillar.href}
                        className={cn(
                            "group relative flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl bg-white border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-slate-300 hover:-translate-y-1",
                            pillar.className
                        )}
                    >
                        {/* Top Section: Text */}
                        <div className="p-4 sm:p-6 pb-0 z-10 relative">
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                                <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg group-hover:bg-red-50 group-hover:border-red-100 transition-colors">
                                    <pillar.icon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 group-hover:text-red-600 transition-colors" />
                                </div>
                                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-slate-300 group-hover:text-slate-500 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                                {pillar.title}
                            </h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                {pillar.description}
                            </p>
                        </div>

                        {/* Bottom Section: Diagram area */}
                        <div className="flex-1 mt-4 sm:mt-6 min-h-[120px] sm:min-h-[160px] bg-slate-50/50 border-t border-slate-100 relative overflow-hidden flex flex-col justify-center">
                            {/* Subtle background grid pattern */}
                            <div className="absolute inset-0 opacity-[0.03]"
                                style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '16px 16px' }}
                            />

                            {/* The Diagram Component - responsive scaling */}
                            <div className="relative z-10 w-full h-full p-2 sm:p-4 scale-50 sm:scale-75 md:scale-100 origin-center">
                                {pillar.diagram}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}