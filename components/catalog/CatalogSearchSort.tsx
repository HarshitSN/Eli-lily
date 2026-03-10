import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface CatalogSearchSortProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    sortValue: string;
    onSortChange: (value: string) => void;
}

export function CatalogSearchSort({ searchTerm, onSearchChange, sortValue, onSortChange }: CatalogSearchSortProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search within this category..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>
            <Select value={sortValue} onValueChange={onSortChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="maturity">Maturity</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
