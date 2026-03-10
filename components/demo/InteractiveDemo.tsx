import { useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InteractiveDemoProps {
    url: string;
}

export function InteractiveDemo({ url }: InteractiveDemoProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    return (
        <div className="w-full h-full bg-background relative flex flex-col">
            {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10 backdrop-blur-sm">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Loading interactive environment...</p>
                </div>
            )}

            {error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background p-8 text-center">
                    <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Unable to load demo</h3>
                    <p className="text-muted-foreground mb-6">The interactive demo could not be loaded. This might be due to security restrictions.</p>
                    <Button onClick={() => window.open(url, '_blank')}>
                        Open in New Tab
                    </Button>
                </div>
            ) : (
                <iframe
                    src={url}
                    className="w-full h-full border-0"
                    onLoad={() => setIsLoading(false)}
                    onError={() => setError(true)}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    title="Interactive Demo"
                />
            )}
        </div>
    );
}
