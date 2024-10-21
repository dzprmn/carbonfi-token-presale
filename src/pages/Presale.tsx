import React, { useState, useEffect } from 'react';
import { usePresaleContract } from '../hooks/usePresaleContract';
import PresaleStatus from './PresaleStatus';
import PresaleInfo from './PresaleInfo';
import PresaleForm from './PresaleForm';
import ContributionStatus from './ContributionStatus';

const Presale: React.FC = () => {
    const { getPresaleStatus, isInitialized } = usePresaleContract();
    const [presaleStatus, setPresaleStatus] = useState<string>('');

    useEffect(() => {
        const fetchPresaleStatus = async () => {
            if (isInitialized) {
                const status = await getPresaleStatus();
                setPresaleStatus(status);
            }
        };

        fetchPresaleStatus();
        const interval = setInterval(fetchPresaleStatus, 300000); // Refresh every 5 minutes

        return () => clearInterval(interval);
    }, [isInitialized, getPresaleStatus]);

    return (
        <div className="bg-background-dark min-h-screen">
            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-bold mb-8 text-center text-green-400">CarbonFi Presale</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-background-light rounded-lg shadow-lg overflow-hidden">
                            <PresaleStatus />
                        </div>
                        <div className="bg-background-light rounded-lg shadow-lg overflow-hidden">
                            <PresaleInfo />
                        </div>
                    </div>
                    <div className="lg:col-span-1">
                        <div className="bg-background-light rounded-lg shadow-lg overflow-hidden sticky top-20">
                            {presaleStatus === "Ended" ? <ContributionStatus /> : <PresaleForm />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Presale;