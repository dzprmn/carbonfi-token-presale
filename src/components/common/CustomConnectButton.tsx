import React from 'react';
import { useConnectModal, useAccountModal, useChainModal } from '@rainbow-me/rainbowkit';
import { useAccount, useEnsName, useBalance, useChainId } from 'wagmi';
import { bscTestnet } from 'wagmi/chains';

// Inline trim function
const trim = (num: number, decimals = 2) => {
    return parseFloat(num.toFixed(decimals));
};

// Define the correct network
const CORRECT_NETWORK = bscTestnet;

// Simple placeholder SVG for network logo
const NetworkLogo = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="2"/>
        <path d="M7 12H17M12 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

const CustomConnectButton: React.FC = () => {
    const { openConnectModal } = useConnectModal();
    const { openAccountModal } = useAccountModal();
    const { openChainModal } = useChainModal();
    const { address, isConnected } = useAccount();
    const { data: ensName } = useEnsName({ address });
    const { data: balance } = useBalance({ address });
    const chainId = useChainId();

    const isWrongNetwork = isConnected && chainId !== CORRECT_NETWORK.id;

    const handleClick = () => {
        if (!isConnected) {
            openConnectModal?.();
        } else {
            openAccountModal?.();
        }
    };

    const handleChainClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        openChainModal?.();
    };

    const buttonText = () => {
        if (!isConnected) return "Connect Wallet";
        return balance?.formatted
            ? `${trim(parseFloat(balance.formatted), 4)} ${balance.symbol}`
            : "Connected";
    };

    return (
        <div className="flex items-center space-x-2">
            <button
                onClick={handleChainClick}
                type="button"
                className={`p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 
                    ${isWrongNetwork
                    ? 'text-red-600 bg-red-100 hover:bg-red-200 focus:ring-red-500'
                    : 'text-gray-600 bg-gray-100 hover:bg-gray-200 focus:ring-gray-500'}`}
                title={isWrongNetwork ? `Switch to ${CORRECT_NETWORK.name}` : 'Switch Network'}
            >
                <NetworkLogo />
            </button>
            <button
                onClick={handleClick}
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm
          text-white bg-primary hover:bg-primary-dark
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
                {buttonText()}
                {isConnected && (
                    <span className="ml-2 text-gray-300">
                        {ensName || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Unknown')}
                    </span>
                )}
            </button>
        </div>
    );
};

export default CustomConnectButton;