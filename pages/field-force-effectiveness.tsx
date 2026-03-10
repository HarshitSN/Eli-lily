import Head from "next/head";
import { Layout } from "@/components/layout/Layout";
import { ActionableCard } from "@/components/verticals/ActionableCard";

const agents = [
    {
        title: "Healthcare Voice Follow-up Agent",
        description: "An AI-powered voice agent that can conduct post-visit follow-ups, patient adherence checks, or routine touchpoints on behalf of field representatives and medical liaisons.",
        redirectUrl: "https://playground.statusneo.com/voice-agent?persona_id=healthcare_followup"
    },
    {
        title: "AI Rep Copilot for HCP Engagement",
        description: "Automatically generate personalized briefing notes summarizing HCP profiles, interaction history, and prescribing patterns before each field visit."
    },
    {
        title: "Intelligent Next-Best-Action Recommendation Engine",
        description: "Analyze engagement history and market trends to generate prioritized next-best-action recommendations for field representatives."
    },
    {
        title: "Field Feedback Intelligence System",
        description: "Extract actionable patterns like treatment concerns and competitive insights from unstructured field representative notes."
    }
];

export default function FieldForceEffectivenessPage() {
    return (
        <Layout>
            <Head>
                <title>GOSO – FIELD FORCE EFFECTIVENESS & INNOVATION - Eli Lilly AI Playground</title>
                <meta name="description" content="Explore our Field Force Effectiveness agents." />
            </Head>

            <section className="py-24 bg-gradient-to-b from-slate-50 to-white min-h-screen">
                <div className="container mx-auto px-4 max-w-7xl">

                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl mb-4 uppercase">
                            GOSO – FIELD FORCE EFFECTIVENESS & INNOVATION
                        </h2>
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto font-light">
                            Explore specialized Field Force Effectiveness agents designed to optimize your commercial decision workflows.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {agents.map((agent) => (
                            <ActionableCard
                                key={agent.title}
                                title={agent.title}
                                description={agent.description}
                                tryUrl={(agent as any).redirectUrl}
                            />
                        ))}
                    </div>

                </div>
            </section>
        </Layout>
    );
}
