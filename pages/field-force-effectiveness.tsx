import Head from "next/head";
import { Layout } from "@/components/layout/Layout";
import { VerticalCard } from "@/components/verticals/VerticalCard";

const agents = [
    {
        title: "AI Rep Copilot for HCP Engagement",
        description: "Sales representatives must prepare for interactions with healthcare professionals by reviewing HCP profiles, historical engagement, prescribing patterns, and relevant clinical updates.\n\nA GenAI-powered Rep Copilot can automatically generate personalized briefing notes before each HCP interaction.\n\nBusiness Outcomes:\n• Improve quality of HCP interactions\n• Increase rep productivity and preparation efficiency\n• Enable more personalized and relevant conversations with physicians"
    },
    {
        title: "Intelligent Next-Best-Action Recommendation Engine",
        description: "GenAI can analyze HCP engagement history, prescribing behavior, omnichannel interactions, and market trends to generate next-best-action recommendations for field representatives.\n\nExamples: Recommend which physicians to prioritize, suggest follow-up actions after engagements, and identify potential prescribing opportunity segments.\n\nBusiness Outcomes:\n• Improve targeting effectiveness\n• Increase return on field force investments\n• Drive higher HCP engagement and prescribing impact"
    },
    {
        title: "Field Feedback Intelligence System",
        description: "Field representatives collect valuable qualitative insights from physicians, but these are often stored as unstructured notes.\n\nGenAI can analyze these notes to extract patterns such as treatment concerns, competitive positioning insights, and feedback on clinical evidence.\n\nBusiness Outcomes:\n• Capture real-time market insights from field interactions\n• Improve commercial strategy responsiveness\n• Enable faster feedback loops between field teams and brand strategy"
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
