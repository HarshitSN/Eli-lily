import { ArrowDown } from "lucide-react";

export function HeroSection() {
    return (
        <section className="relative flex flex-col items-center justify-center min-h-[90vh] px-4 text-center overflow-hidden pt-24">
            {/* Ambient Background - matching Bento theme */}
            <div className="absolute inset-0 -z-10 bg-slate-50/50" />
            <div className="absolute inset-0 -z-10 opacity-[0.03]"
                style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '24px 24px' }}
            />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-blue-100/20 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-4xl mx-auto space-y-8 animate-slide-up relative z-10">
                <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-600 shadow-sm mb-4">
                    <span className="flex h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
                    Now with Autonomous Agents
                </div>

                <h1 className="text-5xl font-bold tracking-tight text-slate-900 sm:text-7xl md:text-8xl leading-[1.1]">
                    Intelligence, <br />
                    <span className="text-slate-400">Reimagined.</span>
                </h1>

                <p className="max-w-2xl mx-auto text-xl text-slate-500 md:text-2xl font-light leading-relaxed animate-slide-up-delayed opacity-0" style={{ animationFillMode: 'forwards' }}>
                    StatusNeoAI brings autonomous capability to every layer of your enterprise.
                    From industry-specific solutions to SDLC acceleration.
                </p>

                <div className="flex items-center justify-center gap-4 pt-4 opacity-0 animate-slide-up-delayed" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
                    {/* Buttons could go here if needed, keeping it clean for now as per design */}
                </div>
            </div>

            <div className="absolute bottom-10 animate-bounce cursor-pointer opacity-50 hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600">
                <ArrowDown className="w-6 h-6" />
            </div>
        </section>
    );
}
