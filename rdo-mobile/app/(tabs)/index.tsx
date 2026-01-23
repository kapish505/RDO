import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWallet } from '@/context/WalletContext';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
    const { isConnected, address, balance, connectWallet, disconnectWallet, isConnecting } = useWallet();

    const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                {/* Premium Header */}
                <View style={styles.header}>
                    <View>
                        <View style={styles.logoRow}>
                            <Text style={styles.logoEmoji}>🔐</Text>
                            <Text style={styles.title}>RDO Protocol</Text>
                        </View>
                        <Text style={styles.subtitle}>Objects That Say No</Text>
                    </View>
                    <TouchableOpacity
                        onPress={isConnected ? disconnectWallet : connectWallet}
                        style={[styles.walletButton, isConnected && styles.walletButtonConnected]}
                        disabled={isConnecting}
                    >
                        {isConnecting ? (
                            <Text style={styles.walletButtonText}>Connecting...</Text>
                        ) : isConnected ? (
                            <View style={styles.connectedRow}>
                                <View style={styles.statusDot} />
                                <Text style={[styles.walletButtonText, styles.connectedText]}>{shortenAddress(address!)}</Text>
                            </View>
                        ) : (
                            <Text style={styles.walletButtonText}>Connect</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Hero Card with Gradient */}
                <View style={styles.heroWrapper}>
                    <LinearGradient
                        colors={['#e11d48', '#be123c', '#9f1239']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.heroCard}
                    >
                        <View style={styles.heroContent}>
                            <Text style={styles.heroLabel}>Your Balance</Text>
                            <Text style={styles.heroBalance}>{balance} ETH</Text>
                        </View>
                        <View style={styles.networkBadge}>
                            <View style={styles.networkDot} />
                            <Text style={styles.networkText}>Sepolia Testnet</Text>
                        </View>
                    </LinearGradient>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>0</Text>
                        <Text style={styles.statLabel}>RDOs Created</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>0</Text>
                        <Text style={styles.statLabel}>Total Views</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>0</Text>
                        <Text style={styles.statLabel}>Violations</Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionsRow}>
                    <Link href="/create" asChild>
                        <TouchableOpacity style={styles.actionCard}>
                            <View style={styles.actionIconWrapper}>
                                <Ionicons name="lock-closed" size={24} color="#e11d48" />
                            </View>
                            <Text style={styles.actionText}>Create RDO</Text>
                            <Text style={styles.actionSubtext}>New secret object</Text>
                        </TouchableOpacity>
                    </Link>
                    <TouchableOpacity style={styles.actionCard}>
                        <View style={styles.actionIconWrapper}>
                            <Ionicons name="qr-code" size={24} color="#e11d48" />
                        </View>
                        <Text style={styles.actionText}>Scan QR</Text>
                        <Text style={styles.actionSubtext}>Unlock content</Text>
                    </TouchableOpacity>
                </View>

                {/* Recent Activity */}
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <View style={styles.emptyState}>
                    <Ionicons name="time-outline" size={40} color="#333" />
                    <Text style={styles.emptyTitle}>No activity yet</Text>
                    <Text style={styles.emptySubtext}>Create your first RDO to get started</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f0f0f',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingBottom: 120,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 28,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    logoEmoji: {
        fontSize: 24,
    },
    title: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        letterSpacing: -0.5,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        marginTop: 2,
        marginLeft: 34,
    },
    walletButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    walletButtonConnected: {
        backgroundColor: 'rgba(225, 29, 72, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(225, 29, 72, 0.3)',
    },
    walletButtonText: {
        color: '#000',
        fontWeight: '600',
        fontSize: 13,
    },
    connectedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    connectedText: {
        color: '#e11d48',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#22c55e',
    },
    heroWrapper: {
        marginBottom: 20,
        borderRadius: 24,
        overflow: 'hidden',
        ...Platform.select({
            web: {
                boxShadow: '0 8px 32px rgba(225, 29, 72, 0.2)',
            },
            default: {
                shadowColor: '#e11d48',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.25,
                shadowRadius: 16,
                elevation: 12,
            }
        }),
    },
    heroCard: {
        padding: 24,
        borderRadius: 24,
    },
    heroContent: {
        marginBottom: 20,
    },
    heroLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
    },
    heroBalance: {
        color: '#fff',
        fontSize: 40,
        fontWeight: 'bold',
        letterSpacing: -1,
    },
    networkBadge: {
        backgroundColor: 'rgba(0,0,0,0.25)',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    networkDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#22c55e',
    },
    networkText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 12,
        fontWeight: '500',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 28,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
    },
    statNumber: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    statLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
        marginTop: 4,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
        letterSpacing: -0.3,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 28,
    },
    actionCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        gap: 12,
    },
    actionIconWrapper: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: 'rgba(225, 29, 72, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
    actionSubtext: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
    },
    emptyState: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        borderStyle: 'dashed',
        padding: 40,
        alignItems: 'center',
    },
    emptyTitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 15,
        fontWeight: '600',
        marginTop: 12,
    },
    emptySubtext: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 13,
        marginTop: 4,
    },
});
