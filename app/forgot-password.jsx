
import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Dimensions,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeInUp, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';
import { useTranslation } from '../src/hooks/useTranslation';

const { width, height } = Dimensions.get('window');

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { resetPassword, verifyResetCode, confirmNewPassword } = useAuth();
    const { t } = useTranslation();

    const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: Password, 4: Success
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState(null);

    // Step 1: Send Code
    const handleSendCode = async () => {
        if (!email.trim() || !email.includes('@')) {
            Alert.alert(t('error'), t('invalidEmail'));
            return;
        }
        setLoading(true);
        try {
            await resetPassword(email);
            setStep(2);
        } catch (error) {
            Alert.alert(t('error'), t('errorOccurred'));
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify Code
    const handleVerifyCode = async () => {
        if (code.length < 4) {
            Alert.alert(t('error'), t('invalidCode'));
            return;
        }
        setLoading(true);
        try {
            await verifyResetCode(email, code);
            setStep(3);
        } catch (error) {
            Alert.alert(t('error'), t('wrongCode'));
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Reset Password
    const handleResetPassword = async () => {
        if (newPassword.length < 6) {
            Alert.alert(t('error'), t('weakPassword'));
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert(t('error'), t('passwordMismatch'));
            return;
        }
        setLoading(true);
        try {
            await confirmNewPassword(email, newPassword);
            setStep(4);
        } catch (error) {
            Alert.alert(t('error'), t('resetFailed'));
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <Animated.View entering={FadeInDown} style={styles.stepContainer}>
                        <Text style={[styles.title, { color: theme.text }]}>{t('forgotPassword')}</Text>
                        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                            {t('enterEmailReset')}
                        </Text>
                        <View style={styles.inputBox}>
                            <View style={[styles.inputWrapper, focusedField === "email" && { borderColor: theme.primary, backgroundColor: theme.primary + "05" }]}>
                                <Ionicons name="mail-outline" size={20} color={focusedField === "email" ? theme.primary : theme.textMuted} />
                                <TextInput
                                    onFocus={() => setFocusedField("email")}
                                    onBlur={() => setFocusedField(null)}
                                    style={[styles.input, { color: theme.text }]}
                                    placeholder="style@kataraa.com"
                                    placeholderTextColor={theme.textMuted + "80"}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>
                        <ActionButton title={t('sendCode')} onPress={handleSendCode} loading={loading} theme={theme} />
                    </Animated.View>
                );
            case 2:
                return (
                    <Animated.View entering={SlideInRight} style={styles.stepContainer}>
                        <Text style={[styles.title, { color: theme.text }]}>{t('verifyCode')}</Text>
                        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                            {t('enterCodeSent', { email })}
                        </Text>
                        <View style={styles.inputBox}>
                            <View style={[styles.inputWrapper, focusedField === "code" && { borderColor: theme.primary, backgroundColor: theme.primary + "05" }]}>
                                <Ionicons name="keypad-outline" size={20} color={focusedField === "code" ? theme.primary : theme.textMuted} />
                                <TextInput
                                    onFocus={() => setFocusedField("code")}
                                    onBlur={() => setFocusedField(null)}
                                    style={[styles.input, { color: theme.text, fontSize: 24, paddingLeft: 10, letterSpacing: 4 }]}
                                    placeholder="0000"
                                    placeholderTextColor={theme.textMuted + "50"}
                                    value={code}
                                    onChangeText={(text) => setCode(text.replace(/[^0-9]/g, '').slice(0, 4))}
                                    keyboardType="number-pad"
                                    textAlign="center"
                                />
                            </View>
                        </View>
                        <ActionButton title={t('verify')} onPress={handleVerifyCode} loading={loading} theme={theme} />
                        <TouchableOpacity onPress={() => setStep(1)} style={styles.resendBtn}>
                            <Text style={[styles.resendText, { color: theme.textMuted }]}>{t('wrongEmail')}</Text>
                        </TouchableOpacity>
                    </Animated.View>
                );
            case 3:
                return (
                    <Animated.View entering={SlideInRight} style={styles.stepContainer}>
                        <Text style={[styles.title, { color: theme.text }]}>{t('resetPasswordTitle')}</Text>
                        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                            {t('createStrongPassword')}
                        </Text>

                        <View style={styles.inputBox}>
                            <View style={[styles.inputWrapper, focusedField === "newPass" && { borderColor: theme.primary, backgroundColor: theme.primary + "05" }]}>
                                <Ionicons name="lock-closed-outline" size={20} color={focusedField === "newPass" ? theme.primary : theme.textMuted} />
                                <TextInput
                                    onFocus={() => setFocusedField("newPass")}
                                    onBlur={() => setFocusedField(null)}
                                    style={[styles.input, { color: theme.text }]}
                                    placeholder={t('newPassword')}
                                    placeholderTextColor={theme.textMuted + "80"}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    secureTextEntry
                                />
                            </View>
                        </View>

                        <View style={styles.inputBox}>
                            <View style={[styles.inputWrapper, focusedField === "confirmPass" && { borderColor: theme.primary, backgroundColor: theme.primary + "05" }]}>
                                <Ionicons name="checkmark-circle-outline" size={20} color={focusedField === "confirmPass" ? theme.primary : theme.textMuted} />
                                <TextInput
                                    onFocus={() => setFocusedField("confirmPass")}
                                    onBlur={() => setFocusedField(null)}
                                    style={[styles.input, { color: theme.text }]}
                                    placeholder={t('confirmPassword')}
                                    placeholderTextColor={theme.textMuted + "80"}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                />
                            </View>
                        </View>
                        <ActionButton title={t('resetButton')} onPress={handleResetPassword} loading={loading} theme={theme} />
                    </Animated.View>
                );
            case 4:
                return (
                    <Animated.View entering={FadeInUp} style={styles.successView}>
                        <LinearGradient colors={[theme.success, theme.primary]} style={styles.successIconCircle}>
                            <Ionicons name="checkmark" size={40} color="#FFF" />
                        </LinearGradient>
                        <Text style={[styles.title, { color: theme.text, marginTop: 20 }]}>{t('success')}</Text>
                        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                            {t('passwordResetSuccess')}
                        </Text>
                        <TouchableOpacity
                            style={[styles.submitBtn, { backgroundColor: theme.primary, marginTop: 20, width: '100%' }]}
                            onPress={() => router.back()}
                        >
                            <LinearGradient
                                colors={[theme.primary, theme.primaryDark]}
                                style={styles.submitGradient}
                            >
                                <Text style={styles.submitText}>{t('loginNow')}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                );
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? "#0A0A12" : "#F8F8FF" }]}>
            <View style={[styles.bgGlow1, { backgroundColor: theme.primary + "20" }]} />
            <View style={[styles.bgGlow2, { backgroundColor: theme.accent + "15" }]} />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={styles.backBtnBlur}>
                            <Ionicons name="arrow-back" size={24} color={theme.text} />
                        </BlurView>
                    </TouchableOpacity>
                </View>

                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                    <View style={styles.content}>
                        <Animated.View entering={FadeInDown.duration(800)} style={styles.stepWrapper}>
                            <BlurView intensity={isDark ? 25 : 60} tint={isDark ? "dark" : "light"} style={styles.glassCard}>
                                {renderStepContent()}
                            </BlurView>
                        </Animated.View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const ActionButton = ({ title, onPress, loading, theme }) => (
    <TouchableOpacity style={styles.submitBtn} onPress={onPress} disabled={loading}>
        <LinearGradient
            colors={[theme.primary, theme.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.submitGradient}
        >
            {loading ? (
                <ActivityIndicator color="#FFF" />
            ) : (
                <Text style={styles.submitText}>{title}</Text>
            )}
        </LinearGradient>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { flex: 1 },
    bgGlow1: { position: "absolute", top: -100, left: -100, width: 400, height: 400, borderRadius: 200, zIndex: -1 },
    bgGlow2: { position: "absolute", bottom: -100, right: -100, width: 350, height: 350, borderRadius: 175, zIndex: -1 },
    safeArea: { flex: 1 },
    header: { paddingHorizontal: 20, paddingTop: 10 },
    backBtn: { width: 50, height: 50, borderRadius: 25, overflow: "hidden", elevation: 5 },
    backBtnBlur: { flex: 1, justifyContent: "center", alignItems: "center" },
    content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
    stepWrapper: { width: '100%' },
    stepContainer: { width: '100%' },
    glassCard: { padding: 32, borderRadius: 32, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", overflow: "hidden" },
    title: { fontSize: 24, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
    subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 32, opacity: 0.8 },
    inputBox: { marginBottom: 24 },
    inputWrapper: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, height: 56, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.08)", gap: 12 },
    input: { flex: 1, fontSize: 16, fontWeight: "600" },
    submitBtn: { height: 56, borderRadius: 18, overflow: "hidden", elevation: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 15 },
    submitGradient: { flex: 1, justifyContent: "center", alignItems: "center" },
    submitText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
    successView: { alignItems: 'center', width: '100%' },
    successIconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', elevation: 10 },
    resendBtn: { marginTop: 20, alignItems: 'center' },
    resendText: { fontWeight: '600' }
});
