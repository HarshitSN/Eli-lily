import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const industries = [
    "Aviation",
    "Healthcare",
    "BFSI",
    "CPG",
    "QSR",
    "Retail",
    "Manufacturing",
    "Logistics",
];

export function IndustryBrowse() {
    return (
        <section className="border-y bg-secondary/30 py-16">
            <div className="container mx-auto px-4">
                <h2 className="text-2xl font-bold mb-8 text-center md:text-left">Browse by Industry</h2>
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    {industries.map((industry) => (
                        <Link key={industry} href={`/vertical-solutions?industry=${industry.toLowerCase()}`}>
                            <Badge
                                variant="outline"
                                className="px-6 py-2 text-sm font-medium hover:bg-primary hover:text-white hover:border-primary transition-colors cursor-pointer rounded-full bg-background"
                            >
                                {industry}
                            </Badge>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
