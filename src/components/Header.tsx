import React, { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Link, useLocation } from 'react-router-dom';

type NavItemBase = {
    label: string;
};

type ExternalNavItem = NavItemBase & {
    href: string;
    external?: boolean;
    download?: string;
};

type InternalNavItem = NavItemBase & {
    to: string;
};

type NavItem = ExternalNavItem | InternalNavItem;

const isInternalNavItem = (item: NavItem): item is InternalNavItem => {
    return 'to' in item;
};

const Header: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSticky, setIsSticky] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setIsSticky(window.scrollY > 0);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const navItems: NavItem[] = [
        { label: 'Home', href: 'https://carbonfi.io', external: true },
        { label: 'Presale', to: '/' },
        { label: 'Whitepaper', href: '/carbonfi-whitepaper.pdf', download: 'CarbonFi-Whitepaper.pdf' },
    ];

    const NavItem: React.FC<{ item: NavItem }> = ({ item }) => {
        if (isInternalNavItem(item)) {
            return (
                <Link
                    to={item.to}
                    className={`hover:text-primary transition-colors ${location.pathname === item.to ? 'text-primary' : ''}`}
                >
                    {item.label}
                </Link>
            );
        }
        return (
            <a
                href={item.href}
                download={item.download}
                className="hover:text-primary transition-colors"
                {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
                {item.label}
            </a>
        );
    };

    return (
        <header className={`bg-background-light text-text-primary w-full ${isSticky ? 'sticky top-0 z-50 shadow-md' : ''} border-b border-gray-700`}>
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex justify-between items-center py-4">
                    <div className="flex items-center">
                        <img src="/logo-wide.png" alt="CarbonFi Logo" className="h-16 w-48 hidden md:block" />
                        <img src="/logo-square.png" alt="CarbonFi Logo" className="h-12 w-12 md:hidden" />
                    </div>

                    <nav className="hidden md:flex items-center space-x-6">
                        {navItems.map((item, index) => (
                            <NavItem key={index} item={item} />
                        ))}
                        <ConnectButton />
                    </nav>

                    <div className="flex items-center space-x-2 md:hidden">
                        <ConnectButton />
                        <button className="text-text-primary focus:outline-none" onClick={toggleMenu}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                            </svg>
                        </button>
                    </div>
                </div>

                {isMenuOpen && (
                    <nav className="md:hidden py-4 space-y-2">
                        {navItems.map((item, index) => (
                            <div key={index} className="block py-2 hover:bg-background-dark transition-colors">
                                <NavItem item={item} />
                            </div>
                        ))}
                    </nav>
                )}
            </div>
        </header>
    );
}

export default Header;