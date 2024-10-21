import React, { useState, useEffect } from 'react';
import { usePresaleContract } from '../hooks/usePresaleContract';

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
                if (process.env.NODE_ENV === 'development') {
                    console.log("Contract is not yet initialized. Waiting...");
                }
                return;
            }
            try {
                setIsLoading(true);
                if (process.env.NODE_ENV === 'development') {
                    console.log("Fetching presale info...");
                }
                const info = await getPresaleInfo();
                const status = await getPresaleStatus();

                if (process.env.NODE_ENV === 'development') {
                    console.log("Received presale info:", info);
                    console.log("Received presale status:", status);
                }

                if (info && info.startTime && info.endTime) {
                    setPresaleInfo({
                        startTime: info.startTime,
                        endTime: info.endTime
                    });
                    if (process.env.NODE_ENV === 'development') {
                        console.log("Set presale info:", { startTime: info.startTime, endTime: info.endTime });
                    }
                } else {
                    if (process.env.NODE_ENV === 'development') {
                        console.error("Invalid presale info received:", info);
                    }
                    setError("Failed to fetch presale times. Received invalid data.");
                }

                setPresaleStatus(status);
            } catch (error) {
                if (process.env.NODE_ENV === 'development') {
                    console.error("Failed to fetch presale info:", error);
                }
                setError(`Failed to fetch presale information: ${(error as Error).message}`);
            } finally {
                setIsLoading(false);
            }
        };

        if (isInitialized) {
            fetchPresaleInfo();
            const interval = setInterval(fetchPresaleInfo, 60000); // Refresh every minute
            return () => clearInterval(interval);
        }
    }, [getPresaleInfo, getPresaleStatus, isInitialized]);

    useEffect(() => {
        if (!presaleInfo) return;

        const timer = setInterval(() => {
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
                } else {
                    clearInterval(timer);
                    setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                    setPresaleStatus('Ended');
                    return;
                }
            }

            setTimeLeft({
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000)
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [presaleInfo, presaleStatus]);

    if (isLoading) return <div className="p-6 text-center">Loading presale information...</div>;
    if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
    if (!presaleInfo) return <div className="p-6 text-center">No presale information available.</div>;

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
                                <span className="text-3xl font-bold text-green-400">{value.toString().padStart(2, '0')}</span>
                            </div>
                            <span className="text-sm uppercase text-gray-400">{unit}</span>
                        </div>
                    ))}
                </div>
            )}
            <div className="mt-6 text-center">
                <span className="text-gray-400 font-semibold">Status: </span>
                <span className={`font-bold ${
                    presaleStatus === 'Active' ? 'text-green-500' :
                        presaleStatus === 'Not started' ? 'text-yellow-500' :
                            'text-red-500'
                }`}>
                    {presaleStatus}
                </span>
            </div>
        </div>
    );
}

export default PresaleStatus;