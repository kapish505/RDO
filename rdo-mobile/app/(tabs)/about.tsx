import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const FEATURES = [
    {
        icon: 'lock-closed',
        title: 'Rule-Defined Objects',
        desc: 'Digital content with on-chain enforceable rules. Your content, your terms.'
    },
    {
        icon: 'shield-checkmark',
        title: 'Self-Enforcing Rules',
        desc: 'Objects can REFUSE unauthorized actions. No intermediaries needed.'
    },
    {
        icon: 'flash',
        title: 'One-Time View',
        desc: 'Create self-destructing messages that vanish after being read once.'
    },
    {
        icon: 'analytics',
        title: 'PoEC Verification',
        desc: 'AI-powered Graph Neural Network detects anomalous wallet behavior.'
    },
    {
        icon: 'qr-code',
        title: 'QR Code Sharing',
        desc: 'Share RDOs instantly via scannable QR codes at parties and events.'
    },
    {
        icon: 'wallet',
        title: 'Web3 Native',
        desc: 'Built on Ethereum/Monad with WalletConnect for seamless wallet integration.'
    },
];

const TECH_STACK = [
    'React Native + Expo',
    'NativeWind (TailwindCSS)',
    'Ethers.js + Viem',
    'WalletConnect Modal',
    'AES-GCM Encryption',
    'IPFS (Pinata)',
    'Solidity Smart Contracts',
];

export default function AboutScreen() {
    const openLink = (url: string) => Linking.openURL(url);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                {/* Hero */}
                <View style={styles.hero}>
                    <Text style={styles.heroEmoji}>🔐</Text>
                    <Text style={styles.heroTitle}>RDO Protocol</Text>
                    <Text style={styles.heroSubtitle}>Objects That Say No</Text>
                </View>

                {/* Tagline */}
                <View style={styles.taglineCard}>
                    <Text style={styles.taglineText}>
                        Create digital objects with built-in rules that enforce themselves.
                        No screenshots. No forwarding. No unauthorized access.
                    </Text>
                </View>

                {/* What is RDO */}
                <Text style={styles.sectionTitle}>What is RDO?</Text>
                <View style={styles.explainerCard}>
                    <Text style={styles.explainerText}>
                        <Text style={styles.bold}>RDO (Rule-Defined Object)</Text> is a new primitive for digital ownership.
                        Unlike traditional files that can be freely copied, RDOs are encrypted content with
                        on-chain rules that determine who can access them and what they can do.
                    </Text>
                    <Text style={styles.explainerText}>
                        When you create an RDO, you define its rules: who can view it, whether it can be copied,
                        how many times it can be accessed, and when it expires. These rules are cryptographically
                        hashed and stored on the blockchain.
                    </Text>
                    <Text style={styles.explainerText}>
                        When someone tries to access your RDO, the smart contract verifies they meet the rules.
                        If they violate them, <Text style={styles.accent}>the object locks itself permanently.</Text>
                    </Text>
                </View>

                {/* Features */}
                <Text style={styles.sectionTitle}>Features</Text>
                {FEATURES.map((feature, i) => (
                    <View key={i} style={styles.featureCard}>
                        <View style={styles.featureIcon}>
                            <Ionicons name={feature.icon as any} size={24} color="#e11d48" />
                        </View>
                        <View style={styles.featureContent}>
                            <Text style={styles.featureTitle}>{feature.title}</Text>
                            <Text style={styles.featureDesc}>{feature.desc}</Text>
                        </View>
                    </View>
                ))}

                {/* How It Works */}
                <Text style={styles.sectionTitle}>How It Works</Text>
                <View style={styles.stepsCard}>
                    <View style={styles.step}>
                        <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
                        <Text style={styles.stepText}>Create content and define access rules</Text>
                    </View>
                    <View style={styles.step}>
                        <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
                        <Text style={styles.stepText}>Content is encrypted with AES-256</Text>
                    </View>
                    <View style={styles.step}>
                        <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
                        <Text style={styles.stepText}>Rules hash stored on blockchain</Text>
                    </View>
                    <View style={styles.step}>
                        <View style={styles.stepNumber}><Text style={styles.stepNumberText}>4</Text></View>
                        <Text style={styles.stepText}>Share via QR code or magic link</Text>
                    </View>
                    <View style={styles.step}>
                        <View style={styles.stepNumber}><Text style={styles.stepNumberText}>5</Text></View>
                        <Text style={styles.stepText}>Recipient unlocks if rules pass</Text>
                    </View>
                </View>

                {/* Tech Stack */}
                <Text style={styles.sectionTitle}>Built With</Text>
                <View style={styles.techCard}>
                    {TECH_STACK.map((tech, i) => (
                        <View key={i} style={styles.techBadge}>
                            <Text style={styles.techText}>{tech}</Text>
                        </View>
                    ))}
                </View>

                {/* Links */}
                <Text style={styles.sectionTitle}>Links</Text>
                <View style={styles.linksRow}>
                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => openLink('https://github.com/Dhwaniiiiiiii/RDO')}
                    >
                        <Ionicons name="logo-github" size={20} color="#fff" />
                        <Text style={styles.linkText}>GitHub</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => openLink('https://sepolia.etherscan.io')}
                    >
                        <Ionicons name="cube" size={20} color="#fff" />
                        <Text style={styles.linkText}>Etherscan</Text>
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Built for the Agent Economy 🤖</Text>
                    <Text style={styles.footerSubtext}>x402 Track • Monad Hackathon 2026</Text>
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
        paddingBottom: 120,
    },
    hero: {
        alignItems: 'center',
        marginBottom: 24,
    },
    heroEmoji: {
        fontSize: 64,
        marginBottom: 12,
    },
    heroTitle: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
    },
    heroSubtitle: {
        color: '#e11d48',
        fontSize: 16,
        fontWeight: '500',
        marginTop: 4,
    },
    taglineCard: {
        backgroundColor: 'rgba(225, 29, 72, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(225, 29, 72, 0.3)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 32,
    },
    taglineText: {
        color: '#fff',
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        marginTop: 8,
    },
    explainerCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        gap: 12,
    },
    explainerText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        lineHeight: 22,
    },
    bold: {
        fontWeight: 'bold',
        color: '#fff',
    },
    accent: {
        color: '#e11d48',
        fontWeight: '600',
    },
    featureCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        gap: 16,
    },
    featureIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(225, 29, 72, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureContent: {
        flex: 1,
    },
    featureTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    featureDesc: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 13,
        lineHeight: 20,
    },
    stepsCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        gap: 16,
    },
    step: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    stepNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#e11d48',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepNumberText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    stepText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        flex: 1,
    },
    techCard: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 24,
    },
    techBadge: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    techText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontWeight: '500',
    },
    linksRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    linkButton: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 14,
        borderRadius: 12,
    },
    linkText: {
        color: '#fff',
        fontWeight: '600',
    },
    footer: {
        alignItems: 'center',
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    footerText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    footerSubtext: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        marginTop: 4,
    },
});
