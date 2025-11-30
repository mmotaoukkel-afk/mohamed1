import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ScrollView,
    Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    FadeInDown,
    FadeInUp,
} from "react-native-reanimated";
import { useAuth } from "../../../src/context/AuthContext";
import { useTheme } from "../../../src/context/ThemeContext";
import { sendWelcomeNotification } from "../../../src/utils/notifications";

const { width, height } = Dimensions.get("window");

const RegisterScreen = () => {
    const router = useRouter();
    const { register } = useAuth();
    const { colors } = useTheme();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [focusedInput, setFocusedInput] = useState(null);

    const handleRegister = async () => {
        if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert("Error", "Passwords do not match");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert("Error", "Please enter a valid email address");
            return;
        }

        if (password.length < 6) {
            Alert.alert("Error", "Password must be at least 6 characters long");
            return;
        }

        setLoading(true);
        try {
            const success = await register(name.trim(), email.trim(), password);
            if (success) {
                await sendWelcomeNotification(name.trim());
                Alert.alert(
                    "Success! 🎉",
                    "Your account has been created successfully",
                    [
                        {
                            text: "Sign In",
                            onPress: () => router.replace("/screens/auth/LoginScreen")
                        }
                    ]
                );
            } else {
                Alert.alert("Registration Failed", "Email is already in use");
            }
        } catch (error) {
            Alert.alert("Error", "An error occurred during registration");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#f093fb', '#f5576c', '#4facfe']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Header with Back Button */}
                    <Animated.View
                        entering={FadeInDown.delay(100).springify()}
                        style={styles.header}
                    >
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.replace("/screens/auth/LoginScreen")}
                        >
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>

                        <View style={styles.logoContainer}>
                            <LinearGradient
                                colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.6)']}
                                style={styles.logoCircle}
                            >
                                <Ionicons name="person-add" size={40} color="#f5576c" />
                            </LinearGradient>
                        </View>

                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Join us and start your journey</Text>
                    </Animated.View>

                    {/* Form Container */}
                    <Animated.View
                        entering={FadeInUp.delay(300).springify()}
                        style={styles.formContainer}
                    >
                        {/* Name Input */}
                        <Animated.View
                            entering={FadeInDown.delay(400).springify()}
                            style={styles.inputGroup}
                        >
                            <Text style={styles.label}>Full Name</Text>
                            <View style={[
                                styles.inputWrapper,
                                focusedInput === 'name' && styles.inputFocused
                            ]}>
                                <Ionicons name="person-outline" size={22} color="#fff" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Full Name"
                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                    onFocus={() => setFocusedInput('name')}
                                    onBlur={() => setFocusedInput(null)}
                                />
                            </View>
                        </Animated.View>

                        {/* Email Input */}
                        <Animated.View
                            entering={FadeInDown.delay(500).springify()}
                            style={styles.inputGroup}
                        >
                            <Text style={styles.label}>Email</Text>
                            <View style={[
                                styles.inputWrapper,
                                focusedInput === 'email' && styles.inputFocused
                            ]}>
                                <Ionicons name="mail-outline" size={22} color="#fff" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="your.email@example.com"
                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    onFocus={() => setFocusedInput('email')}
                                    onBlur={() => setFocusedInput(null)}
                                />
                            </View>
                        </Animated.View>

                        {/* Password Input */}
                        <Animated.View
                            entering={FadeInDown.delay(600).springify()}
                            style={styles.inputGroup}
                        >
                            <Text style={styles.label}>Password</Text>
                            <View style={[
                                styles.inputWrapper,
                                focusedInput === 'password' && styles.inputFocused
                            ]}>
                                <Ionicons name="lock-closed-outline" size={22} color="#fff" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="••••••••"
                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                    secureTextEntry={!showPassword}
                                    onFocus={() => setFocusedInput('password')}
                                    onBlur={() => setFocusedInput(null)}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.eyeButton}
                                >
                                    <Ionicons
                                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                                        size={22}
                                        color="#fff"
                                    />
                                </TouchableOpacity>
                            </View>
                        </Animated.View>

                        {/* Confirm Password Input */}
                        <Animated.View
                            entering={FadeInDown.delay(700).springify()}
                            style={styles.inputGroup}
                        >
                            <Text style={styles.label}>Confirm Password</Text>
                            <View style={[
                                styles.inputWrapper,
                                focusedInput === 'confirmPassword' && styles.inputFocused
                            ]}>
                                <Ionicons name="lock-closed-outline" size={22} color="#fff" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    placeholder="••••••••"
                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                    secureTextEntry={!showConfirmPassword}
                                    onFocus={() => setFocusedInput('confirmPassword')}
                                    onBlur={() => setFocusedInput(null)}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={styles.eyeButton}
                                >
                                    <Ionicons
                                        name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                                        size={22}
                                        color="#fff"
                                    />
                                </TouchableOpacity>
                            </View>
                        </Animated.View>

                        {/* Terms & Conditions */}
                        <Animated.View
                            entering={FadeInDown.delay(800).springify()}
                            style={styles.termsContainer}
                        >
                            <Text style={styles.termsText}>
                                By creating an account, you agree to our{" "}
                                <Text style={styles.termsLink}>Terms & Conditions</Text>
                            </Text>
                        </Animated.View>

                        {/* Register Button */}
                        <Animated.View entering={FadeInUp.delay(900).springify()}>
                            <TouchableOpacity
                                style={styles.registerButton}
                                onPress={handleRegister}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={['#fff', 'rgba(255,255,255,0.9)']}
                                    style={styles.registerGradient}
                                >
                                    {loading ? (
                                        <Text style={styles.registerButtonText}>Creating Account...</Text>
                                    ) : (
                                        <>
                                            <Text style={styles.registerButtonText}>Sign Up</Text>
                                            <Ionicons name="checkmark-circle" size={20} color="#f5576c" />
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Divider */}
                        <Animated.View
                            entering={FadeInDown.delay(1000).springify()}
                            style={styles.divider}
                        >
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>OR</Text>
                            <View style={styles.dividerLine} />
                        </Animated.View>

                        {/* Social Register Buttons */}
                        <Animated.View
                            entering={FadeInUp.delay(1100).springify()}
                            style={styles.socialContainer}
                        >
                            <TouchableOpacity style={styles.socialButton}>
                                <Ionicons name="logo-google" size={24} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialButton}>
                                <Ionicons name="logo-apple" size={24} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialButton}>
                                <Ionicons name="logo-facebook" size={24} color="#fff" />
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Login Link */}
                        <Animated.View
                            entering={FadeInDown.delay(1200).springify()}
                            style={styles.loginContainer}
                        >
                            <Text style={styles.loginText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => router.replace("/screens/auth/LoginScreen")}>
                                <Text style={styles.loginLink}>Sign In</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    floatingCircle: {
        position: 'absolute',
        borderRadius: 1000,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    circle1: {
        width: 300,
        height: 300,
        top: -100,
        right: -100,
    },
    circle2: {
        width: 200,
        height: 200,
        bottom: 100,
        left: -50,
    },
    header: {
        paddingTop: 20,
        paddingHorizontal: 24,
        alignItems: 'center',
        paddingBottom: 20,
    },
    backButton: {
        alignSelf: 'flex-start',
        padding: 8,
        marginBottom: 20,
    },
    logoContainer: {
        marginBottom: 24,
    },
    logoCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
    },
    formContainer: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 40,
        backdropFilter: 'blur(10px)',
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    inputFocused: {
        borderColor: 'rgba(255,255,255,0.5)',
        backgroundColor: 'rgba(255,255,255,0.25)',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#fff',
        textAlign: 'left',
    },
    eyeButton: {
        padding: 4,
    },
    termsContainer: {
        marginTop: 8,
        marginBottom: 24,
    },
    termsText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
    },
    termsLink: {
        color: '#fff',
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
    registerButton: {
        marginBottom: 24,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    registerGradient: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    registerButtonText: {
        color: '#f5576c',
        fontSize: 18,
        fontWeight: '700',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    dividerText: {
        color: 'rgba(255,255,255,0.7)',
        paddingHorizontal: 16,
        fontSize: 14,
    },
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginBottom: 24,
    },
    socialButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
    },
    loginLink: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
});

export default RegisterScreen;
