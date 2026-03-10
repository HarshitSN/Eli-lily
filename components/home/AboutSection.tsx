import Image from "next/image";

export function AboutSection() {
    const stats = [
        { value: "145+", label: "Years making medicine" },
        { value: "100+", label: "Patented medications" },
        { value: "2", label: "Nobel Prizes for medicine" },
    ];

    const highlights = [
        {
            imageSrc:
                "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn%3Aaaid%3Aaem%3A92397694-12d6-4365-bf65-c2ee95cc3d85/as/Home_M%26Q.avif?assetname=Home_M%26Q.jpg",
            imageAlt: "Lilly employee working on a manufacturing line",
            title: "Medicine starts with safety",
            description:
                "Thousands of employees work every day to make sure Lilly medicine is made consistently and with the highest quality. Manufacturing and quality are some of the most important parts of our process.",
            cta: "Examine our process",
            href: "https://www.lilly.com/medicines/safety/manufacturing-quality",
        },
        {
            imageSrc:
                "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn%3Aaaid%3Aaem%3Adfce8208-645c-489c-a130-6730c23ad94d/as/pills_with_drinking_glass.avif?assetname=pills_with_drinking_glass.jpg",
            imageAlt: "Glass of water on a table with a pill organizer and three loose pills",
            title: "Protect yourself from counterfeits",
            description:
                "We give you the information you need to better protect yourself against counterfeit, fake and unsafe or untested products.",
            cta: "How to spot counterfeits",
            href: "https://www.lilly.com/medicines/safety/counterfeit",
        },
        {
            imageSrc:
                "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn%3Aaaid%3Aaem%3A87f28a6c-dbc0-46ad-a1c3-c8be1dc5ebf4/as/woman_sitting_on_bed.avif?assetname=woman_sitting_on_bed.jpg",
            imageAlt: "Woman siting on a bed",
            title: "The hope of medicine for every body",
            description:
                "We may one day be able to make medicine that's tailored to an individual's biology using new treatments made from their own genetic code. See what today's research means for the medicine of tomorrow.",
            cta: "What is genetic medicine",
            href: "https://www.lilly.com/science/research-development/genetic-medicines",
        },
    ];

    return (
        <section className="bg-white border-t border-slate-200 py-16 sm:py-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="max-w-3xl">
                    <p className="text-xs font-bold tracking-[0.2em] text-slate-500 uppercase">About Lilly</p>
                    <h2 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                        Our job is to put health above all.
                    </h2>
                    <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
                        Our research focuses on developing life-changing medicines for everyone, regardless of their condition&rsquo;s prevalence or complexity. And we know our biggest advancements are still ahead of us.
                    </p>
                </div>

                <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
                    {stats.map((stat) => (
                        <div key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                            <p className="text-4xl font-black text-red-700">{stat.value}</p>
                            <p className="mt-2 text-sm text-slate-600">{stat.label}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {highlights.map((item) => (
                        <article key={item.title} className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
                            <Image
                                src={item.imageSrc}
                                alt={item.imageAlt}
                                width={1200}
                                height={700}
                                className="h-44 w-full object-cover border-b border-slate-200"
                            />
                            <div className="p-5">
                                <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                                <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.description}</p>
                                <a
                                    className="mt-5 inline-block text-sm font-semibold text-red-700 hover:text-red-800 transition-colors"
                                    href={item.href}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    {item.cta}
                                </a>
                            </div>
                        </article>
                    ))}
                </div>

                <p className="mt-10 text-xs text-slate-500">
                    CMAT-11575 02/2026 &copy;Lilly USA, LLC 2026. All rights reserved.
                </p>
            </div>
        </section>
    );
}
