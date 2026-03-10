
import Head from "next/head";
import { Layout } from "@/components/layout/Layout";
import { ActionableCard } from "@/components/verticals/ActionableCard";

const agents = [
    {
        title: "AI-Assisted Medical and Commercial Content Creation",
        description: "A GenAI assistant that helps generate draft HCP educational materials, sales aid content, and campaign messaging using approved claims and references."
    },
    {
        title: "Intelligent Content Reuse and Localization",
        description: "Identifies reusable content components and automatically generates localized versions for different geographies while maintaining regulatory requirements."
    },
    {
        title: "MLR Review Preparation Assistant",
        description: "Automatically checks drafts against approved claims to flag potential compliance issues and suggest improvements before formal MLR submission."
    }
];

export default function GlobalContentHubPage() {
    return (
        <Layout>
            <Head>
                <title>GLOBAL CONTENT HUB (GCH) - Eli Lilly AI Playground</title>
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
                            <ActionableCard
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
