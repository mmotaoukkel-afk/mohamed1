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
    ScrollView,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuth } from "../../../src/context/AuthContext";
import {
    validateEmail,
    validatePassword,
    validateName,
    validatePasswordMatch,
    getPasswordStrength
} from "../../../src/utils/validation";
import { rateLimiters, sanitizeEmail, cleanInput } from "../../../src/utils/security";
import { handleError } from "../../../src/utils/errorHandler";

const RegisterScreen = () => {
    const router = useRouter();
    const { register } = useAuth();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [passwordStrength, setPasswordStrength] = useState({ strength: 0, label: '', color: '#ccc' });

    // Refs for input navigation
    const emailRef = useRef(null);
    const passwordRef = useRef(null);
    const confirmPasswordRef = useRef(null);

    // Validate all inputs
    const validateInputs = () => {
        const newErrors = {};

        const nameResult = validateName(name);
        if (!nameResult.isValid) {
            newErrors.name = nameResult.error;
        }

        const emailResult = validateEmail(email);
        if (!emailResult.isValid) {
            newErrors.email = emailResult.error;
        }

        const passwordResult = validatePassword(password);
        if (!passwordResult.isValid) {
            newErrors.password = passwordResult.error;
        }

        const matchResult = validatePasswordMatch(password, confirmPassword);
        if (!matchResult.isValid) {
            newErrors.confirmPassword = matchResult.error;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle password change with strength indicator
    const handlePasswordChange = (text) => {
        setPassword(text);
        setPasswordStrength(getPasswordStrength(text));
        if (errors.password) setErrors(prev => ({ ...prev, password: null }));
    };

    const handleRegister = async () => {
        // Check rate limiting
        if (!rateLimiters.register.isAllowed('register_attempt')) {
            const waitTime = Math.ceil(rateLimiters.register.getTimeUntilReset('register_attempt') / 1000);
            Alert.alert(
                "Too Many Attempts",
                `Please wait ${Math.ceil(waitTime / 60)} minutes before trying again.`
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
            const sanitizedName = cleanInput(name);
            const sanitizedEmail = sanitizeEmail(email);
            const cleanedPassword = cleanInput(password);

            const success = await register(sanitizedName, sanitizedEmail, cleanedPassword);

            if (success) {
                rateLimiters.register.reset('register_attempt');
                router.replace('/(tabs)');
            } else {
                Alert.alert(
                    "Registration Failed",
                    "Email is already in use. Please try a different email address."
                );
            }
        } catch (error) {
            handleError(error, {
                context: 'RegisterScreen',
                onValidationError: (err) => {
                    Alert.alert("Validation Error", err.message);
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
                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Back Button */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={28} color="#fff" />
                    </TouchableOpacity>

                    {/* Header */}
                    <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
                        <View style={styles.logoCircle}>
                            <Ionicons name="person-add" size={40} color="#f5576c" />
                        </View>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Join us and start your journey</Text>
                    </Animated.View>

                    {/* Form Container */}
                    <Animated.View entering={FadeInUp.duration(600).delay(200)} style={styles.formContainer}>
                        {/* Name Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name</Text>
                            <View style={[styles.inputWrapper, errors.name && styles.inputError]}>
                                <Ionicons name="person-outline" size={22} color="#fff" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={name}
                                    onChangeText={(text) => {
                                        setName(text);
                                        if (errors.name) setErrors(prev => ({ ...prev, name: null }));
                                    }}
                                    placeholder="Full Name"
                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                    returnKeyType="next"
                                    onSubmitEditing={() => emailRef.current?.focus()}
                                />
                            </View>
                            {errors.name && (
                                <Animated.Text entering={FadeInDown.duration(300)} style={styles.errorText}>
                                    {errors.name}
                                </Animated.Text>
                            )}
                        </View>

                        {/* Email Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                                <Ionicons name="mail-outline" size={22} color="#fff" style={styles.inputIcon} />
                                <TextInput
                                    ref={emailRef}
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
                                    onChangeText={handlePasswordChange}
                                    placeholder="••••••••"
                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                    secureTextEntry={!showPassword}
                                    returnKeyType="next"
                                    onSubmitEditing={() => confirmPasswordRef.current?.focus()}
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
                            {/* Password Strength Indicator */}
                            {password.length > 0 && (
                                <View style={styles.strengthContainer}>
                                    <View style={styles.strengthBar}>
                                        <Animated.View
                                            style={[
                                                styles.strengthFill,
                                                {
                                                    width: `${passwordStrength.strength}%`,
                                                    backgroundColor: passwordStrength.color
                                                }
                                            ]}
                                        />
                                    </View>
                                    <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                                        {passwordStrength.label}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Confirm Password Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Confirm Password</Text>
                            <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputError]}>
                                <Ionicons name="lock-closed-outline" size={22} color="#fff" style={styles.inputIcon} />
                                <TextInput
                                    ref={confirmPasswordRef}
                                    style={styles.input}
                                    value={confirmPassword}
                                    onChangeText={(text) => {
                                        setConfirmPassword(text);
                                        if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: null }));
                                    }}
                                    placeholder="••••••••"
                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                    secureTextEntry={!showConfirmPassword}
                                    returnKeyType="done"
                                    onSubmitEditing={handleRegister}
                                />
                                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    <Ionicons
                                        name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                                        size={22}
                                        color="#fff"
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.confirmPassword && (
                                <Animated.Text entering={FadeInDown.duration(300)} style={styles.errorText}>
                                    {errors.confirmPassword}
                                </Animated.Text>
                            )}
                        </View>

                        {/* Register Button */}
                        <TouchableOpacity
                            style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                            onPress={handleRegister}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#f5576c" />
                            ) : (
                                <Text style={styles.registerButtonText}>Sign Up</Text>
                            )}
                        </TouchableOpacity>

                        {/* Login Link */}
                        <View style={styles.loginContainer}>
                            <Text style={styles.loginText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => router.replace("/screens/auth/LoginScreen")}>
                                <Text style={styles.loginLink}>Sign In</Text>
                            </TouchableOpacity>
                        </View>
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
    backButton: {
        padding: 8,
        marginLeft: 16,
        marginTop: 10,
        alignSelf: 'flex-start',
    },
    header: {
        paddingTop: 20,
        paddingHorizontal: 24,
        alignItems: 'center',
        paddingBottom: 20,
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
    },
    formContainer: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 40,
    },
    inputGroup: {
        marginBottom: 16,
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
    inputError: {
        borderWidth: 1,
        borderColor: '#ff6b6b',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#fff',
    },
    errorText: {
        color: '#ff6b6b',
        fontSize: 12,
        marginTop: 6,
        marginLeft: 4,
    },
    strengthContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    strengthBar: {
        flex: 1,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        overflow: 'hidden',
        marginRight: 10,
    },
    strengthFill: {
        height: '100%',
        borderRadius: 2,
    },
    strengthLabel: {
        fontSize: 12,
        fontWeight: '600',
        minWidth: 50,
    },
    registerButton: {
        backgroundColor: '#fff',
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        marginBottom: 24,
    },
    registerButtonDisabled: {
        opacity: 0.7,
    },
    registerButtonText: {
        color: '#f5576c',
        fontSize: 18,
        fontWeight: '700',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
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
