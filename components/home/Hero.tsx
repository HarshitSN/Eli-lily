'use client';
import React from 'react';

export function Hero() {
    return (
        <section className="relative flex flex-col items-center justify-center px-4 py-16 sm:py-20 md:py-24 text-center min-h-[70vh] sm:min-h-[75vh] md:min-h-[85vh] bg-white pt-24 mt-16 border-b border-slate-200">
            {/* --- HERO CONTENT --- */}
            <div className="relative z-10 space-y-4 sm:space-y-6 max-w-4xl mx-auto w-full">
                <div className="inline-flex items-center px-3 py-1 text-sm font-semibold tracking-wide text-red-600 uppercase">
                    Eli Lilly Ecosystem
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.1] sm:leading-[1.2]">
                    Explore Lilly&apos;s <span className="text-red-700 transition-all duration-300 hover:bg-red-600 hover:text-white px-2 py-1 rounded cursor-default inline-block">AgenticAI Factory</span> <br />

                </h1>

                <p className="max-w-[400px] sm:max-w-[500px] mx-auto text-sm sm:text-base text-slate-500 font-light leading-relaxed">
                    Accelerating authentic AI-led Transformations,
                    Designed &amp; Engineered
                    for the Modern Digital Enterprise.
                </p>

                <div className="text-lg font-semibold text-slate-400 pt-2">
                    Powered by <span className="text-slate-600 font-bold">StatusNeo</span>
                </div>
            </div>
        </section>
    );
}
