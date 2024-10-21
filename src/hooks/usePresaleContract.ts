import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ABI } from '../constants/contractABI';
import { CONTRACT_ADDRESS } from '../constants/contractConfig';

const RPC_URL = "https://bsc-testnet-rpc.publicnode.com"; // BSC Testnet RPC URL

export const usePresaleContract = () => {
    const [provider, setProvider] = useState<ethers.providers.JsonRpcProvider | null>(null);
    const [contract, setContract] = useState<ethers.Contract | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const initializationAttempts = useRef(0);

    const initializeContract = useCallback(async () => {
        console.log("Initializing provider and contract...");
        try {
            const newProvider = new ethers.providers.JsonRpcProvider(RPC_URL);
            await newProvider.ready;
            setProvider(newProvider);

            const newContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, newProvider);
            setContract(newContract);

            setIsInitialized(true);
            console.log("Provider and contract initialized successfully.");
        } catch (error) {
            console.error("Error initializing contract:", error);
            initializationAttempts.current += 1;
            if (initializationAttempts.current < 3) {
                console.log(`Retrying initialization (Attempt ${initializationAttempts.current + 1})...`);
                setTimeout(initializeContract, 1000); // Retry after 1 second
            } else {
                console.error("Failed to initialize contract after 3 attempts.");
            }
        }
    }, []);

    useEffect(() => {
        initializeContract();
    }, [initializeContract]);

    const getPresaleInfo = useCallback(async () => {
        if (!isInitialized) {
            console.log("Contract is not yet initialized. Waiting...");
            return null;
        }
        if (!contract) {
            console.error("Contract is not initialized");
            return null;
        }
        try {
            console.log("Calling poolInfo on contract...");
            const poolInfo = await contract.poolInfo();
            console.log("Raw poolInfo result:", poolInfo);

            // Check if poolInfo is an array (for contracts that return poolInfo as separate values)
            if (Array.isArray(poolInfo)) {
                return {
                    owner: poolInfo[0],
                    startTime: poolInfo[1].toString(),
                    endTime: poolInfo[2].toString(),
                    tokenPrice: ethers.utils.formatUnits(poolInfo[3], 'ether'),
                    softCap: ethers.utils.formatUnits(poolInfo[4], 'ether'),
                    hardCap: ethers.utils.formatUnits(poolInfo[5], 'ether'),
                    minContribution: ethers.utils.formatUnits(poolInfo[6], 'ether'),
                    maxContribution: ethers.utils.formatUnits(poolInfo[7], 'ether'),
                    token: poolInfo[8],
                    tokensDeposited: ethers.utils.formatUnits(poolInfo[9], 'ether')
                };
            }

            // If poolInfo is an object, return it directly
            return {
                owner: poolInfo.owner,
                startTime: poolInfo.startTime.toString(),
                endTime: poolInfo.endTime.toString(),
                tokenPrice: ethers.utils.formatUnits(poolInfo.tokenPrice, 'ether'),
                softCap: ethers.utils.formatUnits(poolInfo.softCap, 'ether'),
                hardCap: ethers.utils.formatUnits(poolInfo.hardCap, 'ether'),
                minContribution: ethers.utils.formatUnits(poolInfo.minContribution, 'ether'),
                maxContribution: ethers.utils.formatUnits(poolInfo.maxContribution, 'ether'),
                token: poolInfo.token,
                tokensDeposited: ethers.utils.formatUnits(poolInfo.tokensDeposited, 'ether')
            };
        } catch (error) {
            console.error("Error in getPresaleInfo:", error);
            throw error;
        }
    }, [contract, isInitialized]);

    const getTokensSold = useCallback(async () => {
        if (!contract) return '0';
        try {
            const sold = await contract.tokensSold();
            return ethers.utils.formatUnits(sold, 'ether');
        } catch (error) {
            console.error("Error in getTokensSold:", error);
            throw error;
        }
    }, [contract]);

    const getPresaleStatus = useCallback(async () => {
        if (!contract) return 'Unknown';
        try {
            const info = await contract.poolInfo();
            const currentTime = Math.floor(Date.now() / 1000);
            const finalized = await contract.finalized();

            if (finalized) {
                return "Ended";
            } else if (currentTime < info.startTime.toNumber()) {
                return "Not started";
            } else if (currentTime > info.endTime.toNumber()) {
                return "Ended";
            } else {
                return "Active";
            }
        } catch (error) {
            console.error("Error in getPresaleStatus:", error);
            throw error;
        }
    }, [contract]);

    const getSoftCapReached = useCallback(async () => {
        if (!contract) return false;
        try {
            return await contract.softCapReached();
        } catch (error) {
            console.error("Error in getSoftCapReached:", error);
            throw error;
        }
    }, [contract]);

    const getTotalRaised = useCallback(async () => {
        if (!contract) return '0';
        try {
            const totalRaised = await contract.totalRaised();
            return ethers.utils.formatUnits(totalRaised, 'ether');
        } catch (error) {
            console.error("Error in getTotalRaised:", error);
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
                console.error("Error checking network:", error);
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
                console.error("Failed to switch network:", error);
                return false;
            }
        }
        return false;
    }, [provider]);

    const contribute = useCallback(async (amount: string) => {
        if (!(await isCorrectNetwork())) {
            throw new Error("Please switch to the correct network to contribute");
        }

        if (typeof window.ethereum !== 'undefined') {
            try {
                const userProvider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = await userProvider.getSigner();
                const contractWithSigner = contract?.connect(signer);

                if (contractWithSigner) {
                    const tx = await contractWithSigner.contribute({ value: ethers.utils.parseEther(amount) });
                    await tx.wait();
                    return true;
                }
            } catch (error) {
                console.error("Error contributing:", error);
                throw error;
            }
        } else {
            throw new Error("Ethereum object not found, install MetaMask.");
        }
    }, [contract, isCorrectNetwork]);

    const getUserContribution = useCallback(async (userAddress: string): Promise<string> => {
        if (!contract) throw new Error("Contract not initialized");
        try {
            const contribution = await contract.contributions(userAddress);
            return ethers.utils.formatEther(contribution);
        } catch (error) {
            console.error("Error getting user contribution:", error);
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

    // Implement other functions (claimTokens, withdrawContribution, etc.) similarly...

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
        // Include other functions here...
    };
};