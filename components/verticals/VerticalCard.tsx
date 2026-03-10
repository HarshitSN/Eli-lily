"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface VerticalCardProps {
    title: string;
    description: string;
    demoUrl?: string;
    tryUrl?: string;
    interactiveUrl?: string;
    className?: string;
}

export function VerticalCard({
    title,
    description,
    className,
}: VerticalCardProps) {
    return (
        <Card className={`h-full flex flex-col hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm group ${className}`}>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-primary line-clamp-2 leading-tight">
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
                <CardDescription className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                    {description}
                </CardDescription>
            </CardContent>
            <CardFooter className="pt-3 mt-auto">
                <Badge variant="outline" className="text-xs text-slate-600">
                    Listing only
                </Badge>
            </CardFooter>
        </Card>
    );
}
