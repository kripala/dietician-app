import React, { useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clipboard, Apple } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import AppHeader from '../components/AppHeader';
import { isAdmin } from '../utils/roleHelpers';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
    const { user } = useAuth();

    // Redirect admins to AdminDashboard (now via tabs)
    useEffect(() => {
        if (user?.role && isAdmin(user.role)) {
            navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' as never, params: { screen: 'Admin' as never } }],
            });
        }
    }, [user, navigation]);

    return (
        <SafeAreaView style={styles.container}>
            <AppHeader navigation={navigation} />

            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Apple size={32} color="#667eea" />
                    <Text style={styles.statValue}>1,250</Text>
                    <Text style={styles.statLabel}>Calories</Text>
                </View>
                <View style={styles.statCard}>
                    <Calendar size={32} color="#2196F3" />
                    <Text style={styles.statValue}>2</Text>
                    <Text style={styles.statLabel}>Appointments</Text>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Dashboard</Text>

            <View style={styles.menuGrid}>
                <TouchableOpacity style={styles.menuItem}>
                    <Clipboard size={24} color="#667eea" />
                    <Text style={styles.menuLabel}>Prescriptions</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem}>
                    <Apple size={24} color="#667eea" />
                    <Text style={styles.menuLabel}>Meal Plans</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.placeholderCard}>
                <Text style={styles.placeholderText}>
                    Personalized dietician features coming soon!
                </Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    statCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        width: '48%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#212529',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 14,
        color: '#6c757d',
        marginTop: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#212529',
        marginHorizontal: 20,
        marginBottom: 15,
    },
    menuGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    menuItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        width: '48%',
        marginBottom: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    menuLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#212529',
        marginTop: 10,
    },
    placeholderCard: {
        margin: 20,
        padding: 30,
        backgroundColor: '#E9ECEF',
        borderRadius: 12,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#ADB5BD',
        alignItems: 'center',
    },
    placeholderText: {
        textAlign: 'center',
        color: '#495057',
        fontSize: 16,
        fontStyle: 'italic',
    },
});

export default HomeScreen;
