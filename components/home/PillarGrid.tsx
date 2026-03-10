import Link from "next/link";
import { Layers, Box, Cpu, Code2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const pillars = [
    {
        title: "BUSINESS INTELLIGENCE & ANALYTICS",
        description: "AI-Powered Commercial Insights Generator, Conversational Commercial Analytics Assistant, and Market Intelligence Synthesis Engine.",
        icon: Layers,
        href: "/business-intelligence",
        color: "bg-blue-50 text-blue-600",
    },
    {
        title: "GOSO – FIELD FORCE EFFECTIVENESS",
        description: "AI Rep Copilot for HCP Engagement, Intelligent Next-Best-Action Recommendation Engine, and Field Feedback Intelligence System.",
        icon: Box,
        href: "/field-force-effectiveness",
        color: "bg-purple-50 text-purple-600",
    },
    {
        title: "GLOBAL CONTENT HUB (GCH)",
        description: "AI-Assisted Medical and Commercial Content Creation, Intelligent Content Reuse and Localization, and MLR Review Preparation Assistant.",
        icon: Cpu,
        href: "/global-content-hub",
        color: "bg-emerald-50 text-emerald-600",
    },
    {
        title: "OMNICHANNEL & PERSONALIZATION",
        description: "Personalized HCP Engagement Content Generator, Campaign Performance Intelligence Assistant, and Omnichannel Journey Optimization Engine.",
        icon: Code2,
        href: "/omnichannel-personalization",
        color: "bg-orange-50 text-orange-600",
    },
    {
        title: "COMMERCIAL LEARNING SERVICES",
        description: "AI-Assisted Training Content Development, Learning Copilot for Field Teams, and Market Intelligence Synthesis Engine.",
        icon: Layers,
        href: "/commercial-learning-services",
        color: "bg-red-50 text-red-600",
    },
];

export function PillarGrid() {
    return (
        <section className="container mx-auto px-4 py-16">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {pillars.map((pillar) => (
                    <Link key={pillar.title} href={pillar.href} className="group block h-full">
                        <Card className="h-full border-border/40 bg-background transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-border/80 cursor-pointer">
                            <CardHeader>
                                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg ${pillar.color}`}>
                                    <pillar.icon className="h-6 w-6" />
                                </div>
                                <CardTitle className="text-xl group-hover:text-primary transition-colors">{pillar.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-base">{pillar.description}</CardDescription>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </section>
    );
}
