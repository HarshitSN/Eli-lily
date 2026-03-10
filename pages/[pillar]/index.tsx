import { useState, useEffect, useMemo } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Fuse from 'fuse.js';

import { Layout } from '@/components/layout/Layout';
import { CatalogCard } from '@/components/catalog/CatalogCard';
import { FilterPanel } from '@/components/catalog/FilterPanel';
import { CatalogSearchSort } from '@/components/catalog/CatalogSearchSort';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Filter } from 'lucide-react';

import { getCatalogItemsByPillar } from '@/lib/content';
import { CatalogItem } from '@/types';

interface CatalogPageProps {
    pillar: string;
    items: CatalogItem[];
}

export default function CatalogPage({ pillar, items }: CatalogPageProps) {
    const router = useRouter();

    // State for filters and search
    const [searchTerm, setSearchTerm] = useState('');
    const [sortValue, setSortValue] = useState('featured');
    const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
    const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([]);
    const [selectedMaturity, setSelectedMaturity] = useState<string[]>([]);

    // Extract unique options for filters
    const industryOptions = useMemo(() => Array.from(new Set((items || []).flatMap(i => i.industryTags || []))), [items]);
    const capabilityOptions = useMemo(() => Array.from(new Set((items || []).flatMap(i => i.capabilityTags || []))), [items]);
    const maturityOptions = useMemo(() => Array.from(new Set((items || []).map(i => i.maturityLevel).filter(Boolean))), [items]);

    // Sync state with URL query params (simplified for MVP)
    useEffect(() => {
        if (router.query.industry) {
            const ind = typeof router.query.industry === 'string' ? [router.query.industry] : router.query.industry;
            setSelectedIndustries(prev => [...new Set([...prev, ...ind])]);
        }
    }, [router.query]);

    // Filter and Sort Logic
    const filteredItems = useMemo(() => {
        let result = items;

        // Search
        if (searchTerm) {
            const fuse = new Fuse(result, {
                keys: ['title', 'shortDescription', 'industryTags', 'capabilityTags'],
                threshold: 0.3
            });
            result = fuse.search(searchTerm).map(r => r.item);
        }

        // Filters
        if (selectedIndustries.length > 0) {
            result = result.filter(item => item.industryTags.some(tag => selectedIndustries.includes(tag)));
        }
        if (selectedCapabilities.length > 0) {
            result = result.filter(item => item.capabilityTags.some(tag => selectedCapabilities.includes(tag)));
        }
        if (selectedMaturity.length > 0) {
            result = result.filter(item => selectedMaturity.includes(item.maturityLevel));
        }

        // Sort
        return [...result].sort((a, b) => {
            if (sortValue === 'newest') {
                return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
            }
            if (sortValue === 'maturity') {
                const order = { production: 3, beta: 2, prototype: 1, concept: 0 };
                return order[b.maturityLevel] - order[a.maturityLevel];
            }
            // Featured default
            return (Number(b.isFeatured) - Number(a.isFeatured)) || (new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
        });
    }, [items, searchTerm, selectedIndustries, selectedCapabilities, selectedMaturity, sortValue]);

    const handleClearAll = () => {
        setSelectedIndustries([]);
        setSelectedCapabilities([]);
        setSelectedMaturity([]);
        setSearchTerm('');
    };

    const pillarTitle = pillar?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Catalog';

    return (
        <Layout>
            <Head>
                <title>{`${pillarTitle} - Eli Lilly AI Playground`}</title>
            </Head>

            <div className="bg-secondary/20 border-b">
                <div className="container mx-auto px-4 py-12">
                    <h1 className="text-4xl font-bold mb-2">{pillarTitle}</h1>
                    <p className="text-xl text-muted-foreground">Browse all available {pillarTitle.toLowerCase()}</p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* Mobile Filter Sheet */}
                    <div className="lg:hidden mb-4">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" className="w-full">
                                    <Filter className="mr-2 h-4 w-4" /> Filters
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left">
                                <FilterPanel
                                    industryOptions={industryOptions}
                                    capabilityOptions={capabilityOptions}
                                    maturityOptions={maturityOptions}
                                    selectedIndustries={selectedIndustries}
                                    selectedCapabilities={selectedCapabilities}
                                    selectedMaturity={selectedMaturity}
                                    onIndustryChange={(v) => setSelectedIndustries(prev => prev.includes(v) ? prev.filter(i => i !== v) : [...prev, v])}
                                    onCapabilityChange={(v) => setSelectedCapabilities(prev => prev.includes(v) ? prev.filter(i => i !== v) : [...prev, v])}
                                    onMaturityChange={(v) => setSelectedMaturity(prev => prev.includes(v) ? prev.filter(i => i !== v) : [...prev, v])}
                                    onClearAll={handleClearAll}
                                />
                            </SheetContent>
                        </Sheet>
                    </div>

                    {/* Desktop Filter Sidebar */}
                    <div className="hidden lg:block">
                        <FilterPanel
                            industryOptions={industryOptions}
                            capabilityOptions={capabilityOptions}
                            maturityOptions={maturityOptions}
                            selectedIndustries={selectedIndustries}
                            selectedCapabilities={selectedCapabilities}
                            selectedMaturity={selectedMaturity}
                            onIndustryChange={(v) => setSelectedIndustries(prev => prev.includes(v) ? prev.filter(i => i !== v) : [...prev, v])}
                            onCapabilityChange={(v) => setSelectedCapabilities(prev => prev.includes(v) ? prev.filter(i => i !== v) : [...prev, v])}
                            onMaturityChange={(v) => setSelectedMaturity(prev => prev.includes(v) ? prev.filter(i => i !== v) : [...prev, v])}
                            onClearAll={handleClearAll}
                        />
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        <CatalogSearchSort
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            sortValue={sortValue}
                            onSortChange={setSortValue}
                        />

                        <div className="mb-4 text-sm text-muted-foreground">
                            Showing {filteredItems.length} results
                        </div>

                        {filteredItems.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredItems.map(item => (
                                    <CatalogCard key={item.id} item={item} pillar={pillar} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 border rounded-lg bg-secondary/5">
                                <p className="text-muted-foreground">No items found matching your criteria.</p>
                                <Button variant="link" onClick={handleClearAll}>Clear all filters</Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export const getStaticPaths: GetStaticPaths = async () => {
    // Only include pillars that don't have their own specialized page file
    const pillars = ['sdlc-agents'];
    const paths = pillars.map((pillar) => ({
        params: { pillar },
    }));

    return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
    const pillar = params?.pillar as string;
    const items = getCatalogItemsByPillar(pillar) || [];

    return {
        props: {
            pillar,
            items,
        },
    };
};
