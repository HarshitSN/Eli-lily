import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";

interface FilterSectionProps {
    title: string;
    options: string[];
    selected: string[];
    onChange: (option: string) => void;
}

function FilterSection({ title, options, selected, onChange }: FilterSectionProps) {
    return (
        <div className="mb-6">
            <h3 className="font-semibold mb-3 text-sm uppercase text-muted-foreground tacking-wider">{title}</h3>
            <div className="space-y-2">
                {options.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                            id={`${title}-${option}`}
                            checked={selected.includes(option)}
                            onCheckedChange={() => onChange(option)}
                        />
                        <Label
                            htmlFor={`${title}-${option}`}
                            className="text-sm font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            {option.charAt(0).toUpperCase() + option.slice(1).replace('_', ' ')}
                        </Label>
                    </div>
                ))}
            </div>
        </div>
    );
}

interface FilterPanelProps {
    industryOptions: string[];
    capabilityOptions: string[];
    maturityOptions: string[];
    selectedIndustries: string[];
    selectedCapabilities: string[];
    selectedMaturity: string[];
    onIndustryChange: (value: string) => void;
    onCapabilityChange: (value: string) => void;
    onMaturityChange: (value: string) => void;
    onClearAll: () => void;
}

export function FilterPanel({
    industryOptions,
    capabilityOptions,
    maturityOptions,
    selectedIndustries,
    selectedCapabilities,
    selectedMaturity,
    onIndustryChange,
    onCapabilityChange,
    onMaturityChange,
    onClearAll
}: FilterPanelProps) {
    const hasActiveFilters =
        selectedIndustries.length > 0 ||
        selectedCapabilities.length > 0 ||
        selectedMaturity.length > 0;

    return (
        <div className="border rounded-lg p-6 bg-secondary/10 sticky top-24">
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-lg">Filters</h2>
                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={onClearAll} className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-destructive">
                        Clear all
                    </Button>
                )}
            </div>

            <FilterSection
                title="Industry"
                options={industryOptions}
                selected={selectedIndustries}
                onChange={onIndustryChange}
            />

            <div className="h-px bg-border my-6" />

            <FilterSection
                title="Capability"
                options={capabilityOptions}
                selected={selectedCapabilities}
                onChange={onCapabilityChange}
            />

            <div className="h-px bg-border my-6" />

            <FilterSection
                title="Maturity"
                options={maturityOptions}
                selected={selectedMaturity}
                onChange={onMaturityChange}
            />
        </div>
    );
}
