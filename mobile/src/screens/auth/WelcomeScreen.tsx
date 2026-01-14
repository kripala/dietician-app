import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { Apple, ChevronRight } from 'lucide-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const { width, height } = Dimensions.get('window');

const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.gradient}
            >
                <View style={styles.content}>
                    <View style={styles.logoContainer}>
                        <Apple size={80} color="#FFFFFF" strokeWidth={1.5} />
                        <Text style={styles.title}>Dietician</Text>
                        <Text style={styles.subtitle}>Your Health, Simplified</Text>
                    </View>

                    <View style={styles.illustrationContainer}>
                        {/* We can add an illustration here if we had one */}
                        <View style={styles.dotGrid}>
                            {[...Array(20)].map((_, i) => (
                                <View key={i} style={styles.dot} />
                            ))}
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.slogan}>
                            Personalized diet plans & expert consultation at your fingertips.
                        </Text>

                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => navigation.navigate('Register')}
                        >
                            <Text style={styles.buttonText}>Get Started</Text>
                            <ChevronRight size={20} color="#667eea" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.loginLink}
                            onPress={() => navigation.navigate('Login')}
                        >
                            <Text style={styles.loginLinkText}>
                                Already have an account? <Text style={styles.loginLinkBold}>Sign In</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 30,
        justifyContent: 'space-between',
        paddingTop: height * 0.15,
        paddingBottom: 50,
    },
    logoContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 10,
        letterSpacing: 1,
        fontFamily: 'System',
    },
    subtitle: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 5,
        fontFamily: 'System',
    },
    illustrationContainer: {
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dotGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: 200,
        justifyContent: 'center',
        opacity: 0.2,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FFFFFF',
        margin: 8,
    },
    footer: {
        alignItems: 'center',
    },
    slogan: {
        fontSize: 16,
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24,
        opacity: 0.9,
        fontFamily: 'System',
    },
    button: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        paddingHorizontal: 40,
        borderRadius: 30,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 8,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#667eea',
        marginRight: 10,
    },
    loginLink: {
        marginTop: 25,
    },
    loginLinkText: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    loginLinkBold: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
});

export default WelcomeScreen;
