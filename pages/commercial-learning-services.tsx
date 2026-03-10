import Head from "next/head";
import { Layout } from "@/components/layout/Layout";
import { ActionableCard } from "@/components/verticals/ActionableCard";

const agents = [
    {
        title: "AI-Assisted Training Content Development",
        description: "Automatically generate training modules, scripts, assessments, and job aids from approved medical and product materials."
    },
    {
        title: "Learning Copilot for Field Teams",
        description: "A conversational GenAI assistant that provides sales representatives with quick access to product knowledge and clinical information while preparing for physician interactions."
    },
    {
        title: "Market Intelligence Synthesis Engine",
        description: "Analyze training engagement, knowledge assessments, and field performance data to generate actionable insights on training effectiveness."
    }
];

export default function CommercialLearningServicesPage() {
    return (
        <Layout>
            <Head>
                <title>COMMERCIAL LEARNING SERVICES (CLS) - Eli Lilly AI Playground</title>
                <meta name="description" content="Explore Lilly's Commercial Learning Services agents." />
            </Head>

            <section className="py-24 bg-gradient-to-b from-slate-50 to-white min-h-screen">
                <div className="container mx-auto px-4 max-w-7xl">

                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl mb-4 uppercase">
                            COMMERCIAL LEARNING SERVICES (CLS)
                        </h2>
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto font-light">
                            Explore Lilly's specialized training agents designed to optimize your commercial decision workflows.
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
