// import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
// import { useContractInteraction } from '../hooks/useContractInteraction';
// import { ethers } from 'ethers';
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
// interface PresaleData {
//     poolInfo: PoolInfo | null;
//     tokensSold: string;
//     softCapReached: boolean;
//     status: string;
//     totalRaised: string;
// }
//
// interface PresaleContextType {
//     presaleData: PresaleData | null;
//     loading: boolean;
//     error: string | null;
//     refreshData: () => Promise<void>;
// }
//
// const PresaleContext = createContext<PresaleContextType | undefined>(undefined);
//
// export function PresaleProvider({ children }: { children: React.ReactNode }) {
//     const [presaleData, setPresaleData] = useState<PresaleData | null>(null);
//     const [loading, setLoading] = useState<boolean>(true);
//     const [error, setError] = useState<string | null>(null);
//     const {
//         getPresaleInfo,
//         getTokensSold,
//         getSoftCapReached,
//         getPresaleStatus,
//         getTotalRaised,
//         isContractReady
//     } = useContractInteraction();
//
//     const fetchPresaleData = useCallback(async () => {
//         if (!isContractReady) {
//             console.log("Contract not ready, waiting...");
//             return;
//         }
//         setLoading(true);
//         setError(null);
//         try {
//             console.log("Fetching presale data...");
//             const [poolInfo, tokensSold, softCapReached, status, totalRaised] = await Promise.all([
//                 getPresaleInfo().catch(e => {
//                     console.error("Error fetching presale info:", e);
//                     return null;
//                 }),
//                 getTokensSold().catch(e => {
//                     console.error("Error fetching tokens sold:", e);
//                     return '0';
//                 }),
//                 getSoftCapReached().catch(e => {
//                     console.error("Error fetching soft cap reached:", e);
//                     return false;
//                 }),
//                 getPresaleStatus().catch(e => {
//                     console.error("Error fetching presale status:", e);
//                     return 'Unknown';
//                 }),
//                 getTotalRaised().catch(e => {
//                     console.error("Error fetching total raised:", e);
//                     return '0';
//                 })
//             ]);
//
//             setPresaleData({ poolInfo, tokensSold, softCapReached, status, totalRaised });
//             console.log("Presale data fetched successfully:", { poolInfo, tokensSold, softCapReached, status, totalRaised });
//         } catch (err) {
//             console.error("Error fetching presale data:", err);
//             setError(`Failed to fetch presale information: ${err.message}`);
//         } finally {
//             setLoading(false);
//         }
//     }, [isContractReady, getPresaleInfo, getTokensSold, getSoftCapReached, getPresaleStatus, getTotalRaised]);
//
//     useEffect(() => {
//         fetchPresaleData();
//         const interval = setInterval(fetchPresaleData, 300000); // Refresh every 5 minutes
//         return () => clearInterval(interval);
//     }, [fetchPresaleData]);
//
//     const contextValue = {
//         presaleData,
//         loading,
//         error,
//         refreshData: fetchPresaleData
//     };
//
//     return (
//         <PresaleContext.Provider value={contextValue}>
//             {children}
//         </PresaleContext.Provider>
//     );
// }
//
// // Helper function to format bigint values
// export const formatBigInt = (value: bigint, decimals: number = 18): string => {
//     return ethers.formatUnits(value, decimals);
// };
//
// export function usePresale(): PresaleContextType {
//     const context = useContext(PresaleContext);
//     if (context === undefined) {
//         throw new Error('usePresale must be used within a PresaleProvider');
//     }
//     return context;
// }