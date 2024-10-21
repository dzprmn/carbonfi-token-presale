import { bscTestnet } from 'wagmi/chains';

export const CONTRACT_ADDRESS = "0xC28C770B328A49456f77B76B6aF075F3669C52C4";
export const CHAIN_ID = bscTestnet.id;
export const RPC_URL = bscTestnet.rpcUrls.default.http[0];