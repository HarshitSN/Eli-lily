
import Head from "next/head";
import { Layout } from "@/components/layout/Layout";
import { VerticalCard } from "@/components/verticals/VerticalCard";

const agents = [
    {
        title: "AI-Assisted Medical and Commercial Content Creation",
        description: "Content creation in pharma requires strict adherence to approved claims, references, and compliance guidelines.\n\nA GenAI assistant can help generate draft HCP educational materials, sales aid content, and campaign messaging.\n\nAll outputs are generated using approved claims and references stored in the system.\n\nBusiness Outcomes:\n• Reduce content creation time by 30-50%\n• Improve content consistency and compliance\n• Accelerate campaign launches across markets"
    },
    {
        title: "Intelligent Content Reuse and Localization",
        description: "Global pharma companies create large volumes of content that must be adapted across markets and languages.\n\nGenAI can identify reusable content components and automatically generate localized versions for different geographies while maintaining regulatory requirements.\n\nBusiness Outcomes:\n• Reduce duplication of content development\n• Accelerate localization for global markets\n• Lower content production costs"
    },
    {
        title: "MLR Review Preparation Assistant",
        description: "Content must pass through Medical, Legal, and Regulatory (MLR) review processes.\n\nGenAI can automatically check drafts against approved claims, flag potential compliance issues, and suggest improvements before submission to review committees.\n\nBusiness Outcomes:\n• Reduce rework during MLR review cycles\n• Improve compliance readiness\n• Accelerate approval timelines for commercial content"
    }
];

export default function GlobalContentHubPage() {
    return (
        <Layout>
            <Head>
                <title>GLOBAL CONTENT HUB (GCH) - StatusNeo AI Playground</title>
                <meta name="description" content="Explore our Global Content Hub agents." />
            </Head>

            <section className="py-24 bg-gradient-to-b from-slate-50 to-white min-h-screen">
                <div className="container mx-auto px-4 max-w-7xl">

                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl mb-4 uppercase">
                            GLOBAL CONTENT HUB (GCH)
                        </h2>
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto font-light">
                            Explore specialized content hub agents designed to optimize your commercial decision workflows.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {agents.map((agent) => (
                            <VerticalCard
                                key={agent.title}
                                title={agent.title}
                                description={agent.description}
                            />
                        ))}
                    </div>

                </div>
            </section>
        </Layout>
    );
}
