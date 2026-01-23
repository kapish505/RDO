import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
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
                setError('RDO not found');
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

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                <Text style={styles.pageTitle}>Test Lab</Text>
                <Text style={styles.pageSubtitle}>Inspect RDOs on Sepolia</Text>

                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Enter RDO ID (e.g., 1)"
                        placeholderTextColor="#666"
                        value={rdoId}
                        onChangeText={setRdoId}
                        keyboardType="number-pad"
                    />
                    <TouchableOpacity
                        style={styles.searchButton}
                        onPress={searchRDO}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Ionicons name="search" size={22} color="#fff" />
                        )}
                    </TouchableOpacity>
                </View>

                {error ? (
                    <View style={styles.errorCard}>
                        <Ionicons name="alert-circle" size={24} color="#ef4444" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                {rdoData ? (
                    <View style={styles.resultCard}>
                        <View style={styles.resultHeader}>
                            <Text style={styles.resultTitle}>RDO #{rdoData.id}</Text>
                            <View style={[styles.badge, rdoData.locked && styles.badgeDanger]}>
                                <Text style={styles.badgeText}>
                                    {rdoData.locked ? 'LOCKED' : 'ACTIVE'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.dataRow}>
                            <Text style={styles.dataLabel}>Type</Text>
                            <Text style={styles.dataValue}>{rdoData.rdoType}</Text>
                        </View>

                        <View style={styles.dataRow}>
                            <Text style={styles.dataLabel}>Creator</Text>
                            <Text style={styles.dataValueMono}>
                                {rdoData.creator.slice(0, 10)}...{rdoData.creator.slice(-8)}
                            </Text>
                        </View>

                        <View style={styles.dataRow}>
                            <Text style={styles.dataLabel}>Violations</Text>
                            <Text style={[styles.dataValue, rdoData.violationCount > 0 && styles.dangerText]}>
                                {rdoData.violationCount}
                            </Text>
                        </View>

                        <View style={styles.dataRow}>
                            <Text style={styles.dataLabel}>Metadata CID</Text>
                            <Text style={styles.dataValueMono} numberOfLines={1}>
                                {rdoData.metadataCID || 'None'}
                            </Text>
                        </View>

                        <TouchableOpacity style={styles.viewButton}>
                            <Ionicons name="eye" size={20} color="#fff" />
                            <Text style={styles.viewButtonText}>View on Etherscan</Text>
                        </TouchableOpacity>
                    </View>
                ) : !loading && !error ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="flask-outline" size={48} color="#444" />
                        <Text style={styles.emptyTitle}>Search for an RDO</Text>
                        <Text style={styles.emptyDesc}>
                            Enter an RDO ID to view its on-chain data
                        </Text>
                    </View>
                ) : null}
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
    pageTitle: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    pageSubtitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        marginBottom: 24,
    },
    searchContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    searchInput: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 14,
        color: '#fff',
        fontSize: 16,
    },
    searchButton: {
        backgroundColor: '#e11d48',
        width: 52,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorCard: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    errorText: {
        color: '#ef4444',
        flex: 1,
    },
    resultCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: 20,
    },
    resultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    resultTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
    },
    badge: {
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeDanger: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
    },
    badgeText: {
        color: '#22c55e',
        fontSize: 11,
        fontWeight: 'bold',
    },
    dataRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    dataLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
    },
    dataValue: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    dataValueMono: {
        color: '#fff',
        fontSize: 12,
        fontFamily: 'monospace',
    },
    dangerText: {
        color: '#ef4444',
    },
    viewButton: {
        backgroundColor: '#e11d48',
        padding: 14,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 16,
    },
    viewButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    emptyDesc: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
});
