import React, { useState, useEffect } from 'react';
import { usePresaleContract } from '../hooks/usePresaleContract';
import { useAccount } from 'wagmi';
import { logger } from '../utils/logger';

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
    const [isCheckingEligibility, setIsCheckingEligibility] = useState<boolean>(false);

    useEffect(() => {
        if (isInitialized && address) {
            checkEligibility();
        }
    }, [isInitialized, address]);

    const checkEligibility = async () => {
        if (!address) {
            logger.log("No address available, skipping eligibility check");
            return;
        }

        setIsCheckingEligibility(true);
        try {
            logger.log("Checking eligibility for address:", address);

            // Fetch presale status
            const status = await getPresaleStatus();
            setPresaleStatus(status);
            logger.log("Current presale status:", status);

            if (status === "Ended") {
                // Check if soft cap is reached
                const softCapReached = await getSoftCapReached();
                setIsSoftCapReached(softCapReached);
                logger.log("Soft cap reached:", softCapReached);

                if (softCapReached) {
                    // Check if user can claim tokens
                    const canClaim = await canClaimTokens(address);
                    setCanClaimUserTokens(canClaim);
                    logger.log("Can claim tokens:", canClaim);
                } else {
                    // Check if user can withdraw contribution
                    const canWithdrawFunds = await canWithdraw(address);
                    setCanWithdrawContribution(canWithdrawFunds);
                    logger.log("Can withdraw contribution:", canWithdrawFunds);
                }
            }
        } catch (error) {
            logger.error("Error checking eligibility:", error);
            setActionError("Unable to check eligibility. Please try again later.");
        } finally {
            setIsCheckingEligibility(false);
        }
    };

    const handleAction = async () => {
        if (!address) {
            logger.error("No address available for action");
            setActionError("Please connect your wallet first.");
            return;
        }

        setActionLoading(true);
        setActionError('');

        try {
            logger.log("Initiating action for address:", address);
            logger.log("Soft cap reached:", isSoftCapReached);

            if (isSoftCapReached) {
                if (!canClaimUserTokens) {
                    throw new Error("You are not eligible to claim tokens.");
                }
                logger.log("Attempting to claim tokens");
                await claimTokens();
                alert('Tokens claimed successfully!');
            } else {
                if (!canWithdrawContribution) {
                    throw new Error("You don't have any contributions to withdraw.");
                }
                logger.log("Attempting to withdraw contribution");
                await withdrawContribution();
                alert('Contribution withdrawn successfully!');
            }

            // Refresh eligibility after successful action
            await checkEligibility();
        } catch (error) {
            logger.error("Error performing action:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to perform action. Please try again.";
            setActionError(errorMessage);
        } finally {
            setActionLoading(false);
        }
    };

    // If presale hasn't ended, don't show this component
    if (presaleStatus !== "Ended") {
        return null;
    }

    const isEligible = isSoftCapReached ? canClaimUserTokens : canWithdrawContribution;

    if (isCheckingEligibility) {
        return (
            <div className="p-6 bg-background-light rounded-lg shadow-lg">
                <div className="text-center text-gray-300">
                    Checking eligibility...
                </div>
            </div>
        );
    }

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
                    className={`bg-green-500 text-white py-3 px-8 rounded-full hover:bg-green-600 transition-colors font-semibold text-lg 
                        ${(actionLoading || !isEligible) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {actionLoading
                        ? 'Processing...'
                        : isSoftCapReached
                            ? 'Claim Tokens'
                            : 'Withdraw Contribution'}
                </button>
            </div>

            {!isEligible && (
                <p className="text-yellow-400 text-center mt-4">
                    {isSoftCapReached
                        ? "You are not eligible to claim tokens. You may have already claimed or did not participate in the presale."
                        : "You don't have any contributions to withdraw."}
                </p>
            )}

            {/* Add retry button for error cases */}
            {actionError && (
                <div className="text-center mt-4">
                    <button
                        onClick={checkEligibility}
                        className="text-primary hover:text-primary-dark underline"
                    >
                        Check eligibility again
                    </button>
                </div>
            )}
        </div>
    );
};

export default ContributionStatus;