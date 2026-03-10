import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MonitorPlay, Maximize, Minimize, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DemoSteps } from '@/components/demo/DemoSteps';
import { VideoDemo } from '@/components/demo/VideoDemo';
import { InteractiveDemo } from '@/components/demo/InteractiveDemo';
import { CatalogItem, DemoConfig } from '@/types';

interface DemoRunnerProps {
    item: CatalogItem;
    config: DemoConfig;
}

export function DemoRunner({ item, config }: DemoRunnerProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [mode, setMode] = useState<'video' | 'interactive' | 'guided'>(item.demoModes[0] || 'video');

    const handleNext = () => {
        if (currentStep < config.steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background">
            {/* Top Bar */}
            <header className="h-14 border-b flex items-center justify-between px-4 bg-background z-20 shadow-sm shrink-0">
                <div className="flex items-center gap-4">
                    <Link href={`/catalog/${item.slug}`} className="text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex items-center gap-2">
                        <h1 className="font-semibold text-sm md:text-base hidden sm:block">{item.title}</h1>
                        <span className="text-muted-foreground hidden sm:inline">•</span>
                        <span className="text-muted-foreground text-sm uppercase tracking-wider">{mode} Demo</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep(0)} title="Restart Demo">
                        <RefreshCw className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Restart</span>
                    </Button>
                    <div className="h-4 w-px bg-border mx-1" />
                    <Button variant="ghost" size="icon" onClick={toggleFullscreen} title="Toggle Fullscreen">
                        {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    </Button>
                    <Button size="sm" asChild variant="default" className="ml-2">
                        <Link href={`/${item.type.replace('_', '-')}s/${item.slug}`}>Exit Demo</Link>
                    </Button>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <DemoSteps
                    config={config}
                    currentStepIndex={currentStep}
                    onStepClick={setCurrentStep}
                    expanded={isSidebarExpanded}
                    onToggleExpand={() => setIsSidebarExpanded(!isSidebarExpanded)}
                />

                {/* Demo Surface */}
                <main className="flex-1 flex flex-col bg-secondary/10 relative">
                    <div className="flex-1 relative overflow-hidden">
                        {mode === 'interactive' && item.interactiveUrl && (
                            <InteractiveDemo url={item.interactiveUrl} />
                        )}
                        {mode === 'video' && item.videoUrl && (
                            <VideoDemo url={item.videoUrl} />
                        )}
                        {mode === 'guided' && (
                            <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground p-8 text-center animate-in fade-in">
                                <div className="max-w-md">
                                    <MonitorPlay className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <h3 className="text-xl font-medium mb-2">Step {currentStep + 1}: {config.steps[currentStep].title}</h3>
                                    <p className="mb-8">{config.steps[currentStep].description}</p>
                                    <p className="text-sm italic">Guided screenshots would appear here to match the step.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Navigation Control */}
                    <div className="h-16 border-t bg-background px-6 flex items-center justify-between shrink-0">
                        <div className="text-sm text-muted-foreground">
                            Step {currentStep + 1} of {config.steps.length}
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={handlePrev} disabled={currentStep === 0}>
                                Previous
                            </Button>
                            <Button onClick={handleNext} disabled={currentStep === config.steps.length - 1}>
                                Next Step
                            </Button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
