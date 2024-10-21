import React from 'react';
import { FaTelegram, FaDiscord, FaYoutube } from 'react-icons/fa';
import { FaXTwitter } from "react-icons/fa6";

const Footer: React.FC = () => {
    return (
        <footer className="bg-background-dark text-text-secondary py-8">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex justify-center space-x-8 mb-6">
                    <a href="https://t.me/CarbonFiHQ" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-primary transition-colors duration-300">
                        <FaTelegram size={28} />
                    </a>
                    <a href="https://x.com/CarbonFiHQ" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-primary transition-colors duration-300">
                        <FaXTwitter size={28} />
                    </a>
                    <a href="https://discord.gg/CarbonFiHQ" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-primary transition-colors duration-300">
                        <FaDiscord size={28} />
                    </a>
                    <a href="https://youtube.com/@CarbonFiHQ" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-primary transition-colors duration-300">
                        <FaYoutube size={28} />
                    </a>
                </div>
                <p className="text-center text-sm">&copy; {new Date().getFullYear()} CarbonFi. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;