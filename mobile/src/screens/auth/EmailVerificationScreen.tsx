import React, { useState, useRef, useEffect } from 'react';
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
    ActivityIndicator
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ChevronLeft, RefreshCcw, CheckCircle2 } from 'lucide-react-native';
import { getErrorMessage } from '../../utils/errorHandler';

type Props = NativeStackScreenProps<RootStackParamList, 'EmailVerification'>;

const EmailVerificationScreen: React.FC<Props> = ({ route, navigation }) => {
    const { email } = route.params;
    const { verifyOtp, resendOtp: resendOtpService } = useAuth();

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [timer, setTimer] = useState(300); // 5 minutes

    const inputRefs = useRef<Array<TextInput | null>>([]);

    useEffect(() => {
        const countdown = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(countdown);
    }, []);

    const formatTime = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    const handleOtpChange = (value: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        // Handle backspace
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const otpCode = otp.join('');
        if (otpCode.length < 6) {
            Alert.alert('Error', 'Please enter the complete 6-digit code');
            return;
        }

        setIsSubmitting(true);
        try {
            await verifyOtp({ email, otpCode });
            Alert.alert('Success', 'Email verified successfully!', [
                { text: 'Continue', onPress: () => { } } // AuthContext handles transition
            ]);
        } catch (error: any) {
            const errorMessage = getErrorMessage(error, 'OTP verification failed. Please try again.');
            Alert.alert('Verification Failed', errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResend = async () => {
        setIsResending(true);
        try {
            await resendOtpService(email);
            setOtp(['', '', '', '', '', '']);
            setTimer(300);
            Alert.alert('Success', 'A new code has been sent to your email.');
        } catch (error: any) {
            const errorMessage = getErrorMessage(error, 'Failed to resend code. Please try again.');
            Alert.alert('Error', errorMessage);
        } finally {
            setIsResending(false);
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

                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Verify Email</Text>
                        <Text style={styles.subtitle}>
                            We've sent a 6-digit code to{'\n'}
                            <Text style={styles.emailText}>{email}</Text>
                        </Text>
                    </View>

                    <View style={styles.otpContainer}>
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => (inputRefs.current[index] = ref)}
                                style={styles.otpInput}
                                value={digit}
                                onChangeText={(value) => handleOtpChange(value, index)}
                                onKeyPress={(e) => handleKeyPress(e, index)}
                                keyboardType="number-pad"
                                maxLength={1}
                                selectTextOnFocus
                            />
                        ))}
                    </View>

                    <View style={styles.timerContainer}>
                        <Text style={styles.timerText}>
                            Code expires in: <Text style={styles.timerBold}>{formatTime(timer)}</Text>
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, isSubmitting && styles.buttonDisabled]}
                        onPress={handleVerify}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <Text style={styles.buttonText}>Verify Now</Text>
                                <CheckCircle2 size={20} color="#FFFFFF" />
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={styles.resendContainer}>
                        <Text style={styles.resendText}>Didn't receive the code? </Text>
                        <TouchableOpacity
                            onPress={handleResend}
                            disabled={isResending || timer > 240} // Allow resend after 1 min
                        >
                            {isResending ? (
                                <ActivityIndicator size="small" color="#667eea" />
                            ) : (
                                <View style={styles.resendAction}>
                                    <RefreshCcw size={14} color={timer > 240 ? '#ADB5BD' : '#667eea'} />
                                    <Text style={[styles.resendLink, timer > 240 && styles.resendDisabled]}>
                                        Resend Code
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
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
    backButton: {
        padding: 20,
    },
    content: {
        flex: 1,
        paddingHorizontal: 30,
        justifyContent: 'center',
    },
    header: {
        marginBottom: 40,
        alignItems: 'center',
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
        textAlign: 'center',
        lineHeight: 22,
    },
    emailText: {
        color: '#212529',
        fontWeight: 'bold',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    otpInput: {
        width: 45,
        height: 55,
        backgroundColor: '#F8F9FA',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E9ECEF',
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold',
        color: '#212529',
    },
    timerContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    timerText: {
        color: '#6c757d',
        fontSize: 14,
    },
    timerBold: {
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
    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 30,
    },
    resendText: {
        color: '#6c757d',
        fontSize: 15,
    },
    resendAction: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    resendLink: {
        color: '#667eea',
        fontSize: 15,
        fontWeight: 'bold',
        marginLeft: 5,
    },
    resendDisabled: {
        color: '#ADB5BD',
    },
});

export default EmailVerificationScreen;
