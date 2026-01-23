import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';

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
                            size={24}
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
                            <Ionicons name="add" size={28} color="white" />
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
                            size={24}
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
        borderTopColor: '#222',
        height: 85,
        paddingTop: 8,
        paddingBottom: 25,
    },
    tabLabel: {
        fontSize: 11,
        fontWeight: '600',
    },
    createButton: {
        backgroundColor: '#e11d48',
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -15,
        shadowColor: '#e11d48',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});
