import React from 'react';
import { usePresaleContract } from '../hooks/usePresaleContract';
import { logger } from '../utils/logger';

interface InfoItemProps {
    label: string;
    value: string | number;
    valueColor?: string;
}

interface PresaleInfoData {
    softCap: string;
    hardCap: string;
    tokenPrice: string;
    minContribution: string;
    maxContribution: string;
}

const InfoItem: React.FC<InfoItemProps> = ({ label, value, valueColor = 'text-white' }) => {
    return (
        <div className="flex justify-between items-center">
            <span className="text-gray-400">{label}:</span>
            <span className={`font-semibold ${valueColor}`}>{value}</span>
        </div>
    );
};

const PresaleInfo: React.FC = () => {
    const { getPresaleInfo, getTokensSold, getSoftCapReached, getTotalRaised, isInitialized } = usePresaleContract();
    const [presaleInfo, setPresaleInfo] = React.useState<PresaleInfoData | null>(null);
    const [tokensSold, setTokensSold] = React.useState<string>('0');
    const [softCapReached, setSoftCapReached] = React.useState<boolean>(false);
    const [totalRaised, setTotalRaised] = React.useState<string>('0');
    const [loading, setLoading] = React.useState<boolean>(true);
    const [error, setError] = React.useState<string | null>(null);
    const [retryCount, setRetryCount] = React.useState<number>(0);

    React.useEffect(() => {
        const fetchData = async () => {
            if (!isInitialized) {
                logger.log("Contract not yet initialized, skipping fetch");
                return;
            }

            try {
                setLoading(true);
                logger.log("Fetching presale data...");

                const [info, sold, softCap, raised] = await Promise.all([
                    getPresaleInfo(),
                    getTokensSold(),
                    getSoftCapReached(),
                    getTotalRaised()
                ]);

                if (!info) {
                    throw new Error("Failed to fetch presale information");
                }

                logger.log("Presale data received:", {
                    tokensSold: sold,
                    softCapReached: softCap,
                    totalRaised: raised
                });

                setPresaleInfo(info);
                setTokensSold(sold);
                setSoftCapReached(softCap);
                setTotalRaised(raised);
                setError(null);
                setRetryCount(0); // Reset retry count on successful fetch

            } catch (err) {
                logger.error("Error fetching presale data:", err);
                setError("Unable to load presale information. Please try again.");

                // Implement retry logic
                if (retryCount < 3) {
                    const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff
                    setTimeout(() => {
                        setRetryCount(prev => prev + 1);
                        fetchData();
                    }, retryDelay);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        // Set up an interval to refresh data
        const interval = setInterval(fetchData, 300000); // 5 minutes
        return () => clearInterval(interval);
    }, [getPresaleInfo, getTokensSold, getSoftCapReached, getTotalRaised, isInitialized, retryCount]);

    const calculateProgress = React.useCallback((): number => {
        try {
            if (!presaleInfo?.hardCap || !tokensSold) return 0;
            const progress = (parseFloat(tokensSold) / parseFloat(presaleInfo.hardCap)) * 100;
            return Math.min(progress, 100); // Ensure progress doesn't exceed 100%
        } catch (error) {
            logger.error("Error calculating progress:", error);
            return 0;
        }
    }, [presaleInfo, tokensSold]);

    if (!isInitialized) {
        return <div className="p-6 text-center">Initializing presale information...</div>;
    }

    if (loading && !presaleInfo) {
        return <div className="p-6 text-center">Loading presale information...</div>;
    }

    if (error) {
        return (
            <div className="p-6 text-center">
                <div className="text-red-500 mb-4">{error}</div>
                <button
                    onClick={() => setRetryCount(0)} // This will trigger a new fetch
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!presaleInfo) {
        return <div className="p-6 text-center">No presale information available.</div>;
    }

    const progress = calculateProgress();

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-center text-green-400">Presale Information</h2>

            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-white font-semibold">Progress</span>
                    <span className="text-white">{progress.toFixed(2)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                    <div
                        className="bg-green-400 h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-400">Soft Cap: {presaleInfo.softCap} CAFI</span>
                    <span className="text-gray-400">Hard Cap: {presaleInfo.hardCap} CAFI</span>
                </div>
            </div>

            <div className="space-y-4">
                <InfoItem
                    label="Token Price"
                    value={`1 BNB = ${(1 / parseFloat(presaleInfo.tokenPrice)).toLocaleString()} CAFI`}
                />
                <InfoItem
                    label="Total Raised"
                    value={`${parseFloat(totalRaised).toLocaleString()} BNB`}
                />
                <InfoItem
                    label="Tokens Sold"
                    value={`${parseFloat(tokensSold).toLocaleString()} CAFI`}
                />
                <InfoItem
                    label="Soft Cap Reached"
                    value={softCapReached ? 'Yes' : 'No'}
                    valueColor={softCapReached ? 'text-green-400' : 'text-red-400'}
                />
                <InfoItem
                    label="Min Contribution"
                    value={`${presaleInfo.minContribution} BNB`}
                />
                <InfoItem
                    label="Max Contribution"
                    value={`${presaleInfo.maxContribution} BNB`}
                />
            </div>
        </div>
    );
};

export default PresaleInfo;