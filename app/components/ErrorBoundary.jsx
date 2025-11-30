import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Error Boundary Component
 * Catches JavaScript errors in child components and displays a fallback UI
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error to console or error reporting service
        console.error('Error caught by ErrorBoundary:', error, errorInfo);
        this.setState({
            error,
            errorInfo,
        });
    }

    resetError = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <View style={styles.content}>
                        <Ionicons name="alert-circle" size={80} color="#EF4444" />

                        <Text style={styles.title}>Oops! Something went wrong</Text>
                        <Text style={styles.subtitle}>
                            We're sorry for the inconvenience. The app encountered an unexpected error.
                        </Text>

                        {__DEV__ && this.state.error && (
                            <ScrollView style={styles.errorDetails}>
                                <Text style={styles.errorTitle}>Error Details:</Text>
                                <Text style={styles.errorText}>{this.state.error.toString()}</Text>
                                {this.state.errorInfo && (
                                    <Text style={styles.errorStack}>
                                        {this.state.errorInfo.componentStack}
                                    </Text>
                                )}
                            </ScrollView>
                        )}

                        <TouchableOpacity
                            style={styles.button}
                            onPress={this.resetError}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="refresh" size={20} color="#FFFFFF" />
                            <Text style={styles.buttonText}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        alignItems: 'center',
        maxWidth: 400,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#0F172A',
        marginTop: 20,
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 24,
    },
    errorDetails: {
        backgroundColor: '#FEE2E2',
        borderRadius: 12,
        padding: 16,
        marginVertical: 20,
        maxHeight: 200,
        width: '100%',
    },
    errorTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#EF4444',
        marginBottom: 8,
    },
    errorText: {
        fontSize: 12,
        color: '#DC2626',
        fontFamily: 'monospace',
        marginBottom: 8,
    },
    errorStack: {
        fontSize: 10,
        color: '#991B1B',
        fontFamily: 'monospace',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6366F1',
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 12,
        gap: 8,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ErrorBoundary;
