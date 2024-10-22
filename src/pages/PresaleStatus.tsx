import React, { useState, useEffect } from 'react';
import { usePresaleContract } from '../hooks/usePresaleContract';
import { logger } from '../utils/logger';

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

interface PresaleInfo {
    startTime: string;
    endTime: string;
}

const PresaleStatus: React.FC = () => {
    const { getPresaleInfo, getPresaleStatus, isInitialized } = usePresaleContract();
    const [timeLeft, setTimeLeft] = useState<TimeLeft>({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });
    const [presaleInfo, setPresaleInfo] = useState<PresaleInfo | null>(null);
    const [presaleStatus, setPresaleStatus] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchPresaleInfo = async () => {
            if (!isInitialized) {
                logger.log("Contract is not yet initialized. Waiting...");
                return;
            }

            try {
                setIsLoading(true);
                logger.log("Fetching presale info and status...");

                const info = await getPresaleInfo();

                if (!info) {
                    throw new Error("Unable to fetch presale information");
                }

                const status = await getPresaleStatus();

                logger.log("Received presale data:", {
                    info,
                    status,
                });

                // Validate the required fields
                if (!info.startTime || !info.endTime) {
                    throw new Error("Invalid presale times received");
                }

                setPresaleInfo({
                    startTime: info.startTime,
                    endTime: info.endTime
                });

                setPresaleStatus(status);

            } catch (error) {
                logger.error("Failed to fetch presale info:", error);
                setError("Unable to load presale information. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        if (isInitialized) {
            fetchPresaleInfo();
            const interval = setInterval(fetchPresaleInfo, 300000); // Refresh every 5 minutes
            return () => clearInterval(interval);
        }
    }, [getPresaleInfo, getPresaleStatus, isInitialized]);

    useEffect(() => {
        if (!presaleInfo) return;

        const timer = setInterval(() => {
            try {
                const now = new Date().getTime();
                let targetTime = presaleStatus === 'Not started' ?
                    parseInt(presaleInfo.startTime) * 1000 :
                    parseInt(presaleInfo.endTime) * 1000;

                const distance = targetTime - now;

                if (distance < 0) {
                    if (presaleStatus === 'Not started' && now < parseInt(presaleInfo.endTime) * 1000) {
                        // Presale has just started, switch to counting down to end time
                        setPresaleStatus('Active');
                        targetTime = parseInt(presaleInfo.endTime) * 1000;
                        logger.log("Presale status changed to Active");
                    } else {
                        clearInterval(timer);
                        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                        setPresaleStatus('Ended');
                        logger.log("Presale has ended");
                        return;
                    }
                }

                setTimeLeft({
                    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((distance % (1000 * 60)) / 1000)
                });
            } catch (error) {
                logger.error("Error updating countdown:", error);
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [presaleInfo, presaleStatus]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active':
                return 'text-green-500';
            case 'Not started':
                return 'text-yellow-500';
            case 'Ended':
                return 'text-red-500';
            default:
                return 'text-gray-500';
        }
    };

    if (isLoading) {
        return (
            <div className="p-6 text-center">
                <p className="text-lg">Loading presale information...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center">
                <p className="text-red-500">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!presaleInfo) {
        return (
            <div className="p-6 text-center">
                <p className="text-lg">No presale information available.</p>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h3 className="text-2xl font-bold mb-6 text-center text-green-400">
                {presaleStatus === 'Not started' ? 'Presale Starts In:' :
                    presaleStatus === 'Active' ? 'Presale Ends In:' :
                        'Presale Ended'}
            </h3>
            {presaleStatus !== 'Ended' && (
                <div className="grid grid-cols-4 gap-4">
                    {Object.entries(timeLeft).map(([unit, value]) => (
                        <div key={unit} className="flex flex-col items-center">
                            <div className="bg-gray-700 w-full aspect-square rounded-lg flex items-center justify-center mb-2">
                                <span className="text-3xl font-bold text-green-400">
                                    {value.toString().padStart(2, '0')}
                                </span>
                            </div>
                            <span className="text-sm uppercase text-gray-400">{unit}</span>
                        </div>
                    ))}
                </div>
            )}
            <div className="mt-6 text-center">
                <span className="text-gray-400 font-semibold">Status: </span>
                <span className={`font-bold ${getStatusColor(presaleStatus)}`}>
                    {presaleStatus}
                </span>
            </div>
        </div>
    );
};

export default PresaleStatus;