import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Navbar() {

    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const isActive = (path: string) => {
        if (path === "/" && router.pathname === "/") return true;
        if (path !== "/" && router.pathname.startsWith(path)) return true;
        return false;
    };

    const handleMobileMenuToggle = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const handleLinkClick = () => {
        setIsMobileMenuOpen(false);
    };

    const navItems = [
        { href: "/", label: "Home" },
        { href: "/business-intelligence", label: "BI&A" },
        { href: "/field-force-effectiveness", label: "GOSO" },
        { href: "/global-content-hub", label: "GCH" },
        { href: "/omnichannel-personalization", label: "OMNICHANNEL" },
        { href: "/commercial-learning-services", label: "CLS" },
    ];

    return (
        <div className="fixed top-4 left-0 right-0 z-50 flex justify-center w-full px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center justify-between px-6 py-3 bg-gray-50/90 backdrop-blur-md rounded-full shadow-sm text-gray-800 w-full max-w-6xl mx-auto border border-gray-200/50">

                {/* Logo */}
                <div className="flex items-center flex-shrink-0">
                    <a href="https://www.lilly.com/" target="_blank" rel="noopener noreferrer" className="flex items-center hover:opacity-80 transition-opacity">
                        <img src="/lilly-logo.svg" alt="Eli Lilly Logo" className="h-6 sm:h-7 w-auto" />
                    </a>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden lg:flex items-center justify-center flex-1 space-x-6 text-sm font-medium">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`transition-all duration-200 hover:text-red-400 hover:scale-105 whitespace-nowrap ${isActive(item.href) ? "text-red-400 font-semibold" : "text-gray-600"
                                }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>

                {/* Tablet Navigation - compact version */}
                <div className="hidden md:flex lg:hidden items-center space-x-2 text-xs font-medium">
                    {navItems.slice(0, 3).map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`transition-all duration-200 hover:text-red-400 hover:scale-105 whitespace-nowrap ${isActive(item.href) ? "text-red-400 font-semibold" : "text-gray-600"
                                }`}
                        >
                            {item.label.length > 12 ? item.label.split(' ')[0] : item.label}
                        </Link>
                    ))}
                    <span className="text-gray-400">...</span>
                </div>

                {/* Desktop User Info Removed */}
                <div className="hidden lg:flex items-center flex-shrink-0">
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={handleMobileMenuToggle}
                    className="lg:hidden p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 transition-colors"
                    aria-label="Toggle mobile menu"
                >
                    {isMobileMenuOpen ? (
                        <X className="h-5 w-5" />
                    ) : (
                        <Menu className="h-5 w-5" />
                    )}
                </button>

                {/* Mobile Menu Dropdown */}
                {isMobileMenuOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 mx-2 sm:mx-4 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                        <div className="flex flex-col p-3 sm:p-4 space-y-2 sm:space-y-3">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={handleLinkClick}
                                    className={`transition-all duration-200 hover:text-red-400 hover:scale-105 px-3 py-2 rounded-md text-sm font-medium ${isActive(item.href) ? "text-red-400 font-semibold bg-red-50" : "text-gray-600 hover:bg-gray-50"
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            ))}
                            {/* Removed Indicators from mobile */}
                        </div>
                    </div>
                )}
            </nav>
        </div>
    );
}
