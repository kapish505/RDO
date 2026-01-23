import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CONTRACT_ADDRESS, RDORegistryABI, SEPOLIA_CONFIG } from '@/constants/contract';
import { ethers } from 'ethers';

export default function TestScreen() {
    const [rdoId, setRdoId] = useState('');
    const [loading, setLoading] = useState(false);
    const [rdoData, setRdoData] = useState<any>(null);
    const [error, setError] = useState('');

    const searchRDO = async () => {
        if (!rdoId.trim()) {
            setError('Please enter an RDO ID');
            return;
        }

        setLoading(true);
        setError('');
        setRdoData(null);

        try {
            const provider = new ethers.providers.JsonRpcProvider(SEPOLIA_CONFIG.rpcUrl);
            const contract = new ethers.Contract(CONTRACT_ADDRESS, RDORegistryABI, provider);

            const data = await contract.rdos(parseInt(rdoId));

            if (data.id.toString() === '0') {
                setError('RDO not found on-chain');
            } else {
                setRdoData({
                    id: data.id.toString(),
                    creator: data.creator,
                    rulesHash: data.rulesHash,
                    rdoType: ['MESSAGE', 'FILE', 'LINK', 'PERMISSION'][data.rdoType] || 'UNKNOWN',
                    metadataCID: data.metadataCID,
                    locked: data.locked,
                    violationCount: data.violationCount.toString(),
                });
            }
        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Failed to fetch RDO');
        } finally {
            setLoading(false);
        }
    };

    const openEtherscan = () => {
        if (rdoData?.creator) {
            Linking.openURL(`${SEPOLIA_CONFIG.explorer}/address/${rdoData.creator}`);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.iconWrapper}>
                        <Ionicons name="flask" size={28} color="#e11d48" />
                    </View>
                    <View>
                        <Text style={styles.pageTitle}>Test Lab</Text>
                        <Text style={styles.pageSubtitle}>Inspect on-chain RDOs</Text>
                    </View>
                </View>

                {/* Search Box */}
                <View style={styles.searchBox}>
                    <View style={styles.searchInputWrapper}>
                        <Ionicons name="search" size={20} color="#666" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Enter RDO ID (e.g., 1, 2, 3...)"
                            placeholderTextColor="#444"
                            value={rdoId}
                            onChangeText={setRdoId}
                            keyboardType="number-pad"
                        />
                    </View>
                    <TouchableOpacity
                        style={styles.searchButton}
                        onPress={searchRDO}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Ionicons name="arrow-forward" size={22} color="#fff" />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Error State */}
                {error ? (
                    <View style={styles.errorCard}>
                        <Ionicons name="alert-circle" size={24} color="#ef4444" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                {/* Result Card */}
                {rdoData ? (
                    <View style={styles.resultCard}>
                        {/* Header */}
                        <View style={styles.resultHeader}>
                            <View style={styles.rdoIdBadge}>
                                <Text style={styles.rdoIdText}>#{rdoData.id}</Text>
                            </View>
                            <View style={[styles.statusBadge, rdoData.locked && styles.statusBadgeLocked]}>
                                <View style={[styles.statusDot, rdoData.locked && styles.statusDotLocked]} />
                                <Text style={[styles.statusText, rdoData.locked && styles.statusTextLocked]}>
                                    {rdoData.locked ? 'LOCKED' : 'ACTIVE'}
                                </Text>
                            </View>
                        </View>

                        {/* Data Rows */}
                        <View style={styles.dataSection}>
                            <View style={styles.dataRow}>
                                <View style={styles.dataIcon}>
                                    <Ionicons name="document-text-outline" size={16} color="#666" />
                                </View>
                                <Text style={styles.dataLabel}>Type</Text>
                                <Text style={styles.dataValue}>{rdoData.rdoType}</Text>
                            </View>

                            <View style={styles.dataRow}>
                                <View style={styles.dataIcon}>
                                    <Ionicons name="person-outline" size={16} color="#666" />
                                </View>
                                <Text style={styles.dataLabel}>Creator</Text>
                                <Text style={styles.dataValueMono}>
                                    {rdoData.creator.slice(0, 8)}...{rdoData.creator.slice(-6)}
                                </Text>
                            </View>

                            <View style={styles.dataRow}>
                                <View style={styles.dataIcon}>
                                    <Ionicons name="warning-outline" size={16} color="#666" />
                                </View>
                                <Text style={styles.dataLabel}>Violations</Text>
                                <Text style={[styles.dataValue, parseInt(rdoData.violationCount) > 0 && styles.dangerValue]}>
                                    {rdoData.violationCount}
                                </Text>
                            </View>

                            <View style={styles.dataRow}>
                                <View style={styles.dataIcon}>
                                    <Ionicons name="cube-outline" size={16} color="#666" />
                                </View>
                                <Text style={styles.dataLabel}>IPFS CID</Text>
                                <Text style={styles.dataValueMono} numberOfLines={1}>
                                    {rdoData.metadataCID?.slice(0, 12) || 'N/A'}...
                                </Text>
                            </View>
                        </View>

                        {/* Action Button */}
                        <TouchableOpacity style={styles.viewButton} onPress={openEtherscan}>
                            <Ionicons name="open-outline" size={18} color="#fff" />
                            <Text style={styles.viewButtonText}>View on Etherscan</Text>
                        </TouchableOpacity>
                    </View>
                ) : !loading && !error ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconWrapper}>
                            <Ionicons name="cube-outline" size={48} color="#333" />
                        </View>
                        <Text style={styles.emptyTitle}>Search for an RDO</Text>
                        <Text style={styles.emptyDesc}>
                            Enter an RDO ID to view its on-chain data, rules, and violation history
                        </Text>
                    </View>
                ) : null}

                {/* Info Card */}
                <View style={styles.infoCard}>
                    <Ionicons name="information-circle-outline" size={20} color="#666" />
                    <Text style={styles.infoText}>
                        RDOs are stored on Sepolia testnet. Each RDO has a unique ID, rules hash, and metadata CID.
                    </Text>
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
        alignItems: 'center',
        gap: 14,
        marginBottom: 28,
    },
    iconWrapper: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: 'rgba(225, 29, 72, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pageTitle: {
        color: '#fff',
        fontSize: 26,
        fontWeight: 'bold',
        letterSpacing: -0.5,
    },
    pageSubtitle: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 13,
        marginTop: 2,
    },
    searchBox: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    searchInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 14,
        paddingHorizontal: 14,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        fontSize: 15,
        paddingVertical: 14,
    },
    searchButton: {
        backgroundColor: '#e11d48',
        width: 52,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            web: {
                boxShadow: '0 4px 12px rgba(225, 29, 72, 0.3)',
            },
            default: {
                shadowColor: '#e11d48',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
            }
        }),
    },
    errorCard: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
        borderRadius: 14,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    errorText: {
        color: '#ef4444',
        flex: 1,
        fontSize: 14,
    },
    resultCard: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
    },
    resultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    rdoIdBadge: {
        backgroundColor: 'rgba(225, 29, 72, 0.15)',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 10,
    },
    rdoIdText: {
        color: '#e11d48',
        fontSize: 18,
        fontWeight: 'bold',
    },
    statusBadge: {
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusBadgeLocked: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#22c55e',
    },
    statusDotLocked: {
        backgroundColor: '#ef4444',
    },
    statusText: {
        color: '#22c55e',
        fontSize: 11,
        fontWeight: 'bold',
    },
    statusTextLocked: {
        color: '#ef4444',
    },
    dataSection: {
        gap: 4,
    },
    dataRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.04)',
        gap: 10,
    },
    dataIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.04)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dataLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 13,
        flex: 1,
    },
    dataValue: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    dataValueMono: {
        color: '#fff',
        fontSize: 12,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    dangerValue: {
        color: '#ef4444',
    },
    viewButton: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        padding: 14,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 16,
    },
    viewButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 48,
        paddingHorizontal: 32,
    },
    emptyIconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.03)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    emptyDesc: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 22,
    },
    infoCard: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginTop: 8,
    },
    infoText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        flex: 1,
        lineHeight: 18,
    },
});
