import { useEffect } from 'react';
import { useAccount, useConnect } from 'wagmi';

export function useReconnect() {
    const { isConnected } = useAccount();
    const { connect, connectors } = useConnect();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const lastConnector = window.localStorage.getItem('lastConnector');
            if (!isConnected && lastConnector) {
                const connector = connectors.find(c => c.id === lastConnector);
                if (connector) {
                    connect({ connector });
                }
            }
        }
    }, [isConnected, connect, connectors]);

    useEffect(() => {
        if (isConnected) {
            window.localStorage.setItem('lastConnector', connectors[0].id);
        }
    }, [isConnected, connectors]);
}