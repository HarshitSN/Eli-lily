import Link from "next/link";
import { Layers, Box, Cpu, Code2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils"; // Assuming you have a utility for merging classes

const pillars = [
    {
        title: "BUSINESS INTELLIGENCE & ANALYTICS",
        description: "AI-Powered Commercial Insights Generator, Conversational Commercial Analytics Assistant, and Market Intelligence Synthesis Engine.",
        icon: Layers,
        href: "/business-intelligence",
        color: "text-blue-600",
        bg: "bg-blue-50",
        gradient: "from-blue-500/10 to-transparent",
    },
    {
        title: "GOSO – FIELD FORCE EFFECTIVENESS",
        description: "AI Rep Copilot for HCP Engagement, Intelligent Next-Best-Action Recommendation Engine, and Field Feedback Intelligence System.",
        icon: Box,
        href: "/field-force-effectiveness",
        color: "text-purple-600",
        bg: "bg-purple-50",
        gradient: "from-purple-500/10 to-transparent",
    },
    {
        title: "GLOBAL CONTENT HUB (GCH)",
        description: "AI-Assisted Medical and Commercial Content Creation, Intelligent Content Reuse and Localization, and MLR Review Preparation Assistant.",
        icon: Cpu,
        href: "/global-content-hub",
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        gradient: "from-emerald-500/10 to-transparent",
    },
    {
        title: "OMNICHANNEL & PERSONALIZATION",
        description: "Personalized HCP Engagement Content Generator, Campaign Performance Intelligence Assistant, and Omnichannel Journey Optimization Engine.",
        icon: Code2,
        href: "/omnichannel-personalization",
        color: "text-orange-600",
        bg: "bg-orange-50",
        gradient: "from-orange-500/10 to-transparent",
    },
    {
        title: "COMMERCIAL LEARNING SERVICES",
        description: "AI-Assisted Training Content Development, Learning Copilot for Field Teams, and Market Intelligence Synthesis Engine.",
        icon: Layers,
        href: "/commercial-learning-services",
        color: "text-red-600",
        bg: "bg-red-50",
        gradient: "from-red-500/10 to-transparent",
    },
];

export function PillarShowcase() {
    return (
        <section className="py-24 space-y-32">
            {pillars.map((pillar, index) => (
                <div key={pillar.title} className="container mx-auto px-4">
                    <div className={cn(
                        "flex flex-col gap-12 items-center",
                        index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                    )}>
                        {/* Visual Side */}
                        <div className="flex-1 w-full">
                            <div className={cn(
                                "aspect-[4/3] rounded-3xl overflow-hidden relative glass flex items-center justify-center group transition-all duration-500 hover:shadow-2xl",
                                "bg-gradient-to-br", pillar.gradient
                            )}>
                                <div className={cn(
                                    "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))]",
                                    pillar.gradient.replace('10', '20')
                                )} />

                                <pillar.icon
                                    className={cn("w-32 h-32 transition-transform duration-700 group-hover:scale-110", pillar.color)}
                                    strokeWidth={1}
                                />
                            </div>
                        </div>

                        {/* Text Side */}
                        <div className="flex-1 space-y-6 text-center lg:text-left">
                            <div className={cn("inline-flex items-center justify-center p-3 rounded-2xl mb-4", pillar.bg)}>
                                <pillar.icon className={cn("w-6 h-6", pillar.color)} />
                            </div>

                            <h2 className="text-4xl font-semibold tracking-tight text-foreground">{pillar.title}</h2>

                            <p className="text-xl text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0">
                                {pillar.description}
                            </p>

                            <div className="pt-4">
                                <Link
                                    href={pillar.href}
                                    className="inline-flex items-center text-lg font-medium text-foreground hover:text-primary transition-colors group"
                                >
                                    Explore {pillar.title}
                                    <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </section>
    );
}
