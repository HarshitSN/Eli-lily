'use client';
import React, { useState } from 'react';

const companies = [
    { 
        name: 'Inspire Brands', 
        domain: 'inspirebrands.com',
        logo: 'https://cdn.worldvectorlogo.com/logos/inspire-brands.svg'
    },
    { 
        name: 'McCain', 
        domain: 'mccain.com',
        logo: 'https://cdn.worldvectorlogo.com/logos/mccain-foods.svg'
    },
    { 
        name: 'IndiGo', 
        domain: 'goindigo.in',
        logo: 'https://cdn.worldvectorlogo.com/logos/indigo-6.svg'
    },
    { 
        name: 'McKinsey & Co', 
        domain: 'mckinsey.com',
        logo: 'https://cdn.worldvectorlogo.com/logos/mckinsey-company.svg'
    },
    { 
        name: 'GoodRx', 
        domain: 'goodrx.com',
        logo: 'https://cdn.worldvectorlogo.com/logos/goodrx.svg'
    },
    { 
        name: 'Shure', 
        domain: 'shure.com',
        logo: 'https://cdn.worldvectorlogo.com/logos/shure.svg'
    },
    { 
        name: 'Avis Budget Group', 
        domain: 'avis.com',
        logo: 'https://cdn.worldvectorlogo.com/logos/avis-budget-group.svg'
    },
    { 
        name: 'CSG', 
        domain: 'csgi.com',
        logo: 'https://cdn.worldvectorlogo.com/logos/csg.svg'
    },
];

function CompanyLogo({ company }: { company: typeof companies[0] }) {
    const [logoSource, setLogoSource] = useState(0);
    const [hasFailedAll, setHasFailedAll] = useState(false);

    const sources = [
        `https://logo.clearbit.com/${company.domain}?size=200`,
        `https://www.google.com/s2/favicons?domain=${company.domain}&sz=128`,
    ];

    const handleNextSource = () => {
        if (logoSource < sources.length - 1) {
            setLogoSource(prev => prev + 1);
        } else {
            setHasFailedAll(true);
        }
    };

    if (hasFailedAll) {
        return (
            <span className="text-[10px] font-bold text-slate-300 border border-slate-100 px-3 py-1 rounded uppercase tracking-[0.1em] whitespace-nowrap">
                {company.name}
            </span>
        );
    }

    return (
        <div className="flex items-center gap-2 sm:gap-3.5 h-8 sm:h-9 group transition-all duration-500 opacity-60 hover:opacity-100 grayscale hover:grayscale-0">
            <div className="h-full w-auto flex items-center justify-center">
                <img
                    src={sources[logoSource]}
                    alt={company.name}
                    className="h-full w-auto object-contain max-w-[100px] sm:max-w-[140px]"
                    onError={handleNextSource}
                />
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-500 group-hover:text-slate-900 transition-colors duration-500 whitespace-nowrap tracking-wide">
                {company.name}
            </span>
        </div>
    );
}

export function CompanyMarquee() {
    return (
        <section className="relative bg-white py-12 sm:py-16 overflow-hidden border-t border-slate-100">
            {/* Heading */}
            <p className="text-center text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-slate-400 mb-8 sm:mb-12 px-4">
                Trusted by fast-growing companies around the world
            </p>

            {/* Marquee container */}
            <div className="relative w-full">
                {/* Horizontal Fade Masks - smaller on mobile */}
                <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 z-10 pointer-events-none bg-gradient-to-r from-white via-white/80 to-transparent" />
                <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 z-10 pointer-events-none bg-gradient-to-l from-white via-white/80 to-transparent" />

                {/* Scrolling track */}
                <div className="flex w-max animate-marquee">
                    {/* First set */}
                    {companies.map((company, idx) => (
                        <div key={`a-${idx}`} className="mx-8 sm:mx-14 shrink-0">
                            <CompanyLogo company={company} />
                        </div>
                    ))}
                    {/* Duplicate set for seamless loop */}
                    {companies.map((company, idx) => (
                        <div key={`b-${idx}`} className="mx-8 sm:mx-14 shrink-0">
                            <CompanyLogo company={company} />
                        </div>
                    ))}
                </div>
            </div>

            <style jsx global>{`
                @keyframes marquee-scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee-scroll 40s linear infinite;
                }
                @media (max-width: 640px) {
                    .animate-marquee {
                        animation: marquee-scroll 30s linear infinite;
                    }
                }
            `}</style>
        </section>
    );
}
