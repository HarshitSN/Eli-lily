import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Fuse from 'fuse.js';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CatalogItem } from '@/types';
import { getAllCatalogItems } from '@/lib/content';

export function GlobalSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<CatalogItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // In a real app, this would be an API call, but for static site we load client-side or use API route
    // For this MVP, we'll fetch from an API route we'll create next
    useEffect(() => {
        if (query.length > 2) {
            setIsLoading(true);
            fetch('/api/search?q=' + encodeURIComponent(query))
                .then(res => res.json())
                .then(data => {
                    setResults(data);
                    setIsLoading(false);
                    setIsOpen(true);
                })
                .catch(err => {
                    console.error(err);
                    setIsLoading(false);
                });
        } else {
            setResults([]);
            setIsOpen(false);
        }
    }, [query]);

    // Close formatting on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    // Clear search on route change
    useEffect(() => {
        const handleRouteChange = () => {
            setIsOpen(false);
            setQuery('');
        };
        router.events.on('routeChangeStart', handleRouteChange);
        return () => {
            router.events.off('routeChangeStart', handleRouteChange);
        };
    }, [router.events]);

    return (
        <div ref={wrapperRef} className="relative w-full max-w-sm hidden md:block">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search..."
                    className="w-full pl-9 pr-8"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length > 2 && setIsOpen(true)}
                />
                {isLoading ? (
                    <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                ) : query && (
                    <X className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => setQuery('')} />
                )}
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute top-full mt-2 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95 z-50 overflow-hidden">
                    <div className="max-h-[300px] overflow-y-auto p-1">
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Results</div>
                        {results.map((item) => (
                            <Link key={item.id} href={`/${item.type.replace('_', '-')}s/${item.slug}`}>
                                <div className="relative flex select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer">
                                    <div className="flex flex-col">
                                        <span className="font-medium">{item.title}</span>
                                        <span className="text-xs text-muted-foreground line-clamp-1">{item.shortDescription}</span>
                                        <div className="flex gap-1 mt-1">
                                            <span className="text-[10px] uppercase bg-secondary px-1 rounded">{item.type.replace('_', ' ')}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {isOpen && results.length === 0 && !isLoading && (
                <div className="absolute top-full mt-2 w-full rounded-md border bg-popover p-4 shadow-md text-sm text-muted-foreground text-center z-50">
                    No results found.
                </div>
            )}
        </div>
    );
}
