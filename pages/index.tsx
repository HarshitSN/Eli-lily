import { Layout } from "@/components/layout/Layout";
import { Hero } from "@/components/home/Hero";
import { BentoGrid } from "@/components/home/BentoGrid";
import { IndustryMosaic } from "@/components/home/IndustryMosaic";
import { StatsSection } from "@/components/home/StatsSection";

export default function Home() {
    return (
        <Layout>
            <Hero />
            <BentoGrid />
            <IndustryMosaic />
            <StatsSection />
        </Layout>
    );
}

export async function getStaticProps() {
    return {
        props: {},
    };
}
