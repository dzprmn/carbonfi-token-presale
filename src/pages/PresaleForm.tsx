import React, { useState, useEffect } from 'react';
import { usePresaleContract } from '../hooks/usePresaleContract';
import { useAccount } from 'wagmi';

interface InfoItemProps {
    label: string;
    value: string;
}

const InfoItem: React.FC<InfoItemProps> = ({ label, value }) => {
    return (
        <div className="flex justify-between items-center">
            <span className="text-gray-400">{label}:</span>
            <span className="text-white font-semibold">{value}</span>
        </div>
    );
};

const PresaleForm: React.FC = () => {
    const { address } = useAccount();
    const {
        getPresaleInfo,
        getPresaleStatus,
        getTokensSold,
        isCorrectNetwork,
        switchToCorrectNetwork,
        getUserContribution,
        contribute,
        isInitialized,
        isMobileBrowser,
        openWalletSelector  // Add this to the destructured values
    } = usePresaleContract();

    const [bnbAmount, setBnbAmount] = useState<string>('');
    const [cafiAmount, setCafiAmount] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [presaleInfo, setPresaleInfo] = useState<any>(null);
    const [presaleStatus, setPresaleStatus] = useState<string>('');
    const [tokensSold, setTokensSold] = useState<string>('0');
    const [userContribution, setUserContribution] = useState<string>('0');
    const [userTokenAllocation, setUserTokenAllocation] = useState<string>('0');
    const [showWalletOptions, setShowWalletOptions] = useState(false);

    useEffect(() => {
        if (isInitialized) {
            fetchPresaleInfo();
            const interval = setInterval(fetchPresaleInfo, 300000); // Refresh every 30 seconds
            return () => clearInterval(interval);
        }
    }, [isInitialized]);

    useEffect(() => {
        if (address && isInitialized) {
            fetchUserContribution();
        }
    }, [address, isInitialized]);

    useEffect(() => {
        if (presaleInfo && userContribution) {
            const tokenAllocation = parseFloat(userContribution) / parseFloat(presaleInfo.tokenPrice);
            setUserTokenAllocation(tokenAllocation.toFixed(2));
        }
    }, [presaleInfo, userContribution]);

    const fetchPresaleInfo = async () => {
        try {
            const [info, status, sold] = await Promise.all([
                getPresaleInfo(),
                getPresaleStatus(),
                getTokensSold()
            ]);
            setPresaleInfo(info);
            setPresaleStatus(status);
            setTokensSold(sold);
        } catch (error) {
            console.error("Error fetching presale info:", error);
            setError("Failed to fetch presale information. Please try again later.");
        }
    };

    const fetchUserContribution = async () => {
        if (address && isInitialized) {
            try {
                const contribution = await getUserContribution(address);
                setUserContribution(contribution);
            } catch (error) {
                console.error("Error fetching user contribution:", error);
                // Optionally set an error state here if you want to display it to the user
            }
        }
    };

    useEffect(() => {
        if (address && isInitialized) {
            fetchUserContribution();
        }
    }, [address, isInitialized]);

    const handleBnbAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setBnbAmount(value);
        if (presaleInfo && value !== '') {
            const tokens = parseFloat(value) / parseFloat(presaleInfo.tokenPrice);
            setCafiAmount(tokens.toFixed(2));
        } else {
            setCafiAmount('');
        }
    };

    const handleCafiAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCafiAmount(value);
        if (presaleInfo && value !== '') {
            const bnb = parseFloat(value) * parseFloat(presaleInfo.tokenPrice);
            setBnbAmount(bnb.toFixed(8));
        } else {
            setBnbAmount('');
        }
    };

    const handleContribute = async () => {
        setLoading(true);
        setError('');
        try {
            if (!bnbAmount || isNaN(parseFloat(bnbAmount))) {
                throw new Error("Please enter a valid BNB amount.");
            }

            const result = await contribute(bnbAmount);

            if (result?.needsWallet) {
                setShowWalletOptions(true);
                return;
            }

            if (result?.success) {
                alert('Contribution successful!');
                setBnbAmount('');
                setCafiAmount('');
                await fetchPresaleInfo();
                await fetchUserContribution();
            }
        } catch (error) {
            console.error("Error contributing:", error);
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError("An unexpected error occurred. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const isHardCapReached = parseFloat(tokensSold) >= parseFloat(presaleInfo?.hardCap || '0');

    if (!isInitialized) return <div className="p-6 text-center">Initializing contract...</div>;

    const WalletOptions = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-80">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Connect Wallet</h3>
                <div className="space-y-3">
                    <button
                        onClick={() => {
                            const walletSelector = openWalletSelector();
                            walletSelector.metamask();
                            setShowWalletOptions(false);
                        }}
                        className="w-full py-2 px-4 rounded bg-orange-500 text-white hover:bg-orange-600"
                    >
                        MetaMask
                    </button>
                    <button
                        onClick={() => {
                            const walletSelector = openWalletSelector();
                            walletSelector.trustwallet();
                            setShowWalletOptions(false);
                        }}
                        className="w-full py-2 px-4 rounded bg-blue-500 text-white hover:bg-blue-600"
                    >
                        Trust Wallet
                    </button>
                </div>
                <button
                    onClick={() => setShowWalletOptions(false)}
                    className="mt-4 w-full py-2 px-4 rounded bg-gray-300 text-gray-700 hover:bg-gray-400"
                >
                    Cancel
                </button>
            </div>
        </div>
    );

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-center text-green-400">Contribute to Presale</h2>
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            <div className="mb-4">
                <label htmlFor="bnb-amount" className="block text-sm font-medium text-gray-400 mb-1">BNB Amount</label>
                <div className="flex items-center bg-gray-700 rounded-md p-2">
                    <input
                        id="bnb-amount"
                        type="number"
                        value={bnbAmount}
                        onChange={handleBnbAmountChange}
                        className="bg-transparent text-white text-lg w-full focus:outline-none"
                        placeholder="0.00"
                        disabled={isHardCapReached}
                    />
                    <span className="text-white ml-2">BNB</span>
                </div>
            </div>

            <div className="mb-6">
                <label htmlFor="cafi-amount" className="block text-sm font-medium text-gray-400 mb-1">CAFI Amount</label>
                <div className="flex items-center bg-gray-700 rounded-md p-2">
                    <input
                        id="cafi-amount"
                        type="number"
                        value={cafiAmount}
                        onChange={handleCafiAmountChange}
                        className="bg-transparent text-white text-lg w-full focus:outline-none"
                        placeholder="0.00"
                        disabled={isHardCapReached}
                    />
                    <span className="text-white ml-2">CAFI</span>
                </div>
            </div>

            <button
                onClick={handleContribute}
                disabled={loading || !bnbAmount || presaleStatus !== "Active" || isHardCapReached}
                className={`w-full bg-green-500 text-white py-3 px-6 rounded-md hover:bg-green-600 transition-colors font-semibold text-lg mb-4 ${
                    (loading || !bnbAmount || presaleStatus !== "Active" || isHardCapReached)
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                }`}
            >
                {isHardCapReached ? 'Hard Cap Reached' : loading ? 'Processing...' : 'Contribute'}
            </button>

            <div className="flex justify-between items-center mb-6">
                <span className="text-gray-400">Tokens you will receive:</span>
                <span className="text-white font-semibold">{userTokenAllocation} CAFI</span>
            </div>

            {presaleInfo && (
                <div className="mt-auto space-y-3 text-sm">
                    <InfoItem label="Token Price" value={`1 BNB = ${1 / parseFloat(presaleInfo.tokenPrice)} CAFI`} />
                    <InfoItem label="Min Contribution" value={`${presaleInfo.minContribution} BNB`} />
                    <InfoItem label="Max Contribution" value={`${presaleInfo.maxContribution} BNB`} />
                    <InfoItem label="Tokens Sold" value={`${tokensSold} / ${presaleInfo.hardCap} CAFI`} />
                </div>
            )}
            {showWalletOptions && <WalletOptions />}
        </div>
    );
};

export default PresaleForm;