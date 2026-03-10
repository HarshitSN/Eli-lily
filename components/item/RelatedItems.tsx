import { CatalogItem } from "@/types";
import { CatalogCard } from "@/components/catalog/CatalogCard";

interface RelatedItemsProps {
    items: CatalogItem[];
    currentId: string;
    pillar: string;
}

export function RelatedItems({ items, currentId, pillar }: RelatedItemsProps) {
    if (items.length === 0) return null;

    return (
        <section className="bg-secondary/20 border-t py-12">
            <div className="container mx-auto px-4">
                <h2 className="text-2xl font-bold mb-8">Related Solutions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map(item => (
                        <CatalogCard key={item.id} item={item} pillar={pillar} />
                    ))}
                </div>
            </div>
        </section>
    );
}
