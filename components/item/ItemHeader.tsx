import Link from "next/link";
import { CatalogItem } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Play, Share2 } from "lucide-react";

interface ItemHeaderProps {
    item: CatalogItem;
    pillar: string;
}

export function ItemHeader({ item, pillar }: ItemHeaderProps) {
    const getMaturityColor = (level: string) => {
        switch (level) {
            case 'production': return 'bg-green-100 text-green-800 border-green-200';
            case 'beta': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'prototype': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="bg-background border-b pt-8 pb-8">
            <div className="container mx-auto px-4">
                {/* Breadcrumb */}
                <div className="flex items-center text-sm text-muted-foreground mb-6">
                    <Link href="/" className="hover:text-foreground">Home</Link>
                    <span className="mx-2">/</span>
                    <Link href={`/${pillar}`} className="hover:text-foreground capitalize">{pillar.replace('-', ' ')}</Link>
                    <span className="mx-2">/</span>
                    <span className="text-foreground font-medium">{item.title}</span>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="flex-1">
                        <h1 className="text-3xl md:text-4xl font-bold mb-3">{item.title}</h1>
                        <p className="text-xl text-muted-foreground mb-6 max-w-3xl">{item.shortDescription}</p>

                        <div className="flex flex-wrap gap-3 mb-6">
                            <Badge variant="outline" className={`${getMaturityColor(item.maturityLevel)} uppercase text-[10px] tracking-wider font-semibold px-2 py-1`}>
                                {item.maturityLevel}
                            </Badge>
                            {item.industryTags.map(tag => (
                                <Badge key={tag} variant="secondary" className="bg-secondary text-secondary-foreground">
                                    {tag}
                                </Badge>
                            ))}
                            {item.capabilityTags.map(tag => (
                                <Badge key={tag} variant="secondary" className="bg-secondary text-secondary-foreground">
                                    {tag}
                                </Badge>
                            ))}
                        </div>

                        <div className="text-sm text-muted-foreground">
                            <span className="font-medium">Owner:</span> {item.owner} • <span className="font-medium">Last Updated:</span> {new Date(item.lastUpdated).toLocaleDateString()}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <Link href={`/${pillar}/${item.slug}/demo`} className="w-full sm:w-auto">
                            <Button className="w-full sm:w-auto font-semibold shadow-lg shadow-primary/20" size="lg">
                                <Play className="w-4 h-4 mr-2" /> Run Demo
                            </Button>
                        </Link>
                        <Button variant="outline" className="w-full sm:w-auto">
                            <Share2 className="w-4 h-4 mr-2" /> Share
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
