import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ABI } from '../constants/contractABI';
import { CONTRACT_ADDRESS } from '../constants/contractConfig';
import { logger } from '../utils/logger';

const RPC_URL = "https://bsc-testnet-rpc.publicnode.com";

declare global {
    interface Window {
        ethereum?: any;
    }
}

const DEEP_LINKS = {
    metamask: 'https://metamask.app.link/dapp/',
    trustwallet: 'https://link.trustwallet.com/open_url?url=',
};

export const usePresaleContract = () => {
    const [provider, setProvider] = useState<ethers.providers.JsonRpcProvider | null>(null);
    const [contract, setContract] = useState<ethers.Contract | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [walletConnected, setWalletConnected] = useState(false);
    const initializationAttempts = useRef(0);

    const isMobileBrowser = useCallback(() => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }, []);

    const getEthereumProvider = useCallback(() => {
        if (typeof window !== 'undefined' && window.ethereum) {
            return window.ethereum;
        }
        return null;
    }, []);

    const initializeContract = useCallback(async () => {
        logger.log("Initializing provider and contract...");
        try {
            let newProvider;
            const ethereumProvider = getEthereumProvider();

            if (ethereumProvider) {
                newProvider = new ethers.providers.Web3Provider(ethereumProvider);
                setWalletConnected(true);
            } else {
                newProvider = new ethers.providers.JsonRpcProvider(RPC_URL);
            }

            await newProvider.ready;
            setProvider(newProvider);

            const newContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, newProvider);
            setContract(newContract);

            setIsInitialized(true);
            logger.log("Provider and contract initialized successfully.");
        } catch (error) {
            logger.error("Error initializing contract:", error);
            initializationAttempts.current += 1;
            if (initializationAttempts.current < 3) {
                setTimeout(initializeContract, 1000);
            }
        }
    }, [getEthereumProvider]);

    const openWalletSelector = useCallback(() => {
        const currentUrl = window.location.href;
        return {
            metamask: () => window.open(DEEP_LINKS.metamask + currentUrl),
            trustwallet: () => window.open(DEEP_LINKS.trustwallet + currentUrl),
        };
    }, []);

    useEffect(() => {
        initializeContract();
    }, [initializeContract]);

    const getPresaleInfo = useCallback(async () => {
        if (!isInitialized) {
            logger.log("Contract is not yet initialized. Waiting...");
            return null;
        }
        if (!contract) {
            logger.error("Contract is not initialized");
            return null;
        }
        try {
            logger.log("Calling poolInfo on contract...");

            // First check if the contract method exists
            if (!contract.poolInfo) {
                throw new Error("poolInfo method not found on contract");
            }

            const poolInfo = await contract.poolInfo();
            logger.log("Raw poolInfo result:", poolInfo);

            // Validate that we received data
            if (!poolInfo) {
                throw new Error("No data received from poolInfo");
            }

            // Check if poolInfo is an array
            if (Array.isArray(poolInfo)) {
                // Validate array length
                if (poolInfo.length < 10) {
                    throw new Error("Incomplete pool information received");
                }

                return {
                    owner: poolInfo[0],
                    startTime: poolInfo[1]?.toString() || '0',
                    endTime: poolInfo[2]?.toString() || '0',
                    tokenPrice: ethers.utils.formatUnits(poolInfo[3] || '0', 'ether'),
                    softCap: ethers.utils.formatUnits(poolInfo[4] || '0', 'ether'),
                    hardCap: ethers.utils.formatUnits(poolInfo[5] || '0', 'ether'),
                    minContribution: ethers.utils.formatUnits(poolInfo[6] || '0', 'ether'),
                    maxContribution: ethers.utils.formatUnits(poolInfo[7] || '0', 'ether'),
                    token: poolInfo[8],
                    tokensDeposited: ethers.utils.formatUnits(poolInfo[9] || '0', 'ether')
                };
            }

            // If poolInfo is an object, validate required properties
            if (typeof poolInfo === 'object' && poolInfo !== null) {
                // Check for required properties
                const requiredProps = [
                    'owner', 'startTime', 'endTime', 'tokenPrice',
                    'softCap', 'hardCap', 'minContribution', 'maxContribution',
                    'token', 'tokensDeposited'
                ];

                const missingProps = requiredProps.filter(prop => !(prop in poolInfo));
                if (missingProps.length > 0) {
                    throw new Error(`Missing required properties: ${missingProps.join(', ')}`);
                }

                return {
                    owner: poolInfo.owner,
                    startTime: poolInfo.startTime?.toString() || '0',
                    endTime: poolInfo.endTime?.toString() || '0',
                    tokenPrice: ethers.utils.formatUnits(poolInfo.tokenPrice || '0', 'ether'),
                    softCap: ethers.utils.formatUnits(poolInfo.softCap || '0', 'ether'),
                    hardCap: ethers.utils.formatUnits(poolInfo.hardCap || '0', 'ether'),
                    minContribution: ethers.utils.formatUnits(poolInfo.minContribution || '0', 'ether'),
                    maxContribution: ethers.utils.formatUnits(poolInfo.maxContribution || '0', 'ether'),
                    token: poolInfo.token,
                    tokensDeposited: ethers.utils.formatUnits(poolInfo.tokensDeposited || '0', 'ether')
                };
            }

            throw new Error("Invalid pool information format received");
        } catch (error) {
            logger.error("Error in getPresaleInfo:", error);
            // Return null instead of throwing to allow graceful handling in UI
            return null;
        }
    }, [contract, isInitialized]);

    const getTokensSold = useCallback(async () => {
        if (!contract) return '0';
        try {
            const sold = await contract.tokensSold();
            return ethers.utils.formatUnits(sold, 'ether');
        } catch (error) {
            logger.error("Error in getTokensSold:", error);
            throw error;
        }
    }, [contract]);

    const getPresaleStatus = useCallback(async () => {
        if (!contract) return 'Unknown';
        try {
            const info = await contract.poolInfo();
            const currentTime = Math.floor(Date.now() / 1000);
            const finalized = await contract.finalized();

            if (finalized) return "Ended";
            if (currentTime < info.startTime.toNumber()) return "Not started";
            if (currentTime > info.endTime.toNumber()) return "Ended";
            return "Active";
        } catch (error) {
            logger.error("Error in getPresaleStatus:", error);
            throw error;
        }
    }, [contract]);

    const getSoftCapReached = useCallback(async () => {
        if (!contract) return false;
        try {
            return await contract.softCapReached();
        } catch (error) {
            logger.error("Error in getSoftCapReached:", error);
            throw error;
        }
    }, [contract]);

    const getTotalRaised = useCallback(async () => {
        if (!contract) return '0';
        try {
            const totalRaised = await contract.totalRaised();
            return ethers.utils.formatUnits(totalRaised, 'ether');
        } catch (error) {
            logger.error("Error in getTotalRaised:", error);
            throw error;
        }
    }, [contract]);

    const isCorrectNetwork = useCallback(async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const userProvider = new ethers.providers.Web3Provider(window.ethereum);
                const network = await userProvider.getNetwork();
                const correctNetwork = await provider?.getNetwork();
                return network.chainId === correctNetwork?.chainId;
            } catch (error) {
                logger.error("Error checking network:", error);
                return false;
            }
        }
        return false;
    }, [provider]);

    const switchToCorrectNetwork = useCallback(async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const correctNetwork = await provider?.getNetwork();
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: `0x${correctNetwork?.chainId.toString(16)}` }],
                });
                return true;
            } catch (error) {
                logger.error("Failed to switch network:", error);
                return false;
            }
        }
        return false;
    }, [provider]);

    const contribute = useCallback(async (amount: string) => {
        const ethereumProvider = getEthereumProvider();

        if (!ethereumProvider) {
            if (isMobileBrowser()) {
                return {
                    needsWallet: true,
                    walletSelector: openWalletSelector()
                };
            }
            throw new Error("No Ethereum wallet detected. Please install MetaMask or use a Web3-enabled browser.");
        }

        try {
            const userProvider = new ethers.providers.Web3Provider(ethereumProvider);
            await userProvider.send("eth_requestAccounts", []);

            const signer = await userProvider.getSigner();
            const address = await signer.getAddress();

            if (!address) {
                throw new Error("No account found. Please connect your wallet.");
            }

            // Check network and switch if needed
            if (!(await isCorrectNetwork())) {
                await switchToCorrectNetwork();
            }

            const contractWithSigner = contract?.connect(signer);
            if (!contractWithSigner) {
                throw new Error("Contract not initialized properly.");
            }

            const tx = await contractWithSigner.contribute({
                value: ethers.utils.parseEther(amount),
                gasLimit: 300000
            });
            await tx.wait();
            return { success: true };
        } catch (error) {
            logger.error("Error contributing:", error);
            throw error;
        }
    }, [contract, isCorrectNetwork, switchToCorrectNetwork, getEthereumProvider, isMobileBrowser, openWalletSelector]);

    const getUserContribution = useCallback(async (userAddress: string): Promise<string> => {
        if (!contract) throw new Error("Contract not initialized");
        try {
            const contribution = await contract.contributions(userAddress);
            return ethers.utils.formatEther(contribution);
        } catch (error) {
            logger.error("Error getting user contribution:", error);
            throw error;
        }
    }, [contract]);

    const canClaimTokens = useCallback(async (address: string): Promise<boolean> => {
        if (!contract) throw new Error("Contract not initialized");
        const contribution = await contract.contributions(address);
        const hasClaimed = await contract.hasWithdrawn(address);
        return contribution.gt(0) && !hasClaimed;
    }, [contract]);

    const canWithdraw = useCallback(async (address: string): Promise<boolean> => {
        if (!contract) throw new Error("Contract not initialized");
        const contribution = await contract.contributions(address);
        return contribution.gt(0);
    }, [contract]);

    const claimTokens = useCallback(async (): Promise<void> => {
        if (!contract) throw new Error("Contract not initialized");
        // @ts-ignore
        const signer = contract.connect(await provider.getSigner());
        const tx = await signer.claimTokens();
        await tx.wait();
    }, [contract, provider]);

    const withdrawContribution = useCallback(async (): Promise<void> => {
        if (!contract) throw new Error("Contract not initialized");
        // @ts-ignore
        const signer = contract.connect(await provider.getSigner());
        const tx = await signer.withdraw();
        await tx.wait();
    }, [contract, provider]);

    return {
        getPresaleInfo,
        getTokensSold,
        getPresaleStatus,
        getSoftCapReached,
        getTotalRaised,
        isCorrectNetwork,
        switchToCorrectNetwork,
        contribute,
        getUserContribution,
        isInitialized,
        canClaimTokens,
        canWithdraw,
        claimTokens,
        withdrawContribution,
        isMobileBrowser,
        openWalletSelector,
    };
};