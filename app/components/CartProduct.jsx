import { Feather } from "@expo/vector-icons";
import { Text, View, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { useContext } from "react";
import { CartContext } from "../../src/context/CardContext";

const CartProduct = ({ item, deleteItemFromCart }) => {
    const { colors, theme } = useTheme();
    const { updateCartItemQuantity } = useContext(CartContext);
    const quantity = item.quantity || 1;
    const stock = item.stock || 999;

    const incrementQuantity = () => {
        if (quantity < stock) {
            updateCartItemQuantity(item.id, quantity + 1);
        }
    };

    const decrementQuantity = () => {
        if (quantity > 1) {
            updateCartItemQuantity(item.id, quantity - 1);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.card }]}>
            {/* Product Image */}
            <View style={styles.imageContainer}>
                <Image source={{ uri: item.image }} style={styles.image} resizeMode="contain" />
            </View>

            {/* Product Info */}
            <View style={styles.infoContainer}>
                <View style={styles.headerRow}>
                    <View style={styles.titleContainer}>
                        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                            {item.title}
                        </Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            {item.size || item.color || `Stock: ${stock}`}
                        </Text>
                    </View>

                    {/* Remove Button */}
                    <TouchableOpacity
                        onPress={() => deleteItemFromCart(item)}
                        style={styles.removeButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Feather name="x" size={20} color={colors.textLight} />
                    </TouchableOpacity>
                </View>

                {/* Price and Quantity Row */}
                <View style={styles.bottomRow}>
                    <Text style={[styles.price, { color: colors.text }]}>
                        ${item.price}
                    </Text>

                    {/* Quantity Controls */}
                    <View style={styles.quantityContainer}>
                        <TouchableOpacity
                            onPress={decrementQuantity}
                            disabled={quantity <= 1}
                            style={[styles.quantityButton, {
                                backgroundColor: theme === 'dark' ? colors.cardSecondary : '#F3F4F6',
                                borderColor: theme === 'dark' ? colors.border : '#E5E7EB',
                                opacity: quantity <= 1 ? 0.5 : 1
                            }]}
                        >
                            <Feather name="minus" size={16} color={colors.text} />
                        </TouchableOpacity>

                        <Text style={[styles.quantityText, { color: colors.text }]}>
                            {quantity}
                        </Text>

                        <TouchableOpacity
                            onPress={incrementQuantity}
                            disabled={quantity >= stock}
                            style={[styles.quantityButton, styles.incrementButton, {
                                backgroundColor: quantity >= stock ? '#9CA3AF' : '#10B981',
                                borderColor: quantity >= stock ? '#9CA3AF' : '#10B981',
                                opacity: quantity >= stock ? 0.5 : 1
                            }]}
                        >
                            <Feather name="plus" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        marginBottom: 16,
        borderRadius: 16,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    imageContainer: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    image: {
        width: 70,
        height: 70,
        borderRadius: 8,
    },
    infoContainer: {
        flex: 1,
        justifyContent: 'space-between',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    titleContainer: {
        flex: 1,
        marginRight: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        fontWeight: '400',
    },
    removeButton: {
        padding: 2,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    price: {
        fontSize: 18,
        fontWeight: '700',
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    quantityButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    incrementButton: {
        // Green button styling applied inline
    },
    quantityText: {
        fontSize: 15,
        fontWeight: '600',
        minWidth: 20,
        textAlign: 'center',
    },
});

export default CartProduct;