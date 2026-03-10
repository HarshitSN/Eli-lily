import { useState } from 'react';
import { CheckCircle2, Circle, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DemoConfig, DemoStep } from '@/types';

interface DemoStepsProps {
    config: DemoConfig;
    currentStepIndex: number;
    onStepClick: (index: number) => void;
    expanded: boolean;
    onToggleExpand: () => void;
}

export function DemoSteps({ config, currentStepIndex, onStepClick, expanded, onToggleExpand }: DemoStepsProps) {
    return (
        <div className={cn(
            "bg-background border-r flex flex-col transition-all duration-300",
            expanded ? "w-80" : "w-12 items-center"
        )}>
            <div className="p-4 border-b flex items-center justify-between">
                {expanded && <h2 className="font-semibold text-lg">Guided Tour</h2>}
                <button onClick={onToggleExpand} className="p-1 hover:bg-secondary rounded">
                    {expanded ? <ChevronRight size={16} className="rotate-180" /> : <ChevronRight size={16} />}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {config.steps.map((step, index) => {
                    const isActive = index === currentStepIndex;
                    const isCompleted = index < currentStepIndex;

                    return (
                        <div
                            key={step.id}
                            className={cn(
                                "cursor-pointer hover:bg-secondary/50 transition-colors border-b last:border-0",
                                isActive && "bg-secondary/30",
                                !expanded && "p-2 flex justify-center",
                                expanded && "p-4"
                            )}
                            onClick={() => onStepClick(index)}
                        >
                            {expanded ? (
                                <div className="flex gap-3">
                                    <div className="mt-0.5">
                                        {isCompleted ? (
                                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                                        ) : (
                                            <div className={cn(
                                                "w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold",
                                                isActive ? "border-primary text-primary" : "border-muted-foreground text-muted-foreground"
                                            )}>
                                                {index + 1}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className={cn("text-sm font-medium mb-1", isActive ? "text-primary" : "text-foreground")}>
                                            {step.title}
                                        </h3>
                                        {isActive && (
                                            <p className="text-xs text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-left-2">
                                                {step.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="relative group">
                                    {isCompleted ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    ) : (
                                        <div className={cn(
                                            "w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold",
                                            isActive ? "border-primary text-primary" : "border-muted-foreground text-muted-foreground"
                                        )}>
                                            {index + 1}
                                        </div>
                                    )}
                                    {/* Tooltip for collapsed state */}
                                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-popover border shadow-md px-2 py-1 rounded text-xs whitespace-nowrap hidden group-hover:block z-50">
                                        {step.title}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
