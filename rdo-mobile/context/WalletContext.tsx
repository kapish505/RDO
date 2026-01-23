import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWalletConnectModal } from "@walletconnect/modal-react-native";
import { AppState } from "react-native";
import { SEPOLIA_CONFIG } from "@/constants/contract";

type WalletContextType = {
    address: string | null;
    balance: string;
    isConnected: boolean;
    isConnecting: boolean;
    connectWallet: () => Promise<void>;
    disconnectWallet: () => Promise<void>;
    provider: any | null;
    getSigner: () => any | null;
};

const WalletContext = createContext<WalletContextType>({
    address: null,
    balance: "0",
    isConnected: false,
    isConnecting: false,
    connectWallet: async () => { },
    disconnectWallet: async () => { },
    provider: null,
    getSigner: () => null,
});

export const useWallet = () => useContext(WalletContext);

const PROJECT_ID = "04cb5ebecafca5f304a457b06467b573";

export function WalletProvider({ children }: { children: React.ReactNode }) {
    const { open, isConnected, address, provider } = useWalletConnectModal();
    const [balance, setBalance] = useState("0");
    const [isConnecting, setIsConnecting] = useState(false);

    const updateBalance = async (walletAddress: string) => {
        try {
            const ethProvider = new ethers.providers.JsonRpcProvider(SEPOLIA_CONFIG.rpcUrl);
            const balWei = await ethProvider.getBalance(walletAddress);
            const balEth = ethers.utils.formatEther(balWei);
            setBalance(parseFloat(balEth).toFixed(4));
        } catch (error) {
            console.error("Failed to fetch balance:", error);
            setBalance("0");
        }
    };

    const connectWallet = async () => {
        setIsConnecting(true);
        await open();
        setIsConnecting(false);
    };

    const disconnectWallet = async () => {
        if (provider?.disconnect) await provider.disconnect();
        setBalance("0");
    };

    const getSigner = () => {
        if (provider) return new ethers.providers.Web3Provider(provider).getSigner();
        return null;
    };

    useEffect(() => {
        if (isConnected && address) updateBalance(address);
    }, [isConnected, address]);

    return (
        <WalletContext.Provider value={{ address: address || null, balance, isConnected, isConnecting, connectWallet, disconnectWallet, provider, getSigner }}>
            {children}
        </WalletContext.Provider>
    );
}
