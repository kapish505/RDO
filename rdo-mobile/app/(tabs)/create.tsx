import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch, Alert, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWallet } from '@/context/WalletContext';
import { RDOType, compileRules } from '@/utils/rules';
import { generateKey, encryptData } from '@/utils/crypto';
import { CONTRACT_ADDRESS, RDORegistryABI } from '@/constants/contract';
import { ethers } from 'ethers';
import { Ionicons } from '@expo/vector-icons';

const RDO_TYPES = [
    { type: RDOType.MESSAGE, icon: 'chatbubble', label: 'Message', desc: 'Secret text content' },
    { type: RDOType.FILE, icon: 'document', label: 'File', desc: 'Protected documents' },
    { type: RDOType.LINK, icon: 'link', label: 'Link', desc: 'Private URLs' },
];

export default function CreateScreen() {
    const { isConnected, getSigner, connectWallet } = useWallet();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [selectedType, setSelectedType] = useState(RDOType.MESSAGE);
    const [payload, setPayload] = useState({ text: '', name: '', description: '' });
    const [rules, setRules] = useState({
        forbidCopy: true,
        forbidForward: false,
        selfDestruct: false,
        maxUses: 0,
        expiryHours: 0,
    });

    const handleCreate = async () => {
        if (!isConnected) {
            Alert.alert("Wallet Required", "Please connect your wallet first", [
                { text: "Cancel" },
                { text: "Connect", onPress: connectWallet }
            ]);
            return;
        }

        if (!payload.name.trim() || !payload.text.trim()) {
            Alert.alert("Missing Content", "Please fill in the name and message");
            return;
        }

        setLoading(true);
        try {
            const key = await generateKey();
            const { iv, ciphertext } = await encryptData(key, payload.text);

            const compiled = compileRules({
                type: selectedType,
                name: payload.name,
                description: payload.description || '',
                payload: { text: payload.text },
                allowedUsers: 'ANY',
                forbiddenActions: [],
                expirySeconds: rules.expiryHours * 3600,
                violationAction: 'REFUSE',
                maxUses: rules.selfDestruct ? 1 : rules.maxUses,
                requireIdentity: 'NEVER'
            });

            const signer = getSigner();
            if (!signer) throw new Error("Signer not available");

            const contract = new ethers.Contract(CONTRACT_ADDRESS, RDORegistryABI, signer);

            const tx = await contract.createRDO(
                compiled.hash,
                0,
                {
                    forbidCopy: rules.forbidCopy,
                    forbidForward: rules.forbidForward,
                    forbidExport: false,
                    expiry: rules.expiryHours * 3600,
                    accessType: 0,
                    maxUses: rules.selfDestruct ? 1 : rules.maxUses,
                    lockOnViolation: false,
                    requireIdentity: false
                },
                "QmMockMetadataCID",
                []
            );

            await tx.wait();

            Alert.alert("Success! 🎉", "Your RDO has been minted on-chain", [
                { text: "OK", onPress: () => { setStep(1); setPayload({ text: '', name: '', description: '' }); } }
            ]);
        } catch (e: any) {
            console.error("Create error:", e);
            Alert.alert("Error", e.reason || e.message || "Failed to create RDO");
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <>
            {/* Type Selection */}
            <Text style={styles.label}>Type</Text>
            <View style={styles.typeRow}>
                {RDO_TYPES.map((t) => (
                    <TouchableOpacity
                        key={t.type}
                        style={[styles.typeCard, selectedType === t.type && styles.typeCardActive]}
                        onPress={() => setSelectedType(t.type)}
                    >
                        <Ionicons
                            name={t.icon as any}
                            size={24}
                            color={selectedType === t.type ? '#e11d48' : '#666'}
                        />
                        <Text style={[styles.typeLabel, selectedType === t.type && styles.typeLabelActive]}>
                            {t.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Name Input */}
            <Text style={styles.label}>Name</Text>
            <View style={styles.inputWrapper}>
                <Ionicons name="pricetag-outline" size={18} color="#666" />
                <TextInput
                    style={styles.input}
                    placeholder="Give your RDO a name..."
                    placeholderTextColor="#444"
                    value={payload.name}
                    onChangeText={t => setPayload({ ...payload, name: t })}
                />
            </View>

            {/* Content Input */}
            <Text style={styles.label}>Secret Content</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Enter your secret message..."
                    placeholderTextColor="#444"
                    multiline
                    numberOfLines={5}
                    value={payload.text}
                    onChangeText={t => setPayload({ ...payload, text: t })}
                />
            </View>

            {/* Next Button */}
            <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setStep(2)}
            >
                <Text style={styles.primaryButtonText}>Set Rules</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
        </>
    );

    const renderStep2 = () => (
        <>
            {/* Rules Cards */}
            <View style={styles.ruleCard}>
                <View style={styles.ruleIcon}>
                    <Ionicons name="copy-outline" size={20} color="#e11d48" />
                </View>
                <View style={styles.ruleContent}>
                    <Text style={styles.ruleTitle}>Forbid Copying</Text>
                    <Text style={styles.ruleDesc}>Block screenshots and copy</Text>
                </View>
                <Switch
                    value={rules.forbidCopy}
                    onValueChange={v => setRules({ ...rules, forbidCopy: v })}
                    trackColor={{ false: '#333', true: 'rgba(225, 29, 72, 0.5)' }}
                    thumbColor={rules.forbidCopy ? '#e11d48' : '#666'}
                />
            </View>

            <View style={styles.ruleCard}>
                <View style={styles.ruleIcon}>
                    <Ionicons name="arrow-redo-outline" size={20} color="#e11d48" />
                </View>
                <View style={styles.ruleContent}>
                    <Text style={styles.ruleTitle}>Forbid Forwarding</Text>
                    <Text style={styles.ruleDesc}>Prevent sharing to others</Text>
                </View>
                <Switch
                    value={rules.forbidForward}
                    onValueChange={v => setRules({ ...rules, forbidForward: v })}
                    trackColor={{ false: '#333', true: 'rgba(225, 29, 72, 0.5)' }}
                    thumbColor={rules.forbidForward ? '#e11d48' : '#666'}
                />
            </View>

            <View style={styles.ruleCard}>
                <View style={styles.ruleIcon}>
                    <Ionicons name="flash-outline" size={20} color="#e11d48" />
                </View>
                <View style={styles.ruleContent}>
                    <Text style={styles.ruleTitle}>Self-Destruct</Text>
                    <Text style={styles.ruleDesc}>Delete after first view</Text>
                </View>
                <Switch
                    value={rules.selfDestruct}
                    onValueChange={v => setRules({ ...rules, selfDestruct: v })}
                    trackColor={{ false: '#333', true: 'rgba(225, 29, 72, 0.5)' }}
                    thumbColor={rules.selfDestruct ? '#e11d48' : '#666'}
                />
            </View>

            {/* Summary */}
            <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Summary</Text>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Name</Text>
                    <Text style={styles.summaryValue}>{payload.name || 'Untitled'}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Type</Text>
                    <Text style={styles.summaryValue}>{selectedType}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Rules</Text>
                    <Text style={styles.summaryValue}>
                        {[
                            rules.forbidCopy && 'No Copy',
                            rules.forbidForward && 'No Forward',
                            rules.selfDestruct && 'Self-Destruct'
                        ].filter(Boolean).join(', ') || 'None'}
                    </Text>
                </View>
            </View>

            {/* Buttons */}
            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => setStep(1)}
                >
                    <Ionicons name="arrow-back" size={18} color="#fff" />
                    <Text style={styles.secondaryButtonText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.primaryButton, styles.mintButton, loading && styles.disabledButton]}
                    onPress={handleCreate}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="flash" size={20} color="#fff" />
                            <Text style={styles.primaryButtonText}>Mint RDO</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.pageTitle}>Create RDO</Text>
                    <View style={styles.stepIndicator}>
                        <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
                        <View style={styles.stepLine} />
                        <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
                    </View>
                </View>

                <Text style={styles.pageSubtitle}>
                    {step === 1 ? 'Define your content' : 'Configure access rules'}
                </Text>

                {step === 1 ? renderStep1() : renderStep2()}
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
        paddingBottom: 140,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    pageTitle: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
        letterSpacing: -0.5,
    },
    stepIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    stepDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#333',
    },
    stepDotActive: {
        backgroundColor: '#e11d48',
    },
    stepLine: {
        width: 24,
        height: 2,
        backgroundColor: '#333',
    },
    pageSubtitle: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
        marginBottom: 28,
    },
    label: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 10,
        marginTop: 16,
    },
    typeRow: {
        flexDirection: 'row',
        gap: 10,
    },
    typeCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        gap: 8,
    },
    typeCardActive: {
        backgroundColor: 'rgba(225, 29, 72, 0.1)',
        borderColor: 'rgba(225, 29, 72, 0.3)',
    },
    typeLabel: {
        color: '#666',
        fontSize: 12,
        fontWeight: '600',
    },
    typeLabelActive: {
        color: '#e11d48',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 14,
        paddingHorizontal: 14,
        gap: 10,
    },
    textAreaWrapper: {
        alignItems: 'flex-start',
        paddingVertical: 14,
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 15,
        paddingVertical: 14,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    ruleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        gap: 14,
    },
    ruleIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(225, 29, 72, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ruleContent: {
        flex: 1,
    },
    ruleTitle: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    ruleDesc: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        marginTop: 2,
    },
    summaryCard: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        padding: 20,
        marginTop: 12,
        marginBottom: 24,
    },
    summaryTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    summaryLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 13,
    },
    summaryValue: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '500',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    primaryButton: {
        backgroundColor: '#e11d48',
        padding: 16,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 24,
        ...Platform.select({
            web: {
                boxShadow: '0 4px 16px rgba(225, 29, 72, 0.3)',
            },
            default: {
                shadowColor: '#e11d48',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 8,
            }
        }),
    },
    mintButton: {
        flex: 1,
        marginTop: 0,
    },
    primaryButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    secondaryButton: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        padding: 16,
        borderRadius: 14,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    secondaryButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    disabledButton: {
        opacity: 0.6,
    },
});
