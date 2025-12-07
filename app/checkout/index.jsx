import { View, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from "expo-router";
import { TouchableOpacity, Text } from "react-native";
import Feather from '@expo/vector-icons/Feather';
import { useCart } from "../../src/context/CardContext";

export default function Checkout() {
    const router = useRouter();
    const { clearCart } = useCart();

    // رابط Checkout ديال WooCommerce
    const checkoutUrl = "https://kataraa.com/checkout/";

    const handleNavigationChange = (navState) => {
        // إذا وصل لصفحة شكراً (Order Complete)
        if (navState.url.includes('order-received') || navState.url.includes('thank-you')) {
            clearCart();
            alert("تم الطلب بنجاح! ✅");
            router.push("/(tabs)");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Feather name="arrow-right" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>إتمام الطلب</Text>
                <View style={{ width: 44 }} />
            </View>

            {/* WebView */}
            <WebView
                source={{ uri: checkoutUrl }}
                style={styles.webview}
                onNavigationStateChange={handleNavigationChange}
                startInLoadingState={true}
                renderLoading={() => (
                    <View style={styles.loading}>
                        <ActivityIndicator size="large" color="#667eea" />
                        <Text style={styles.loadingText}>جاري التحميل...</Text>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 16, 
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    backButton: { 
        width: 44, 
        height: 44, 
        borderRadius: 22, 
        backgroundColor: '#f5f5f5', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
    webview: { flex: 1 },
    loading: { 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#fff'
    },
    loadingText: { marginTop: 16, fontSize: 16, color: '#666' },
});
