"use client";

import { Video, ArrowRight } from "lucide-react";
import Link from "next/link";

interface ActionableCardProps {
    title: string;
    description: string;
    demoUrl?: string;
    tryUrl?: string;
}

export function ActionableCard({
    title,
    description,
    demoUrl = "#",
    tryUrl = "#",
}: ActionableCardProps) {
    return (
        <div className="flex flex-col bg-white border border-gray-100 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 h-full p-5 text-left">

            {/* Header / Title */}
            <h3 className="text-[16px] font-bold text-gray-900 mb-2 tracking-tight leading-snug">
                {title}
            </h3>

            {/* Description Body */}
            <p className="text-[13px] text-gray-500 mb-4 flex-grow leading-relaxed font-normal">
                {description}
            </p>

            {/* Footer Buttons */}
            <div className="flex items-center gap-3 mt-auto pt-4 border-t border-gray-50">
                <Link
                    href={demoUrl}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-gray-200 text-gray-600 font-medium text-[12px] hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                    <Video className="w-4 h-4" />
                    Demo
                </Link>
                <Link
                    href={tryUrl}
                    target={tryUrl.startsWith("http") ? "_blank" : undefined}
                    rel={tryUrl.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 text-white font-medium text-[12px] hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/20 transition-all"
                >
                    Try
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        </div>
    );
}
