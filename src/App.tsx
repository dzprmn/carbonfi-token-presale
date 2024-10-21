import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { RainbowKitProvider, getDefaultWallets, connectorsForWallets } from '@rainbow-me/rainbowkit';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { bscTestnet } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useReconnect } from './hooks/useReconnect';

import Header from './components/Header';
import Footer from './components/Footer';
import Presale from './pages/Presale';

import '@rainbow-me/rainbowkit/styles.css';
import './styles/global.css';

const projectId = '2e21daf14b1f09f22caf8b57a1982449'; // Replace with your actual project ID
const appName = 'CarbonFi Presale';
const chains = [bscTestnet];

const { wallets } = getDefaultWallets({
    appName,
    projectId,
    chains,
});

const connectors = connectorsForWallets([
    ...wallets,
], {
    appName,
    projectId,
});

const wagmiConfig = createConfig({
    connectors,
    chains,
    transports: {
        [bscTestnet.id]: http(),
    },
});

const queryClient = new QueryClient();

function AppContent() {
    useReconnect();

    return (
        <div className="flex flex-col min-h-screen bg-background-dark text-text-primary">
            <Header />
            <main className="flex-grow">
                <Routes>
                    <Route path="/" element={<Presale />} />
                    {/* Add other routes here */}
                </Routes>
            </main>
            <Footer />
        </div>
    );
}

const App: React.FC = () => {
    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider chains={chains}>
                    <Router>
                        <AppContent />
                    </Router>
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
};

export default App;