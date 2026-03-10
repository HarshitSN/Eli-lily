'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Quote, Star, Building2, MapPin } from 'lucide-react';

interface Testimonial {
    id: number;
    content: string;
    author: string;
    role: string;
    company: string;
    location: string;
    rating: number;
    avatar: string;
}

const testimonials: Testimonial[] = [
    {
        id: 1,
        content: "StatusNeoAI's Super Agents have transformed our development workflow. We've seen a 300% increase in deployment velocity.",
        author: "Sarah Chen",
        role: "VP of Engineering",
        company: "TechCorp Solutions",
        location: "San Francisco, CA",
        rating: 5,
        avatar: "SC"
    },
    {
        id: 2,
        content: "The vertical-specific AI agents understand our domain challenges perfectly. What used to take weeks now happens in minutes.",
        author: "Michael Rodriguez",
        role: "Chief Technology Officer",
        company: "Global Aviation Partners",
        location: "Dubai, UAE",
        rating: 5,
        avatar: "MR"
    },
    {
        id: 3,
        content: "Implementing StatusNeoAI was the best decision we made this year. The ROI was evident within the first quarter.",
        author: "Emma Thompson",
        role: "Director of Digital Transformation",
        company: "Healthcare Plus",
        location: "London, UK",
        rating: 5,
        avatar: "ET"
    },
    {
        id: 4,
        content: "The autonomous reasoning capabilities are game-changing. Our SDLC agents catch bugs before they reach production.",
        author: "David Kim",
        role: "Head of DevOps",
        company: "FinTech Innovations",
        location: "Singapore",
        rating: 5,
        avatar: "DK"
    },
    {
        id: 5,
        content: "From compliance monitoring to customer service, StatusNeoAI has revolutionized how we operate.",
        author: "Lisa Anderson",
        role: "Chief Operating Officer",
        company: "RetailMax Group",
        location: "New York, NY",
        rating: 5,
        avatar: "LA"
    },
    {
        id: 6,
        content: "We've tried multiple AI solutions, but StatusNeoAI's Super Agents are in a league of their own.",
        author: "James Wilson",
        role: "CEO",
        company: "Logistics Pro",
        location: "Toronto, Canada",
        rating: 5,
        avatar: "JW"
    },
    {
        id: 7,
        content: "The learning capabilities of these agents are remarkable. They adapt to our specific needs continuously.",
        author: "Priya Patel",
        role: "CTO",
        company: "Manufacturing Hub",
        location: "Mumbai, India",
        rating: 5,
        avatar: "PP"
    },
    {
        id: 8,
        content: "Customer support automation has reduced our response time by 80% while improving satisfaction scores.",
        author: "Carlos Mendez",
        role: "VP Customer Experience",
        company: "ServiceMax",
        location: "Mexico City, Mexico",
        rating: 5,
        avatar: "CM"
    },
    {
        id: 9,
        content: "The compliance agents have saved us countless hours in audit preparation and risk assessment.",
        author: "Nina Kowalski",
        role: "Compliance Officer",
        company: "BankSecure",
        location: "Warsaw, Poland",
        rating: 5,
        avatar: "NK"
    }
];

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
    return (
        <div className="flex-shrink-0 w-56 sm:w-64 md:w-72 lg:w-80 p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl md:rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all duration-300 hover:shadow-xl mx-1 sm:mx-2 md:mx-3">
            {/* Quote Icon */}
            <div className="absolute top-1 sm:top-2 md:top-3 right-1 sm:right-2 md:right-3 text-slate-200">
                <Quote className="w-3 h-3 sm:w-4 md:w-5 sm:h-4 md:h-5" />
            </div>

            {/* Rating */}
            <div className="flex gap-0.5 sm:gap-1 mb-2">
                {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-2 h-2 sm:w-2.5 md:w-3 sm:h-2.5 md:h-3 fill-red-400 text-red-400" />
                ))}
            </div>

            {/* Content */}
            <blockquote className="text-slate-700 leading-relaxed mb-3 text-[10px] sm:text-xs md:text-sm font-light line-clamp-2 sm:line-clamp-2 md:line-clamp-3">
                "{testimonial.content}"
            </blockquote>

            {/* Author */}
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 sm:w-7 md:w-8 rounded-full bg-gradient-to-br from-slate-800 to-slate-600 flex items-center justify-center text-white font-bold text-[10px] sm:text-xs flex-shrink-0">
                    {testimonial.avatar}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900 text-[10px] sm:text-xs">{testimonial.author}</div>
                    <div className="text-[10px] sm:text-xs text-slate-600 truncate">{testimonial.role}</div>
                </div>
            </div>
        </div>
    );
}

function TestimonialRow({ testimonials, speed, direction }: { 
    testimonials: Testimonial[]; 
    speed: number; 
    direction: 'left' | 'right';
}) {
    return (
        <div className="relative overflow-hidden">
            {/* Top blur fade */}
            <div className="absolute top-0 left-0 right-0 h-6 sm:h-8 bg-gradient-to-b from-white via-white/80 to-transparent z-10 pointer-events-none"></div>
            
            {/* Bottom blur fade */}
            <div className="absolute bottom-0 left-0 right-0 h-6 sm:h-8 bg-gradient-to-t from-white via-white/80 to-transparent z-10 pointer-events-none"></div>
            
            <div 
                className={`flex gap-3 sm:gap-4 py-3 sm:py-4 ${
                    direction === 'left' ? 'animate-scroll-left' : 'animate-scroll-right'
                }`}
                style={{ animationDuration: `${speed}s` }}
            >
                {/* First set */}
                {testimonials.map((testimonial: Testimonial) => (
                    <TestimonialCard key={testimonial.id} testimonial={testimonial} />
                ))}
                {/* Duplicate set for seamless loop */}
                {testimonials.map((testimonial: Testimonial) => (
                    <TestimonialCard key={`${testimonial.id}-duplicate`} testimonial={testimonial} />
                ))}
            </div>
        </div>
    );
}

export function TestimonialsSection() {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, []);

    // Split testimonials into 3 rows
    const row1 = testimonials.slice(0, 3);
    const row2 = testimonials.slice(3, 6);
    const row3 = testimonials.slice(6, 9);

    return (
        <section className="py-16 sm:py-20 md:py-24 bg-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 sm:top-40 left-10 sm:left-20 w-40 sm:w-60 md:w-80 h-40 sm:h-60 md:h-80 bg-slate-100/20 rounded-full blur-2xl sm:blur-3xl"></div>
                <div className="absolute bottom-20 sm:bottom-40 right-10 sm:right-20 w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 bg-slate-100/20 rounded-full blur-2xl sm:blur-3xl"></div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 relative z-10">
                <motion.div
                    ref={ref}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isVisible ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12 sm:mb-16"
                >
                    <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50/50 px-3 sm:px-4 py-1 sm:py-1.5 text-xs font-bold tracking-widest text-slate-700 uppercase shadow-sm mb-4 sm:mb-6">
                        Customer Success
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-3 sm:mb-4">
                        Trusted by <span className="text-slate-600">Industry Leaders</span>
                    </h2>
                    <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 font-light px-4">
                        See what our customers have to say about their transformation journey with StatusNeoAI.
                    </p>
                </motion.div>

                {/* Three rows of scrolling testimonials */}
                <div className="space-y-3 sm:space-y-4 max-w-6xl sm:max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={isVisible ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <TestimonialRow testimonials={row1} speed={25} direction="left" />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={isVisible ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.4 }}
                    >
                        <TestimonialRow testimonials={row2} speed={30} direction="right" />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={isVisible ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.6 }}
                    >
                        <TestimonialRow testimonials={row3} speed={28} direction="left" />
                    </motion.div>
                </div>

                {/* Additional CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isVisible ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="text-center mt-12 sm:mt-16"
                >
                    <div className="inline-flex items-center gap-2 text-sm text-slate-600">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs sm:text-sm">Join 500+ companies transforming their operations with AI</span>
                    </div>
                </motion.div>
            </div>

            <style jsx global>{`
                @keyframes scroll-left {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                
                @keyframes scroll-right {
                    0% { transform: translateX(-50%); }
                    100% { transform: translateX(0); }
                }
                
                .animate-scroll-left {
                    animation: scroll-left linear infinite;
                }
                
                .animate-scroll-right {
                    animation: scroll-right linear infinite;
                }
                
                @media (max-width: 640px) {
                    .animate-scroll-left {
                        animation-duration: 30s !important;
                    }
                    .animate-scroll-right {
                        animation-duration: 35s !important;
                    }
                }
            `}</style>
        </section>
    );
}
