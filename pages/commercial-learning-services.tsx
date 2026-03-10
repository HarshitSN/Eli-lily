import Head from "next/head";
import { Layout } from "@/components/layout/Layout";
import { VerticalCard } from "@/components/verticals/VerticalCard";

const agents = [
    {
        title: "AI-Assisted Training Content Development",
        description: "Training programs for sales representatives and commercial teams require continuous updates as new clinical data or product information emerges.\n\nGenAI can automatically generate training modules, scripts, assessments, and job aids from approved medical and product materials.\n\nBusiness Outcomes:\n• Reduce time required to create training materials\n• Accelerate onboarding for new sales representatives\n• Improve scalability of training programs"
    },
    {
        title: "Learning Copilot for Field Teams",
        description: "Sales representatives frequently need quick access to product knowledge and clinical information while preparing for physician interactions.\n\nA conversational GenAI assistant can answer questions suchs as:\n• \"What are the key differentiators of our therapy versus competitors?\"\n• \"What clinical evidence supports this indication?\"\n\nBusiness Outcomes:\n• Improve field team knowledge and confidence\n• Enable faster access to critical information\n• Improve quality of HCP interactions"
    },
    {
        title: "Market Intelligence Synthesis Engine",
        description: "Learning programs often lack clear insights into whether training improves commercial performance.\n\nGenAI can analyze training engagement, knowledge assessments, and field performance data to generate insights on training effectiveness.\n\nBusiness Outcomes:\n• Identify knowledge gaps in commercial teams\n• Improve training program design\n• Link learning outcomes to business performance"
    }
];

export default function CommercialLearningServicesPage() {
    return (
        <Layout>
            <Head>
                <title>COMMERCIAL LEARNING SERVICES (CLS) - Eli Lilly AI Playground</title>
                <meta name="description" content="Explore our Commercial Learning Services agents." />
            </Head>

            <section className="py-24 bg-gradient-to-b from-slate-50 to-white min-h-screen">
                <div className="container mx-auto px-4 max-w-7xl">

                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl mb-4 uppercase">
                            COMMERCIAL LEARNING SERVICES (CLS)
                        </h2>
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto font-light">
                            Explore specialized training agents designed to optimize your commercial decision workflows.
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
