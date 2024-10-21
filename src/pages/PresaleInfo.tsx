import React from 'react';
import { usePresaleContract } from '../hooks/usePresaleContract';

interface InfoItemProps {
    label: string;
    value: string | number;
    valueColor?: string;
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
    const [presaleInfo, setPresaleInfo] = React.useState<any>(null);
    const [tokensSold, setTokensSold] = React.useState<string>('0');
    const [softCapReached, setSoftCapReached] = React.useState<boolean>(false);
    const [totalRaised, setTotalRaised] = React.useState<string>('0');
    const [loading, setLoading] = React.useState<boolean>(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchData = async () => {
            if (!isInitialized) return;
            try {
                setLoading(true);
                const info = await getPresaleInfo();
                const sold = await getTokensSold();
                const softCap = await getSoftCapReached();
                const raised = await getTotalRaised();

                setPresaleInfo(info);
                setTokensSold(sold);
                setSoftCapReached(softCap);
                setTotalRaised(raised);
                setError(null);
            } catch (err) {
                setError((err as Error).message || 'An error occurred while fetching presale data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        // Set up an interval to refresh data every 5 minutes
        const interval = setInterval(fetchData, 300000);
        return () => clearInterval(interval);
    }, [getPresaleInfo, getTokensSold, getSoftCapReached, getTotalRaised, isInitialized]);

    if (!isInitialized) return <div className="p-6 text-center">Initializing contract...</div>;
    if (loading) return <div className="p-6 text-center">Loading presale information...</div>;
    if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
    if (!presaleInfo) return <div className="p-6 text-center">No presale information available.</div>;

    const calculateProgress = () => {
        return (parseFloat(tokensSold) / parseFloat(presaleInfo.hardCap)) * 100;
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-center text-green-400">Presale Information</h2>

            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-white font-semibold">Progress</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                    <div
                        className="bg-green-400 h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${calculateProgress()}%` }}
                    ></div>
                </div>
                <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-400">Soft Cap: {presaleInfo.softCap} CAFI</span>
                    <span className="text-gray-400">Hard Cap: {presaleInfo.hardCap} CAFI</span>
                </div>
            </div>

            <div className="space-y-4">
                <InfoItem label="Token Price" value={`1 BNB = ${1 / parseFloat(presaleInfo.tokenPrice)} CAFI`} />
                <InfoItem label="Total Raised" value={`${totalRaised} BNB`} />
                <InfoItem label="Tokens Sold" value={`${tokensSold} CAFI`} />
                <InfoItem
                    label="Soft Cap Reached"
                    value={softCapReached ? 'Yes' : 'No'}
                    valueColor={softCapReached ? 'text-green-400' : 'text-red-400'}
                />
                <InfoItem label="Min Contribution" value={`${presaleInfo.minContribution} BNB`} />
                <InfoItem label="Max Contribution" value={`${presaleInfo.maxContribution} BNB`} />
            </div>
        </div>
    );
};

export default PresaleInfo;