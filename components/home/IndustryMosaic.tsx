import Link from "next/link";
import {
    Plane,
    Stethoscope,
    Landmark,
    ShoppingBag,
    Utensils,
    Store,
    Factory,
    Truck,
    ArrowRight
} from "lucide-react";

const industries = [
    { name: "Aviation", icon: Plane, color: "text-sky-500" },
    { name: "Healthcare", icon: Stethoscope, color: "text-rose-500" },
    { name: "BFSI", icon: Landmark, color: "text-blue-500" },
    { name: "CPG", icon: ShoppingBag, color: "text-amber-500" },
    { name: "QSR", icon: Utensils, color: "text-orange-500" },
    { name: "Retail", icon: Store, color: "text-indigo-500" },
    { name: "Manufacturing", icon: Factory, color: "text-red-500" },
    { name: "Logistics", icon: Truck, color: "text-emerald-500" },
];

export function IndustryMosaic() {
    return (
        <section className="py-24 bg-slate-50/50 border-y border-slate-200">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div className="space-y-4 max-w-2xl">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                            Tailored for your Industry
                        </h2>
                        <p className="text-lg text-slate-500">
                            We understand the unique challenges of your sector. Our solutions are pre-trained on industry-specific data.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {industries.map((industry) => (
                        <Link
                            key={industry.name}
                            href={`/vertical-solutions?industry=${industry.name.toLowerCase()}`}
                            className="group relative flex flex-col items-center justify-center p-8 rounded-3xl bg-white border border-slate-200 hover:border-slate-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                        >
                            <div className={`mb-4 p-4 rounded-2xl bg-slate-50 group-hover:bg-blue-50 transition-colors`}>
                                <industry.icon className={`w-8 h-8 ${industry.color} group-hover:scale-110 transition-transform duration-300`} />
                            </div>
                            <span className="font-bold text-lg text-slate-700 group-hover:text-slate-900 transition-colors">{industry.name}</span>

                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                                <ArrowRight className="w-4 h-4 text-slate-400" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
