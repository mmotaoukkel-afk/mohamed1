import { Text, View, ScrollView, TouchableOpacity, StyleSheet, Image, Dimensions, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import Feather from '@expo/vector-icons/Feather';
import PremiumBackground from "../components/PremiumBackground";
import { useCart } from "../../src/context/CardContext";
import { useFavorites } from "../../src/context/FavoritesContext";
import api from "../services/api";

const { width } = Dimensions.get('window');

export default function ProductDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { addToCart } = useCart();
    const { toggleFavorite, isFavorite } = useFavorites();

    const [product, setProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        try {
            setIsLoading(true);
            const data = await api.getProduct(id);
            setProduct(data);
        } catch (err) {
            console.error("Error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddToCart = () => {
        if (product) {
            addToCart({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.images?.[0]?.src,
                quantity: quantity
            });
            alert("تمت الإضافة للسلة ✅");
        }
    };

    const handleFavorite = () => {
        if (product) {
            toggleFavorite({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.images?.[0]?.src
            });
        }
    };

    if (isLoading) {
        return (
            <PremiumBackground>
                <SafeAreaView style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.loadingText}>جاري التحميل...</Text>
                </SafeAreaView>
            </PremiumBackground>
        );
    }

    if (!product) {
        return (
            <PremiumBackground>
                <SafeAreaView style={styles.loadingContainer}>
                    <Text style={styles.errorText}>المنتج غير موجود</Text>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Text style={styles.backButtonText}>رجوع</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </PremiumBackground>
        );
    }

    return (
        <PremiumBackground>
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
                        <Feather name="arrow-right" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>تفاصيل المنتج</Text>
                    <TouchableOpacity style={styles.headerButton} onPress={handleFavorite}>
                        <Feather name="heart" size={24} color={isFavorite(product.id) ? "#ff4757" : "#fff"} />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.imageContainer}>
                        <Image 
                            source={{ uri: product.images?.[0]?.src || "https://via.placeholder.com/300" }} 
                            style={styles.productImage}
                            resizeMode="cover"
                        />
                    </View>

                    <View style={styles.infoContainer}>
                        <Text style={styles.productName}>{product.name}</Text>
                        <Text style={styles.productPrice}>{product.price} د.ك</Text>
                        
                        <View style={styles.descriptionContainer}>
                            <Text style={styles.sectionTitle}>الوصف</Text>
                            <Text style={styles.description}>
                                {product.description?.replace(/<[^>]*>/g, '') || "لا يوجد وصف"}
                            </Text>
                        </View>

                        <View style={styles.quantityContainer}>
                            <Text style={styles.sectionTitle}>الكمية</Text>
                            <View style={styles.quantityButtons}>
                                <TouchableOpacity 
                                    style={styles.qtyButton} 
                                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                                >
                                    <Feather name="minus" size={20} color="#fff" />
                                </TouchableOpacity>
                                <Text style={styles.qtyText}>{quantity}</Text>
                                <TouchableOpacity 
                                    style={styles.qtyButton} 
                                    onPress={() => setQuantity(quantity + 1)}
                                >
                                    <Feather name="plus" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.buyNowButton} onPress={() => { addToCart({ id: product.id, name: product.name, price: product.price, image: product.images?.[0]?.src, quantity: quantity }); router.push("/(tabs)/Basket"); }}>
                        <Text style={styles.buyNowText}>اشتر الآن</Text>
                    </TouchableOpacity>
                    <View style={styles.totalContainer}>
                        <Text style={styles.totalLabel}>الإجمالي</Text>
                        <Text style={styles.totalPrice}>{(product.price * quantity).toFixed(2)} د.ك</Text>
                    </View>
                    <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
                        <Feather name="shopping-cart" size={20} color="#667eea" />
                        <Text style={styles.addToCartText}>أضف للسلة</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </PremiumBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: '#fff', marginTop: 16, fontSize: 16 },
    errorText: { color: '#fff', fontSize: 18, marginBottom: 16 },
    backButton: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25 },
    backButtonText: { color: '#fff', fontWeight: '600' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    headerButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
    imageContainer: { width: width, height: width * 0.8, backgroundColor: 'rgba(255,255,255,0.1)' },
    productImage: { width: '100%', height: '100%' },
    infoContainer: { padding: 20 },
    productName: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 8, textAlign: 'right' },
    productPrice: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 20 },
    descriptionContainer: { marginBottom: 20 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 8, textAlign: 'right' },
    description: { fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 22, textAlign: 'right' },
    quantityContainer: { marginBottom: 20 },
    quantityButtons: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    qtyButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    qtyText: { fontSize: 20, fontWeight: '700', color: '#fff', minWidth: 40, textAlign: 'center' },
    footer: { flexDirection: 'row', padding: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', gap: 16 },
    totalContainer: { flex: 1 },
    totalLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
    totalPrice: { fontSize: 20, fontWeight: '800', color: '#fff' },
    addToCartButton: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 25, alignItems: 'center', gap: 8 },
    addToCartText: { fontSize: 16, fontWeight: '700', color: '#667eea' },
    buyNowButton: { backgroundColor: '#667eea', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 25, marginBottom: 10 },
    buyNowText: { fontSize: 16, fontWeight: '700', color: '#fff', textAlign: 'center' },
});
