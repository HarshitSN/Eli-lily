import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface ProductCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
}

export function ProductCard({ icon: Icon, title, description }: ProductCardProps) {
    return (
        <Card className="h-full bg-white border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
            <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center mb-4 group-hover:bg-blue-50 transition-colors">
                    <Icon className="w-6 h-6 text-gray-600 group-hover:text-blue-600 transition-colors" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <CardDescription className="text-gray-600 text-base leading-relaxed">
                    {description}
                </CardDescription>
            </CardContent>
        </Card>
    );
}
