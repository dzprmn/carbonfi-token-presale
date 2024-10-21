// import { useState, useCallback, useEffect } from 'react';
// import { ethers, Contract } from 'ethers';
// import { useAccount, usePublicClient, useWalletClient, useChainId } from 'wagmi';
// import { switchNetwork } from 'wagmi/actions';
// import { bscTestnet } from 'wagmi/chains';
//
// import { CONTRACT_ABI } from '../constants/contractABI';
// import { CONTRACT_ADDRESS } from '../constants/contractConfig';
//
// interface PoolInfo {
//     owner: string;
//     startTime: bigint;
//     endTime: bigint;
//     tokenPrice: bigint;
//     softCap: bigint;
//     hardCap: bigint;
//     minContribution: bigint;
//     maxContribution: bigint;
//     token: string;
//     tokensDeposited: bigint;
// }
//
// export const useContractInteraction = () => {
//     const { address } = useAccount();
//     const publicClient = usePublicClient();
//     const { data: walletClient } = useWalletClient();
//     const chainId = useChainId();
//     const [contract, setContract] = useState<Contract | null>(null);
//     const [isContractReady, setIsContractReady] = useState(false);
//
//     const initializeContract = useCallback(() => {
//         if (publicClient) {
//             console.log("Initializing contract...");
//             try {
//                 const newContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, publicClient as any);
//                 setContract(newContract);
//                 setIsContractReady(true);
//                 console.log("Contract initialized successfully");
//             } catch (error) {
//                 console.error("Error initializing contract:", error);
//                 setIsContractReady(false);
//             }
//         } else {
//             console.log("PublicClient not available, contract not initialized");
//         }
//     }, [publicClient]);
//
//     useEffect(() => {
//         initializeContract();
//     }, [initializeContract]);
//
//     const ensureContractReady = useCallback(() => {
//         if (!isContractReady) {
//             console.log("Contract not ready, reinitializing...");
//             initializeContract();
//             if (!isContractReady) {
//                 throw new Error("Contract not initialized");
//             }
//         }
//     }, [isContractReady, initializeContract]);
//
//     const getPresaleInfo = useCallback(async (): Promise<PoolInfo> => {
//         ensureContractReady();
//         if (!contract) throw new Error("Contract not initialized");
//         console.log("Fetching presale info...");
//         try {
//             const info = await contract.poolInfo();
//             console.log("Raw presale info:", info);
//
//             // Check if info is null or undefined
//             if (!info) {
//                 console.error("Received null or undefined from poolInfo");
//                 throw new Error("Invalid poolInfo data received");
//             }
//
//             // Convert BigNumber values to bigint
//             const poolInfo: PoolInfo = {
//                 owner: info.owner,
//                 startTime: BigInt(info.startTime.toString()),
//                 endTime: BigInt(info.endTime.toString()),
//                 tokenPrice: BigInt(info.tokenPrice.toString()),
//                 softCap: BigInt(info.softCap.toString()),
//                 hardCap: BigInt(info.hardCap.toString()),
//                 minContribution: BigInt(info.minContribution.toString()),
//                 maxContribution: BigInt(info.maxContribution.toString()),
//                 token: info.token,
//                 tokensDeposited: BigInt(info.tokensDeposited.toString())
//             };
//
//             console.log("Processed pool info:", poolInfo);
//             return poolInfo;
//         } catch (error) {
//             console.error("Error fetching presale info:", error);
//             // Rethrow the error with more context
//             throw new Error(`Failed to fetch presale info: ${error.message}`);
//         }
//     }, [contract, ensureContractReady]);
//
//     const getTokensSold = useCallback(async (): Promise<string> => {
//         ensureContractReady();
//         if (!contract) throw new Error("Contract not initialized");
//         console.log("Fetching tokens sold...");
//         const sold = await contract.tokensSold();
//         console.log("Tokens sold fetched successfully");
//         return ethers.formatUnits(sold, 'ether');
//     }, [contract, ensureContractReady]);
//
//     const getPresaleStatus = useCallback(async (): Promise<string> => {
//         if (!contract) throw new Error("Contract not initialized");
//         const info = await contract.poolInfo();
//         const currentTime = Math.floor(Date.now() / 1000);
//         const finalized = await contract.finalized();
//
//         if (finalized) return "Ended";
//         if (currentTime < info.startTime) return "Not started";
//         if (currentTime > info.endTime) return "Ended";
//         return "Active";
//     }, [contract]);
//
//     const getSoftCapReached = useCallback(async (): Promise<boolean> => {
//         if (!contract) throw new Error("Contract not initialized");
//         return await contract.softCapReached();
//     }, [contract]);
//
//     const getTotalRaised = useCallback(async (): Promise<string> => {
//         if (!contract) throw new Error("Contract not initialized");
//         const totalRaised = await contract.totalRaised();
//         return ethers.formatUnits(totalRaised, 'ether');
//     }, [contract]);
//
//     const isCorrectNetwork = useCallback((): boolean => {
//         return chainId === CHAIN_ID;
//     }, [chainId]);
//
//     const switchToCorrectNetwork = useCallback(async (): Promise<boolean> => {
//         try {
//             await switchNetwork({ chainId: CHAIN_ID });
//             return true;
//         } catch (error) {
//             console.error("Failed to switch network:", error);
//             return false;
//         }
//     }, []);
//
//     const contribute = useCallback(async (amount: string): Promise<void> => {
//         if (!contract || !address || !walletClient) throw new Error("Contract not initialized or no account connected");
//         const tx = await walletClient.writeContract({
//             address: CONTRACT_ADDRESS,
//             abi: CONTRACT_ABI,
//             functionName: 'contribute',
//             value: ethers.parseEther(amount)
//         });
//         await publicClient.waitForTransactionReceipt({ hash: tx });
//     }, [contract, address, walletClient, publicClient]);
//
//     const getUserContribution = useCallback(async (userAddress: string): Promise<string> => {
//         if (!contract) throw new Error("Contract not initialized");
//         const contribution = await contract.contributions(userAddress);
//         return ethers.formatUnits(contribution, 'ether');
//     }, [contract]);
//
//     const claimTokens = useCallback(async (): Promise<void> => {
//         if (!contract || !address || !walletClient) throw new Error("Contract not initialized or no account connected");
//         const tx = await walletClient.writeContract({
//             address: CONTRACT_ADDRESS,
//             abi: CONTRACT_ABI,
//             functionName: 'claimTokens'
//         });
//         await publicClient.waitForTransactionReceipt({ hash: tx });
//     }, [contract, address, walletClient, publicClient]);
//
//     const withdrawContribution = useCallback(async (): Promise<void> => {
//         if (!contract || !address || !walletClient) throw new Error("Contract not initialized or no account connected");
//         const tx = await walletClient.writeContract({
//             address: CONTRACT_ADDRESS,
//             abi: CONTRACT_ABI,
//             functionName: 'withdraw'
//         });
//         await publicClient.waitForTransactionReceipt({ hash: tx });
//     }, [contract, address, walletClient, publicClient]);
//
//     const canClaimTokens = useCallback(async (userAddress: string): Promise<boolean> => {
//         if (!contract) throw new Error("Contract not initialized");
//         const contribution = await contract.contributions(userAddress);
//         const hasClaimed = await contract.hasWithdrawn(userAddress);
//         return contribution > 0 && !hasClaimed;
//     }, [contract]);
//
//     const canWithdraw = useCallback(async (userAddress: string): Promise<boolean> => {
//         if (!contract) throw new Error("Contract not initialized");
//         const contribution = await contract.contributions(userAddress);
//         return contribution > 0;
//     }, [contract]);
//
//     return {
//         getPresaleInfo,
//         getTokensSold,
//         getPresaleStatus,
//         getSoftCapReached,
//         getTotalRaised,
//         isCorrectNetwork,
//         switchToCorrectNetwork,
//         contribute,
//         getUserContribution,
//         claimTokens,
//         withdrawContribution,
//         canClaimTokens,
//         canWithdraw,
//         isContractReady
//     };
// };