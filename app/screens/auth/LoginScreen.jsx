import React, { useState, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuth } from "../../../src/context/AuthContext";
import { validateEmail, validatePassword } from "../../../src/utils/validation";
import { rateLimiters, sanitizeEmail, cleanInput } from "../../../src/utils/security";
import { handleError, ERROR_TYPES } from "../../../src/utils/errorHandler";

const LoginScreen = () => {
    const router = useRouter();
    const { login, clearAllUsers } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [loginAttempts, setLoginAttempts] = useState(0);

    const passwordRef = useRef(null);

    // Validate inputs before submission
    const validateInputs = () => {
        const newErrors = {};

        const emailResult = validateEmail(email);
        if (!emailResult.isValid) {
            newErrors.email = emailResult.error;
        }

        const passwordResult = validatePassword(password);
        if (!passwordResult.isValid) {
            newErrors.password = passwordResult.error;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        // Check rate limiting
        if (!rateLimiters.login.isAllowed('login_attempt')) {
            const waitTime = Math.ceil(rateLimiters.login.getTimeUntilReset('login_attempt') / 1000);
            Alert.alert(
                "Too Many Attempts",
                `Please wait ${waitTime} seconds before trying again.`
            );
            return;
        }

        // Validate inputs
        if (!validateInputs()) {
            return;
        }

        setLoading(true);
        try {
            // Sanitize inputs
            const sanitizedEmail = sanitizeEmail(email);
            const cleanedPassword = cleanInput(password);

            const success = await login(sanitizedEmail, cleanedPassword);

            if (success) {
                // Reset rate limiter on successful login
                rateLimiters.login.reset('login_attempt');
                setLoginAttempts(0);
                router.replace('/(tabs)');
            } else {
                setLoginAttempts(prev => prev + 1);

                if (loginAttempts >= 2) {
                    Alert.alert(
                        "Login Failed",
                        "Invalid email or password. If you have an old account, you may need to reset and create a new one.",
                        [
                            { text: "OK", style: "cancel" },
                            {
                                text: "Reset & Create New",
                                style: "destructive",
                                onPress: handleResetData
                            }
                        ]
                    );
                } else {
                    Alert.alert(
                        "Login Failed",
                        `Invalid email or password. ${3 - loginAttempts - 1} attempts remaining.`
                    );
                }
            }
        } catch (error) {
            handleError(error, {
                context: 'LoginScreen',
                onAuthError: () => {
                    Alert.alert("Authentication Error", "Please check your credentials and try again.");
                },
                onNetworkError: () => {
                    Alert.alert("Connection Error", "Please check your internet connection.");
                },
                onError: () => {
                    Alert.alert("Error", "An unexpected error occurred. Please try again.");
                }
            });
        } finally {
            setLoading(false);
        }
    };

    const handleResetData = async () => {
        Alert.alert(
            "Reset All Data",
            "This will delete all accounts. You'll need to create a new account. Continue?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reset",
                    style: "destructive",
                    onPress: async () => {
                        await clearAllUsers();
                        Alert.alert("Success", "Data cleared. Please create a new account.");
                        router.replace("/screens/auth/RegisterScreen");
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#667eea', '#764ba2', '#f093fb']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                {/* Back Button */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoCircle}>
                        <Ionicons name="storefront" size={50} color="#667eea" />
                    </View>
                    <Text style={styles.title}>Welcome Back!</Text>
                    <Text style={styles.subtitle}>Sign in to continue</Text>
                </View>

                {/* Form Container */}
                <Animated.View entering={FadeInUp.duration(600).delay(200)} style={styles.formContainer}>
                    {/* Email Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                            <Ionicons name="mail-outline" size={22} color="#fff" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={(text) => {
                                    setEmail(text);
                                    if (errors.email) setErrors(prev => ({ ...prev, email: null }));
                                }}
                                placeholder="your.email@example.com"
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                returnKeyType="next"
                                onSubmitEditing={() => passwordRef.current?.focus()}
                            />
                        </View>
                        {errors.email && (
                            <Animated.Text entering={FadeInDown.duration(300)} style={styles.errorText}>
                                {errors.email}
                            </Animated.Text>
                        )}
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                            <Ionicons name="lock-closed-outline" size={22} color="#fff" style={styles.inputIcon} />
                            <TextInput
                                ref={passwordRef}
                                style={styles.input}
                                value={password}
                                onChangeText={(text) => {
                                    setPassword(text);
                                    if (errors.password) setErrors(prev => ({ ...prev, password: null }));
                                }}
                                placeholder="••••••••"
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                secureTextEntry={!showPassword}
                                returnKeyType="done"
                                onSubmitEditing={handleLogin}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons
                                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                                    size={22}
                                    color="#fff"
                                />
                            </TouchableOpacity>
                        </View>
                        {errors.password && (
                            <Animated.Text entering={FadeInDown.duration(300)} style={styles.errorText}>
                                {errors.password}
                            </Animated.Text>
                        )}
                    </View>

                    {/* Login Button */}
                    <TouchableOpacity
                        style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#667eea" />
                        ) : (
                            <Text style={styles.loginButtonText}>Sign In</Text>
                        )}
                    </TouchableOpacity>

                    {/* Register Link */}
                    <View style={styles.registerContainer}>
                        <Text style={styles.registerText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => router.replace("/screens/auth/RegisterScreen")}>
                            <Text style={styles.registerLink}>Create new account</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
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
    backButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 10,
        padding: 8,
    },
    header: {
        paddingTop: 80,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    logoCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 40,
    },
    formContainer: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        paddingHorizontal: 24,
        paddingTop: 40,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#fff',
    },
    loginButton: {
        backgroundColor: '#fff',
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        marginBottom: 24,
    },
    loginButtonText: {
        color: '#667eea',
        fontSize: 18,
        fontWeight: '700',
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    registerText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
    },
    registerLink: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
    inputError: {
        borderWidth: 1,
        borderColor: '#ff6b6b',
    },
    errorText: {
        color: '#ff6b6b',
        fontSize: 12,
        marginTop: 6,
        marginLeft: 4,
    },
    loginButtonDisabled: {
        opacity: 0.7,
    },
});

export default LoginScreen;
