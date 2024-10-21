import React, { useState, useEffect } from 'react';
import { usePresaleContract } from '../hooks/usePresaleContract';
import { useAccount } from 'wagmi';

const ContributionStatus: React.FC = () => {
    const { address } = useAccount();
    const {
        getPresaleStatus,
        getSoftCapReached,
        canClaimTokens,
        canWithdraw,
        claimTokens,
        withdrawContribution,
        isInitialized
    } = usePresaleContract();

    const [actionLoading, setActionLoading] = useState<boolean>(false);
    const [actionError, setActionError] = useState<string>('');
    const [canWithdrawContribution, setCanWithdrawContribution] = useState<boolean>(false);
    const [canClaimUserTokens, setCanClaimUserTokens] = useState<boolean>(false);
    const [presaleStatus, setPresaleStatus] = useState<string>('');
    const [isSoftCapReached, setIsSoftCapReached] = useState<boolean>(false);

    useEffect(() => {
        if (isInitialized && address) {
            checkEligibility();
        }
    }, [isInitialized, address]);

    const checkEligibility = async () => {
        if (!address) return;

        try {
            const status = await getPresaleStatus();
            setPresaleStatus(status);

            if (status === "Ended") {
                const softCapReached = await getSoftCapReached();
                setIsSoftCapReached(softCapReached);

                if (softCapReached) {
                    const canClaim = await canClaimTokens(address);
                    setCanClaimUserTokens(canClaim);
                } else {
                    const canWithdrawFunds = await canWithdraw(address);
                    setCanWithdrawContribution(canWithdrawFunds);
                }
            }
        } catch (error) {
            console.error("Error checking eligibility:", error);
            setActionError("Error checking eligibility. Please try again.");
        }
    };

    const handleAction = async () => {
        if (!address) return;

        setActionLoading(true);
        setActionError('');
        try {
            if (isSoftCapReached) {
                if (!canClaimUserTokens) {
                    throw new Error("You are not eligible to claim tokens.");
                }
                await claimTokens();
                alert('Tokens claimed successfully!');
            } else {
                if (!canWithdrawContribution) {
                    throw new Error("You don't have any contributions to withdraw.");
                }
                await withdrawContribution();
                alert('Contribution withdrawn successfully!');
            }
            checkEligibility();
        } catch (error) {
            console.error("Error performing action:", error);
            setActionError((error as Error).message || "Failed to perform action. Please try again.");
        }
        setActionLoading(false);
    };

    if (presaleStatus !== "Ended") {
        return null;
    }

    const isEligible = isSoftCapReached ? canClaimUserTokens : canWithdrawContribution;

    return (
        <div className="p-6 bg-background-light rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center text-green-400">
                {isSoftCapReached ? "Claim Your Tokens" : "Withdraw Your Contribution"}
            </h2>
            <p className="text-gray-300 text-center mb-6">
                {isSoftCapReached
                    ? "The presale has ended and the soft cap was reached. Eligible participants can now claim their tokens."
                    : "The presale has ended and the soft cap was not reached. If you made a contribution, you can now withdraw it."}
            </p>
            {actionError && (
                <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-md mb-6" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{actionError}</span>
                </div>
            )}
            <div className="flex justify-center">
                <button
                    onClick={handleAction}
                    disabled={actionLoading || !isEligible}
                    className={`bg-green-500 text-white py-3 px-8 rounded-full hover:bg-green-600 transition-colors font-semibold text-lg ${
                        (actionLoading || !isEligible)
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                    }`}
                >
                    {actionLoading ? 'Processing...' : isSoftCapReached ? 'Claim Tokens' : 'Withdraw Contribution'}
                </button>
            </div>
            {!isEligible && (
                <p className="text-yellow-400 text-center mt-4">
                    {isSoftCapReached
                        ? "You are not eligible to claim tokens. You may have already claimed or did not participate in the presale."
                        : "You don't have any contributions to withdraw."}
                </p>
            )}
        </div>
    );
};

export default ContributionStatus;