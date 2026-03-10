import { Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoDemoProps {
    url: string;
}

export function VideoDemo({ url }: VideoDemoProps) {
    return (
        <div className="w-full h-full bg-black flex items-center justify-center relative">
            <iframe
                src={url}
                className="w-full h-full aspect-video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Demo Video"
            />
        </div>
    );
}
