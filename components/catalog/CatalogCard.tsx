import { CatalogItem } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, CheckCircle2 } from "lucide-react";

interface CatalogCardProps {
    item: CatalogItem;
    pillar: string;
}

export function CatalogCard({ item }: CatalogCardProps) {
    const getMaturityColor = (level: string) => {
        switch (level) {
            case 'production': return 'bg-green-100 text-green-800 border-green-200';
            case 'beta': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'prototype': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <Card className="flex flex-col h-full overflow-hidden hover:shadow-lg transition-all duration-300 border-border/60 hover:border-primary/50 group">
            <CardHeader className="pb-3 relative">
                <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className={`${getMaturityColor(item.maturityLevel)} uppercase text-[10px] tracking-wider font-semibold border`}>
                        {item.maturityLevel}
                    </Badge>
                    {item.demoModes.length > 0 && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px] flex items-center gap-1">
                            <Play className="w-3 h-3" /> Demo
                        </Badge>
                    )}
                </div>
                <CardTitle className="text-lg sm:text-xl group-hover:text-primary transition-colors">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
                <CardDescription className="line-clamp-3 text-sm mb-4">
                    {item.shortDescription}
                </CardDescription>

                <div className="flex flex-wrap gap-1.5">
                    {item.industryTags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs bg-secondary/50 font-normal">
                            {tag}
                        </Badge>
                    ))}
                    {item.capabilityTags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs bg-secondary/50 font-normal">
                            {tag}
                        </Badge>
                    ))}
                    {(item.industryTags.length + item.capabilityTags.length) > 4 && (
                        <span className="text-xs text-muted-foreground self-center">+{item.industryTags.length + item.capabilityTags.length - 4}</span>
                    )}
                </div>
            </CardContent>
            <CardFooter className="pt-0 border-t bg-secondary/10 p-3 sm:p-4">
                <div className="w-full flex justify-between items-center text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 truncate max-w-[120px] sm:max-w-none">
                        <CheckCircle2 className="w-3 h-3 flex-shrink-0" /> 
                        <span className="truncate">{item.owner}</span>
                    </span>
                    <span className="text-primary font-medium whitespace-nowrap">Overview only</span>
                </div>
            </CardFooter>
        </Card>
    );
}
