import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWallet } from '@/context/WalletContext';
import { RDOType, compileRules } from '@/utils/rules';
import { generateKey, encryptData } from '@/utils/crypto';
import { CONTRACT_ADDRESS, RDORegistryABI } from '@/constants/contract';
import { ethers } from 'ethers';
import { Ionicons } from '@expo/vector-icons';

export default function CreateScreen() {
    const { isConnected, getSigner, connectWallet } = useWallet();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [payload, setPayload] = useState({ text: '', name: '', description: '' });
    const [rules, setRules] = useState({
        forbidCopy: false,
        forbidForward: false,
        maxUses: 0,
        expirySeconds: 0,
    });

    const handleCreate = async () => {
        if (!isConnected) {
            Alert.alert("Wallet Required", "Please connect your wallet first", [
                { text: "Cancel" },
                { text: "Connect", onPress: connectWallet }
            ]);
            return;
        }

        if (!payload.name || !payload.text) {
            Alert.alert("Missing Content", "Please fill in the name and message");
            return;
        }

        setLoading(true);
        try {
            // Generate encryption key
            const key = await generateKey();
            const { iv, ciphertext } = await encryptData(key, payload.text);

            // Compile rules to hash
            const compiled = compileRules({
                type: RDOType.MESSAGE,
                name: payload.name,
                description: payload.description || '',
                payload: { text: payload.text },
                allowedUsers: 'ANY',
                forbiddenActions: [],
                expirySeconds: rules.expirySeconds,
                violationAction: 'REFUSE',
                maxUses: rules.maxUses,
                requireIdentity: 'NEVER'
            });

            // Get signer and create contract
            const signer = getSigner();
            if (!signer) throw new Error("Signer not available");

            const contract = new ethers.Contract(CONTRACT_ADDRESS, RDORegistryABI, signer);

            // Create RDO on-chain
            const tx = await contract.createRDO(
                compiled.hash,
                0, // MESSAGE type
                {
                    forbidCopy: rules.forbidCopy,
                    forbidForward: rules.forbidForward,
                    forbidExport: false,
                    expiry: rules.expirySeconds,
                    accessType: 0,
                    maxUses: rules.maxUses,
                    lockOnViolation: false,
                    requireIdentity: false
                },
                "QmMockMetadataCID",
                []
            );

            console.log("Transaction sent:", tx.hash);
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

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                <Text style={styles.pageTitle}>Create RDO</Text>
                <Text style={styles.pageSubtitle}>Step {step} of 2</Text>

                {step === 1 ? (
                    <View style={styles.stepContainer}>
                        <Text style={styles.sectionTitle}>Content</Text>

                        <Text style={styles.inputLabel}>Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Give your RDO a name..."
                            placeholderTextColor="#666"
                            value={payload.name}
                            onChangeText={t => setPayload({ ...payload, name: t })}
                        />

                        <Text style={styles.inputLabel}>Secret Message</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Enter your secret content..."
                            placeholderTextColor="#666"
                            multiline
                            numberOfLines={4}
                            value={payload.text}
                            onChangeText={t => setPayload({ ...payload, text: t })}
                        />

                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => setStep(2)}
                        >
                            <Text style={styles.primaryButtonText}>Next: Set Rules</Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.stepContainer}>
                        <Text style={styles.sectionTitle}>Rules</Text>

                        <View style={styles.ruleRow}>
                            <View>
                                <Text style={styles.ruleTitle}>Forbid Copying</Text>
                                <Text style={styles.ruleDesc}>Prevent screenshots and copy</Text>
                            </View>
                            <Switch
                                value={rules.forbidCopy}
                                onValueChange={v => setRules({ ...rules, forbidCopy: v })}
                                trackColor={{ false: '#333', true: '#e11d48' }}
                            />
                        </View>

                        <View style={styles.ruleRow}>
                            <View>
                                <Text style={styles.ruleTitle}>Self-Destruct</Text>
                                <Text style={styles.ruleDesc}>Delete after first view</Text>
                            </View>
                            <Switch
                                value={rules.maxUses === 1}
                                onValueChange={v => setRules({ ...rules, maxUses: v ? 1 : 0 })}
                                trackColor={{ false: '#333', true: '#e11d48' }}
                            />
                        </View>

                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={() => setStep(1)}
                            >
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
                    </View>
                )}
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
        paddingBottom: 120,
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
    stepContainer: {
        gap: 16,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    inputLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        marginBottom: 8,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 16,
        color: '#fff',
        fontSize: 16,
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    ruleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    ruleTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    ruleDesc: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        marginTop: 2,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    primaryButton: {
        backgroundColor: '#e11d48',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    mintButton: {
        flex: 1,
    },
    primaryButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    secondaryButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 16,
        borderRadius: 12,
        paddingHorizontal: 24,
    },
    secondaryButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    disabledButton: {
        opacity: 0.6,
    },
});
