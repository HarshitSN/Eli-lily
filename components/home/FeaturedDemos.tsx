import Link from "next/link";
import { CatalogItem } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Play, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeaturedDemosProps {
    items: CatalogItem[];
}

export function FeaturedDemos({ items }: FeaturedDemosProps) {
    return (
        <section className="container mx-auto px-4 py-20">
            <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-bold tracking-tight">Featured Demos</h2>
                <Link href="/demos" className="text-primary font-medium hover:underline inline-flex items-center">
                    View all <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                    <Card key={item.id} className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-xl border-border/60 hover:border-border">
                        <div className="aspect-video w-full bg-muted relative group">
                            {/* Placeholder for thumbnail */}
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
                                <Play className="h-12 w-12 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 text-primary" />
                            </div>
                            <div className="absolute top-3 right-3">
                                <Badge variant="secondary" className="bg-white/90 backdrop-blur text-xs font-medium">
                                    {item.type.replace('_', ' ')}
                                </Badge>
                            </div>
                        </div>

                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <Link href={`/${item.type.replace('_', '-')}s/${item.slug}`} className="hover:underline">
                                    <CardTitle className="text-xl">{item.title}</CardTitle>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 pb-4">
                            <CardDescription className="line-clamp-3 text-sm">
                                {item.shortDescription}
                            </CardDescription>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {item.industryTags.slice(0, 2).map(tag => (
                                    <Badge key={tag} variant="outline" className="text-xs text-muted-foreground bg-secondary/50 border-0">
                                        {tag}
                                    </Badge>
                                ))}
                                {item.capabilityTags.slice(0, 1).map(tag => (
                                    <Badge key={tag} variant="outline" className="text-xs text-muted-foreground bg-secondary/50 border-0">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="pt-0">
                            <Link href={`/${item.type.replace('_', '-')}s/${item.slug}`} className="w-full">
                                <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-white transition-colors">
                                    View Details
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </section>
    );
}
