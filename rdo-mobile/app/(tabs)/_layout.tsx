import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: '#e11d48',
                tabBarInactiveTintColor: '#666',
                tabBarShowLabel: true,
                tabBarLabelStyle: styles.tabLabel,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? "home" : "home-outline"}
                            size={22}
                            color={color}
                        />
                    )
                }}
            />
            <Tabs.Screen
                name="create"
                options={{
                    title: 'Create',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={styles.createButton}>
                            <Ionicons name="add" size={26} color="white" />
                        </View>
                    )
                }}
            />
            <Tabs.Screen
                name="test"
                options={{
                    title: 'Lab',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? "flask" : "flask-outline"}
                            size={22}
                            color={color}
                        />
                    )
                }}
            />
            <Tabs.Screen
                name="about"
                options={{
                    title: 'About',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? "information-circle" : "information-circle-outline"}
                            size={22}
                            color={color}
                        />
                    )
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: '#0a0a0a',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)',
        height: Platform.OS === 'web' ? 70 : 85,
        paddingTop: 8,
        paddingBottom: Platform.OS === 'web' ? 10 : 25,
        ...Platform.select({
            web: {
                boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
            },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 20,
            }
        }),
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 2,
    },
    createButton: {
        backgroundColor: '#e11d48',
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -12,
        ...Platform.select({
            web: {
                boxShadow: '0 4px 16px rgba(225, 29, 72, 0.4)',
            },
            default: {
                shadowColor: '#e11d48',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 10,
            }
        }),
    },
});
