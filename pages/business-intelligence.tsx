import Head from "next/head";
import { Layout } from "@/components/layout/Layout";
import { ActionableCard } from "@/components/verticals/ActionableCard";

const agents = [
    {
        title: "AI-Powered Commercial Insights Generator",
        description: "Commercial analytics teams often spend significant time synthesizing large volumes of market data, prescription trends, HCP engagement metrics, and sales performance reports.\n\nA Generative AI assistant can automatically analyze structured and unstructured commercial data sources and generate insight summaries and narrative reports for brand and commercial leaders.\n\nBusiness Outcomes:\n• Reduce time spent preparing analytics reports by 40-60%\n• Accelerate insight-to-decision cycles for brand strategy\n• Enable faster identification of emerging market opportunities or risks"
    },
    {
        title: "NeoAnalytics",
        description: "AI-powered data analytics and automated report generation with natural language queries.",
        redirectUrl: "https://playground.statusneo.com/neo-analytics"
    },
    {
        title: "Conversational Commercial Analytics Assistant",
        description: "Commercial leaders and brand teams often depend on analyst teams to retrieve data or generate dashboards.\n\nA conversational AI interface can allow users to ask natural language questions such as:\n• \"What were the prescription trends for diabetes therapeutics the Northeast region last quarter?\"\n• \"Which HCP segments showed the highest engagement after our latest campaign?\"\n\nThe system retrieves relevant data and generates contextualized answers and visual insights.\n\nBusiness Outcomes:\n• Democratize access to analytics across commercial teams\n• Reduce dependency on manual analytics requests\n• Improve speed and quality of data-driven decision-making"
    },
    {
        title: "Market Intelligence Synthesis Engine",
        description: "Pharma companies constantly monitor external data sources including clinical publications, competitive launches, regulatory announcements, and market access developments.\n\nGenAI can continuously ingest and summarize these sources to create automated competitive intelligence briefings for brand teams.\n\nBusiness Outcomes:\n• Provide near real-time competitive intelligence\n• Improve brand planning and launch readiness\n• Reduce manual research effort for commercial analytics teams"
    }
];

export default function BusinessIntelligencePage() {
    return (
        <Layout>
            <Head>
                <title>BUSINESS INTELLIGENCE & ANALYTICS (BI&A) - StatusNeo AI Playground</title>
                <meta name="description" content="Explore our Business Intelligence & Analytics agents." />
            </Head>

            <section className="py-24 bg-gradient-to-b from-slate-50 to-white min-h-screen">
                <div className="container mx-auto px-4 max-w-7xl">

                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl mb-4 uppercase">
                            BUSINESS INTELLIGENCE & ANALYTICS (BI&A)
                        </h2>
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto font-light">
                            Explore specialized business intelligence and analytical agents designed to optimize your commercial decision workflows.
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
