'use client';

// Polyfill for SSR/Build
if (typeof window === 'undefined') {
    (global as any).localStorage = {
        getItem: () => null,
        setItem: () => { },
        removeItem: () => { },
    };
    (global as any).indexedDB = {
        open: () => ({ result: { createObjectStore: () => { } } }),
    };
}

import * as React from 'react';
import {
    RainbowKitProvider,
    getDefaultWallets,
    getDefaultConfig,
    darkTheme,
} from '@rainbow-me/rainbowkit';
import {
    argentWallet,
    trustWallet,
    ledgerWallet,
} from '@rainbow-me/rainbowkit/wallets';
import {
    sepolia,
    hardhat,
} from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';

const { wallets } = { wallets: [] }; // getDefaultWallets accesses window, so we skip it for now and let RainbowKit handle defaults internaly or mock it.
// Actually, let's just omit the extra wallets for now to be safe on SSR, or use a safer pattern.


const config = getDefaultConfig({
    appName: 'RDO - Objects That Say No',
    projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
    wallets: [
        /* ...wallets, */ // Removing explicit wallet spread for build safely
        {
            groupName: 'Other',
            wallets: [argentWallet, trustWallet, ledgerWallet],
        },
    ],
    chains: [
        sepolia,
        ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true' ? [hardhat] : []),
    ],
    ssr: true, // If true, it might still try to access storage. Let's try false if this persists, but true is recommended.
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider theme={darkTheme({
                    accentColor: '#e11d48', // Rose-600
                    borderRadius: 'large',
                    fontStack: 'system',
                    overlayBlur: 'small',
                })}>
                    {mounted && children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
