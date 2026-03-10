
import Head from "next/head";
import { Layout } from "@/components/layout/Layout";
import { ActionableCard } from "@/components/verticals/ActionableCard";

const agents = [
    {
        title: "Pharmacovigilance Agent",
        description: "Ingests adverse event reports, extracts key fields, and drafts safety case narratives for review.",
        redirectUrl: "https://playground.statusneo.com/chat?agent=pharmacovigilance"
    },
    {
        title: "NeoGen",
        description: "AI-powered personalized content generator.",
        redirectUrl: "https://playground.statusneo.com/neogen"
    },
    {
        title: "Personalized HCP Engagement Content Generator",
        description: "GenAI dynamically generates personalized engagement content for email campaigns, digital channels, and rep follow-ups tailored to each HCP's prescribing behavior."
    },
    {
        title: "Campaign Performance Intelligence Assistant",
        description: "Automatically analyze cross-channel campaign data to generate performance insights and rapid optimization recommendations."
    },
    {
        title: "Omnichannel Journey Optimization Engine",
        description: "Analyze engagement data to recommend optimal channel sequencing and content relevance for healthcare professional interaction journeys."
    }
];

export default function OmnichannelPersonalizationPage() {
    return (
        <Layout>
            <Head>
                <title>OMNICHANNEL & PERSONALIZATION - Eli Lilly AI Playground</title>
                <meta name="description" content="Explore our Omnichannel & Personalization agents." />
            </Head>

            <section className="py-24 bg-gradient-to-b from-slate-50 to-white min-h-screen">
                <div className="container mx-auto px-4 max-w-7xl">

                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl mb-4 uppercase">
                            OMNICHANNEL & PERSONALIZATION
                        </h2>
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto font-light">
                            Explore specialized omnichannel personalization agents designed to optimize your commercial decision workflows.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {agents.map((agent) => (
                            <ActionableCard
                                key={agent.title}
                                title={agent.title}
                                description={agent.description}
                                tryUrl={agent.redirectUrl}
                            />
                        ))}
                    </div>

                </div>
            </section>
        </Layout>
    );
}
