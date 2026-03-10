
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
        title: "Personalized HCP Engagement Content Generator",
        description: "Different healthcare professionals require tailored messaging depending on their specialty, prescribing behavior, and engagement preferences.\n\nGenAI can dynamically generate personalized engagement content for email campaigns, digital engagement channels, and rep follow-ups.\n\nBusiness Outcomes:\n• Improve HCP engagement rates\n• Deliver more relevant messaging to physicians\n• Increase effectiveness of omnichannel campaigns"
    },
    {
        title: "Campaign Performance Intelligence Assistant",
        description: "Marketing teams need to continuously evaluate performance across multiple channels such as email, digital campaigns, webinars, and rep engagements.\n\nGenAI can automatically analyze campaign data and generate performance insights and optimization recommendations.\n\nBusiness Outcomes:\n• Faster campaign optimization cycles\n• Improved ROI on marketing investments\n• Better visibility into channel performance"
    },
    {
        title: "Omnichannel Journey Optimization Engine",
        description: "Healthcare professional engagement journeys can involve multiple touchpoints across digital and field channels.\n\nGenAI can analyze engagement data and recommend improvements to channel sequencing, timing of engagement, and content relevance.\n\nBusiness Outcomes:\n• Improve HCP experience and engagement\n• Increase campaign effectiveness\n• Enable continuous optimization of engagement strategies"
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
