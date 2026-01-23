import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { WalletConnectModal } from '@walletconnect/modal-react-native';
import { WalletProvider } from '@/context/WalletContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import "../global.css";

const projectId = "04cb5ebecafca5f304a457b06467b573";

const providerMetadata = {
    name: 'RDO Protocol',
    description: 'Objects That Say No',
    url: 'https://rdo.protocol',
    icons: ['https://avatars.githubusercontent.com/u/37784886'],
    redirect: {
        native: 'rdo://',
        universal: 'https://rdo.protocol.com'
    }
};

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <WalletProvider>
                <StatusBar style="light" />
                <Stack screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                    contentStyle: { backgroundColor: '#1a1a1a' }
                }}>
                    <Stack.Screen name="(tabs)" />
                </Stack>
                <WalletConnectModal
                    projectId={projectId}
                    providerMetadata={providerMetadata}
                />
            </WalletProvider>
        </SafeAreaProvider>
    );
}
