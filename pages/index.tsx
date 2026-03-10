import { Layout } from "@/components/layout/Layout";
import { Hero } from "@/components/home/Hero";
import { BentoGrid } from "@/components/home/BentoGrid";
import { LillyFocusSection } from "@/components/home/LillyFocusSection";

export default function Home() {
    return (
        <Layout>
            <Hero />
            <BentoGrid />
            <LillyFocusSection />
        </Layout>
    );
}

export async function getStaticProps() {
    return {
        props: {},
    };
}
