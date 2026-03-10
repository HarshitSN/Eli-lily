'use client';
import React, { useState } from 'react';
import { Search } from "lucide-react";
import { useRouter } from 'next/navigation';

export function Hero() {
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleSearchClick = () => {
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <section className="relative flex flex-col items-center justify-center px-4 py-16 sm:py-20 md:py-24 text-center min-h-[70vh] sm:min-h-[75vh] md:min-h-[85vh] bg-white pt-24 mt-16 border-b border-slate-200">
            {/* --- HERO CONTENT --- */}
            <div className="relative z-10 space-y-4 sm:space-y-6 max-w-4xl mx-auto w-full">
                <div className="inline-flex items-center px-3 py-1 text-sm font-semibold tracking-wide text-red-600 uppercase">
                    Eli Lilly Ecosystem
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.1] sm:leading-[1.2]">
                    Explore Our <span className="text-red-600">AgenticAI Factory</span> <br />

                </h1>

                <p className="max-w-[400px] sm:max-w-[500px] mx-auto text-sm sm:text-base text-slate-500 font-light leading-relaxed">
                    Accelerating authentic AI-led Transformations,
                    Designed & Engineered
                    for the Modern Digital Enterprise.
                </p>

                {/* --- CENTERED SEARCH BAR --- */}
                <div className="relative w-full max-w-md sm:max-w-lg mx-auto pt-4 sm:pt-6 group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-500 z-10">
                        <Search className="w-5 h-5" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearch}
                        placeholder="Search for agents, solutions, or products..."
                        className="h-14 w-full pl-12 pr-6 rounded-md text-base shadow-sm border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all bg-white placeholder:text-slate-400"
                    />
                </div>
            </div>
        </section>
    );
}