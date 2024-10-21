import React from 'react';
import { useAccount, useBalance, useConnect, useDisconnect, useEnsName } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const WalletConnectButton: React.FC = () => {
    const { address, isConnected } = useAccount();
    const { data: ensName } = useEnsName({ address });
    const { data: balance } = useBalance({ address });
    const { connect, connectors } = useConnect();
    const { disconnect } = useDisconnect();

    if (isConnected && address) {
        return (
            <div className="flex items-center space-x-2">
                <button
                    className="bg-background-light text-text-primary px-4 py-2 rounded-md border border-primary hover:bg-primary hover:text-background-dark transition-colors"
                    onClick={() => {}}
                >
                    {balance?.formatted.slice(0, 5)} {balance?.symbol}
                </button>
                <button
                    className="bg-primary text-background-dark px-4 py-2 rounded-md hover:bg-opacity-80 transition-colors"
                    onClick={() => {}}
                >
                    {ensName ?? `${address.slice(0, 6)}...${address.slice(-4)}`}
                </button>
                <button
                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
                    onClick={() => disconnect()}
                >
                    Disconnect
                </button>
            </div>
        );
    }

    return (
        <ConnectButton.Custom>
            {({ openConnectModal }) => (
                <button
                    className="bg-primary text-background-dark px-6 py-2 rounded-md hover:bg-opacity-80 transition-colors"
                    onClick={openConnectModal}
                >
                    Connect Wallet
                </button>
            )}
        </ConnectButton.Custom>
    );
};

export default WalletConnectButton;