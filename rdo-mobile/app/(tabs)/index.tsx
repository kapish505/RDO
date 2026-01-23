import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWallet } from '@/context/WalletContext';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';

export default function HomeScreen() {
    const { isConnected, address, balance, connectWallet, disconnectWallet, isConnecting } = useWallet();

    const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>RDO Protocol</Text>
                        <Text style={styles.subtitle}>Objects That Say No</Text>
                    </View>
                    <TouchableOpacity
                        onPress={isConnected ? disconnectWallet : connectWallet}
                        style={[styles.walletButton, isConnected && styles.walletButtonConnected]}
                        disabled={isConnecting}
                    >
                        <Text style={styles.walletButtonText}>
                            {isConnecting ? "Connecting..." : isConnected ? shortenAddress(address!) : "Connect Wallet"}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Hero Card */}
                <View style={styles.heroCard}>
                    <Text style={styles.heroLabel}>Your Balance</Text>
                    <Text style={styles.heroBalance}>{balance} ETH</Text>
                    <View style={styles.networkBadge}>
                        <Text style={styles.networkText}>Sepolia Testnet</Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionsRow}>
                    <Link href="/create" asChild>
                        <TouchableOpacity style={styles.actionCard}>
                            <Ionicons name="lock-closed" size={28} color="#e11d48" />
                            <Text style={styles.actionText}>New RDO</Text>
                        </TouchableOpacity>
                    </Link>
                    <TouchableOpacity style={styles.actionCard}>
                        <Ionicons name="qr-code" size={28} color="#e11d48" />
                        <Text style={styles.actionText}>Scan QR</Text>
                    </TouchableOpacity>
                </View>

                {/* Info Section */}
                <View style={styles.infoCard}>
                    <Ionicons name="information-circle" size={24} color="#666" />
                    <Text style={styles.infoText}>
                        Create self-destructing messages, protect your content with on-chain rules, and share via QR codes.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
    },
    subtitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        marginTop: 2,
    },
    walletButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    walletButtonConnected: {
        backgroundColor: '#e11d48',
    },
    walletButtonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 12,
    },
    heroCard: {
        backgroundColor: '#e11d48',
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
    },
    heroLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginBottom: 4,
    },
    heroBalance: {
        color: '#fff',
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    networkBadge: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    networkText: {
        color: '#fff',
        fontSize: 12,
        fontFamily: 'monospace',
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    actionCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        gap: 12,
    },
    actionText: {
        color: '#fff',
        fontWeight: '600',
    },
    infoCard: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    infoText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 13,
        flex: 1,
        lineHeight: 20,
    },
});
