import Head from "next/head";
import { Layout } from "@/components/layout/Layout";
import { ActionableCard } from "@/components/verticals/ActionableCard";

const agents = [
    {
        title: "AI-Powered Commercial Insights Generator",
        description: "Automatically analyze structured and unstructured commercial data sources to generate insight summaries and narrative reports for brand and commercial leaders."
    },
    {
        title: "Conversational Commercial Analytics Assistant",
        description: "A GenAI assistant that allows commercial leaders to query market share, brand performance, and sales data using natural language.",
        redirectUrl: "https://playground.statusneo.com/report-agent"
    },
    {
        title: "Predictive Sales Forecasting Engine",
        description: "Accurate forecasting models that integrate historical sales, market events, competitor actions, and seasonality for localized predictions."
    },
    {
        title: "Automated Executive Reporting Generator",
        description: "Automatically synthesize complex datasets into concise, narrative business review reports for executives."
    },
    {
        title: "Market Intelligence Synthesis Engine",
        description: "GenAI continuously ingests and summarizes external data sources (clinical publications, competitive launches, regulatory announcements) to create automated competitive intelligence briefings for brand teams."
    }
];

export default function BusinessIntelligencePage() {
    return (
        <Layout>
            <Head>
                <title>BUSINESS INTELLIGENCE & ANALYTICS (BI&A) - Eli Lilly AI Playground</title>
                <meta name="description" content="Explore Lilly's Business Intelligence & Analytics agents." />
            </Head>

            <section className="py-24 bg-gradient-to-b from-slate-50 to-white min-h-screen">
                <div className="container mx-auto px-4 max-w-7xl">

                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl mb-4 uppercase">
                            BUSINESS INTELLIGENCE & ANALYTICS (BI&A)
                        </h2>
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto font-light mb-4">
                            Explore Lilly's specialized business intelligence and analytical agents designed to optimize your commercial decision workflows.
                        </p>
                        <div className="text-lg flex justify-center items-center font-medium text-slate-400">
                            Powered by <span className="text-slate-600 font-bold ml-1">StatusNeo</span>
                        </div>
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
