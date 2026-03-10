export function Footer() {
    return (
        <footer className="border-t py-6 md:py-0">
            <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row px-4">
                <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                    © {new Date().getFullYear()} Eli Lilly and Company. All rights reserved. <br className="md:hidden" />
                    <span className="md:ml-4 font-medium text-slate-500">Built and powered by StatusNeo</span>
                </p>
            </div>
        </footer>
    );
}
