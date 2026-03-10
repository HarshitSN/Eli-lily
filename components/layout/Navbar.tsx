import Link from "next/link";
import { useRouter } from "next/router"; // Router fix
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Navbar() {
    const { user, logout } = useAuth();
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
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center w-full">
            <nav className="flex items-center gap-3 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 bg-white border-b border-gray-200 text-gray-800 w-full mx-auto transition-all">
                <div className="flex items-center justify-between w-full">
                    {/* Logo - much smaller on mobile */}
                    <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 flex-shrink-0">
                        <a href="https://www.lilly.com/" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 sm:space-x-2">
                            <img src="/lilly-logo.svg" alt="Eli Lilly Logo" className="h-5 w-auto sm:h-6 lg:h-7" />
                        </a>
                    </div>

                    {/* Desktop Navigation - better responsive spacing */}
                    <div className="hidden lg:flex items-center space-x-3 xl:space-x-5 text-sm font-medium">
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

                    {/* Desktop User Info */}
                    <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-gray-600 truncate max-w-[150px]">
                            {user?.email}
                        </span>
                        <button
                            onClick={logout}
                            className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors duration-200 whitespace-nowrap"
                        >
                            Logout
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={handleMobileMenuToggle}
                        className="md:hidden p-1.5 sm:p-2 rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-200/50 transition-colors flex-shrink-0"
                        aria-label="Toggle mobile menu"
                    >
                        {isMobileMenuOpen ? (
                            <X className="h-4 w-4 sm:h-5 sm:w-5" />
                        ) : (
                            <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                        )}
                    </button>
                </div>

                {/* Mobile Menu */}
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
                            <div className="border-t border-gray-200 pt-3 mt-2">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <span className="text-xs text-gray-600 truncate max-w-[200px]">
                                        {user?.email}
                                    </span>
                                    <button
                                        onClick={() => {
                                            logout();
                                            handleLinkClick();
                                        }}
                                        className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors duration-200 text-left sm:text-right"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </nav>
        </div>
    );
}
