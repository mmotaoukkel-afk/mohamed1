import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    ActivityIndicator,
    Alert,
    ImageBackground
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';
import { BlurView } from "expo-blur";
import Animated, {
    FadeInDown,
    FadeInUp,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

import { useTranslation } from "../src/hooks/useTranslation";

import { findUserByEmail } from "../src/services/userService";

export default function AuthScreen() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { login, signup, signInWithGoogle } = useAuth();
    const { t } = useTranslation();

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState(null);
    const [focusedField, setFocusedField] = useState(null);

    const handleSubmit = async () => {
        if (!email || !password || (!isLogin && (!name || !phone))) {
            Alert.alert(t('error'), t('fillAllFields'));
            return;
        }

        setLoading(true);
        try {
            const normalizedEmail = email.trim().toLowerCase();

            // Check if user already exists in Firestore by email
            const existingUser = await findUserByEmail(normalizedEmail);

            const userData = existingUser ? {
                ...existingUser,
                // Ensure we have properties needed by AuthContext
                email: normalizedEmail,
                uid: existingUser.uid || existingUser.id,
            } : {
                email: normalizedEmail,
                displayName: name || email.split("@")[0],
                phone: phone,
                photoURL: null,
                id: Date.now().toString(),
                uid: `local_${Date.now().toString()}`,
            };

            if (isLogin) {
                const role = await login(userData);
                if (role === 'admin') {
                    router.replace('/admin/overview');
                } else {
                    router.back();
                }
            } else {
                await signup(userData);
                router.back();
            }
        } catch (e) {
            console.error(e);
            Alert.alert(t('error'), t('errorOccurred'));
        } finally {
            setLoading(false);
        }
    };


    const handleSocialLogin = async (provider) => {
        setSocialLoading(provider);
        try {
            if (provider === 'Google') {
                await signInWithGoogle();
                router.replace('/');
            }
        } catch (error) {
            console.error(`${provider} Login Error:`, error);
            Alert.alert(t('error'), t('errorOccurred'));
        } finally {
            if (provider === 'Google') setSocialLoading(null);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? "#0A0A12" : "#F8F8FF" }]}>
            {/* Elegant Background Elements */}
            <LinearGradient
                colors={isDark ? [theme.primary + '15', 'transparent'] : [theme.primary + '10', 'transparent']}
                style={styles.topGradient}
            />
            <View style={[styles.bgOrb1, { backgroundColor: theme.primary + "10" }]} />
            <View style={[styles.bgOrb2, { backgroundColor: theme.accent + "08" }]} />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
                        style={styles.backBtn}
                    >
                        <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={styles.backBtnBlur}>
                            <Ionicons name="arrow-back" size={24} color={theme.text} />
                        </BlurView>
                    </TouchableOpacity>
                </View>

                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                        {/* Brand Section */}
                        <Animated.View entering={FadeInDown.duration(800)} style={styles.brandSection}>
                            <Text style={[styles.welcomeText, { color: theme.textMuted }]}>
                                {isLogin ? t('taglineLogin') : t('taglineRegister')}
                            </Text>
                            <Text style={[styles.brandTitle, { color: theme.text }]}>
                                {isLogin ? t('signIn') : t('createAccount')}
                            </Text>
                            <View style={[styles.titleUnderline, { backgroundColor: theme.primary }]} />
                        </Animated.View>

                        {/* Form Section */}
                        <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.formContainer}>

                            {!isLogin && (
                                <View style={styles.inputGroup}>
                                    <View style={[styles.inputWrapper, focusedField === "name" && { borderColor: theme.primary, backgroundColor: theme.primary + "05" }]}>
                                        <Ionicons name="person-outline" size={20} color={focusedField === "name" ? theme.primary : theme.textMuted} />
                                        <TextInput
                                            onFocus={() => setFocusedField("name")}
                                            onBlur={() => setFocusedField(null)}
                                            style={[styles.input, { color: theme.text }]}
                                            placeholder={t('placeholderName')}
                                            placeholderTextColor={theme.textMuted}
                                            value={name}
                                            onChangeText={setName}
                                        />
                                    </View>
                                </View>
                            )}

                            <View style={styles.inputGroup}>
                                <View style={[styles.inputWrapper, focusedField === "email" && { borderColor: theme.primary, backgroundColor: theme.primary + "05" }]}>
                                    <Ionicons name="mail-outline" size={20} color={focusedField === "email" ? theme.primary : theme.textMuted} />
                                    <TextInput
                                        onFocus={() => setFocusedField("email")}
                                        onBlur={() => setFocusedField(null)}
                                        style={[styles.input, { color: theme.text }]}
                                        placeholder={t('placeholderEmail')}
                                        placeholderTextColor={theme.textMuted}
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            {!isLogin && (
                                <View style={styles.inputGroup}>
                                    <View style={[styles.inputWrapper, focusedField === "phone" && { borderColor: theme.primary, backgroundColor: theme.primary + "05" }]}>
                                        <Ionicons name="call-outline" size={20} color={focusedField === "phone" ? theme.primary : theme.textMuted} />
                                        <TextInput
                                            onFocus={() => setFocusedField("phone")}
                                            onBlur={() => setFocusedField(null)}
                                            style={[styles.input, { color: theme.text }]}
                                            placeholder={t('placeholderPhone')}
                                            placeholderTextColor={theme.textMuted}
                                            value={phone}
                                            onChangeText={setPhone}
                                            keyboardType="phone-pad"
                                        />
                                    </View>
                                </View>
                            )}

                            <View style={styles.inputGroup}>
                                <View style={[styles.inputWrapper, focusedField === "pass" && { borderColor: theme.primary, backgroundColor: theme.primary + "05" }]}>
                                    <Ionicons name="lock-closed-outline" size={20} color={focusedField === "pass" ? theme.primary : theme.textMuted} />
                                    <TextInput
                                        onFocus={() => setFocusedField("pass")}
                                        onBlur={() => setFocusedField(null)}
                                        style={[styles.input, { color: theme.text }]}
                                        placeholder={t('placeholderPass')}
                                        placeholderTextColor={theme.textMuted}
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                    />
                                </View>
                            </View>

                            {isLogin && (
                                <TouchableOpacity style={styles.forgotBtn} onPress={() => router.push('/forgot-password')}>
                                    <Text style={[styles.forgotText, { color: theme.textMuted }]}>{t('forgotPassword')}</Text>
                                </TouchableOpacity>
                            )}

                            {/* Main Button */}
                            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
                                <LinearGradient
                                    colors={[theme.primary, theme.primaryDark]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.submitGradient}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <Text style={styles.submitText}>{isLogin ? t('signIn') : t('createAccount')}</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Divider */}
                            <View style={styles.dividerBox}>
                                <View style={[styles.line, { backgroundColor: theme.border }]} />
                                <Text style={[styles.orText, { color: theme.textMuted }]}>{t('orContinue')}</Text>
                                <View style={[styles.line, { backgroundColor: theme.border }]} />
                            </View>

                            {/* Google Sign In - Prominent & Full Width */}
                            <TouchableOpacity
                                style={[styles.googleBtn, { backgroundColor: isDark ? "#1A1A2E" : "#FFF", borderColor: theme.border }]}
                                onPress={() => handleSocialLogin('Google')}
                                disabled={socialLoading !== null}
                            >
                                {socialLoading === 'Google' ? (
                                    <ActivityIndicator size="small" color={theme.primary} />
                                ) : (
                                    <>
                                        <ImageBackground
                                            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/300/300221.png' }}
                                            style={styles.googleIcon}
                                            resizeMode="contain"
                                        />
                                        <Text style={[styles.googleText, { color: theme.text }]}>
                                            {t('signIn')} with Google
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            {/* Toggle Sign In / Sign Up */}
                            <View style={styles.footerSwitch}>
                                <Text style={[styles.switchText, { color: theme.textMuted }]}>
                                    {isLogin ? t('noAccount') : t('hasAccount')}
                                </Text>
                                <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                                    <Text style={[styles.switchLink, { color: theme.primary }]}>
                                        {isLogin ? t('joinNow') : t('loginLink')}
                                    </Text>
                                </TouchableOpacity>
                            </View>



                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 300 },
    bgOrb1: { position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: 150 },
    bgOrb2: { position: "absolute", bottom: 100, left: -60, width: 200, height: 200, borderRadius: 100 },

    safeArea: { flex: 1 },
    header: { paddingHorizontal: 24, paddingTop: 10 },
    backBtn: { width: 44, height: 44, borderRadius: 14, overflow: 'hidden' },
    backBtnBlur: { flex: 1, justifyContent: "center", alignItems: "center" },

    scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },

    brandSection: { marginTop: 40, marginBottom: 40 },
    welcomeText: { fontSize: 13, fontWeight: "600", letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 },
    brandTitle: { fontSize: 34, fontWeight: "800", letterSpacing: 0.5 },
    titleUnderline: { width: 40, height: 4, borderRadius: 2, marginTop: 10 },

    formContainer: {},
    inputGroup: { marginBottom: 16 },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        height: 56,
        borderRadius: 16,
        backgroundColor: "rgba(150,150,150,0.08)",
        borderWidth: 1,
        borderColor: "transparent",
        paddingHorizontal: 16,
        gap: 12
    },
    input: { flex: 1, fontSize: 15, fontWeight: "500", height: '100%', textAlign: 'left' },

    forgotBtn: { alignSelf: "flex-end", marginBottom: 24 },
    forgotText: { fontSize: 13, fontWeight: "600" },

    submitBtn: { height: 56, borderRadius: 16, overflow: 'hidden', elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
    submitGradient: { flex: 1, justifyContent: "center", alignItems: "center" },
    submitText: { color: "#FFF", fontSize: 16, fontWeight: "700" },

    dividerBox: { flexDirection: 'row', alignItems: 'center', marginVertical: 32 },
    line: { flex: 1, height: 1 },
    orText: { marginHorizontal: 16, fontSize: 12, fontWeight: "600", letterSpacing: 1 },

    googleBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        height: 56,
        borderRadius: 16,
        borderWidth: 1,
        gap: 12,
        marginBottom: 32
    },
    googleIcon: { width: 24, height: 24 },
    googleText: { fontSize: 15, fontWeight: "600" },

    footerSwitch: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
    switchText: { fontSize: 14 },
    switchLink: { fontSize: 14, fontWeight: "700" }
});
