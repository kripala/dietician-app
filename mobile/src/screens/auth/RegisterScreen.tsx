import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    ScrollView
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User as UserIcon, ChevronLeft, ArrowRight } from 'lucide-react-native';
import { getErrorMessage } from '../../utils/errorHandler';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const showAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.alert) {
            window.alert(`${title}\n\n${message}`);
        } else {
            console.log(`${title}: ${message}`);
        }
        onOk?.();
    } else {
        Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
    }
};

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
    const { register } = useAuth();
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleRegister = async () => {
        if (!email || !fullName || !password || !confirmPassword) {
            showAlert('Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            showAlert('Error', 'Passwords do not match');
            return;
        }

        if (password.length < 8) {
            showAlert('Error', 'Password must be at least 8 characters long');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await register({ email, password, fullName });
            showAlert('Success', response.message, () =>
                navigation.navigate('EmailVerification', { email })
            );
        } catch (error: any) {
            const errorMessage = getErrorMessage(error, 'Registration failed. Please try again.');
            showAlert('Registration Failed', errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ChevronLeft size={28} color="#212529" />
                </TouchableOpacity>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Start your personalized health plan today</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <UserIcon size={20} color="#6c757d" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Full Name"
                                placeholderTextColor="#6c757d"
                                value={fullName}
                                onChangeText={setFullName}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Mail size={20} color="#6c757d" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Email Address"
                                placeholderTextColor="#6c757d"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Lock size={20} color="#6c757d" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                placeholderTextColor="#6c757d"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Lock size={20} color="#6c757d" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Confirm Password"
                                placeholderTextColor="#6c757d"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                            />
                        </View>

                        <Text style={styles.termsText}>
                            By signing up, you agree to our <Text style={styles.termsBold}>Terms of Service</Text> and <Text style={styles.termsBold}>Privacy Policy</Text>.
                        </Text>

                        <TouchableOpacity
                            style={[styles.button, isSubmitting && styles.buttonDisabled]}
                            onPress={handleRegister}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <>
                                    <Text style={styles.buttonText}>Sign Up</Text>
                                    <ArrowRight size={20} color="#FFFFFF" />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.footerLink}>Sign In</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 30,
        paddingBottom: 40,
    },
    backButton: {
        padding: 20,
    },
    header: {
        marginBottom: 30,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#212529',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#6c757d',
    },
    form: {
        marginBottom: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        marginBottom: 15,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: '#E9ECEF',
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 15,
        fontSize: 16,
        color: '#212529',
    },
    termsText: {
        fontSize: 13,
        color: '#6c757d',
        marginBottom: 30,
        textAlign: 'center',
        lineHeight: 18,
    },
    termsBold: {
        color: '#667eea',
        fontWeight: 'bold',
    },
    button: {
        backgroundColor: '#667eea',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginRight: 10,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10,
    },
    footerText: {
        color: '#6c757d',
        fontSize: 15,
    },
    footerLink: {
        color: '#667eea',
        fontSize: 15,
        fontWeight: 'bold',
    },
});

export default RegisterScreen;
