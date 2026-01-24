import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    interpolate
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const Skeleton = ({ style }) => {
    const { isDark } = useTheme();
    const shimmerValue = useSharedValue(0);

    useEffect(() => {
        shimmerValue.value = withRepeat(
            withTiming(1, { duration: 1500 }),
            -1,
            false
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        const translateX = interpolate(
            shimmerValue.value,
            [0, 1],
            [-width, width]
        );
        return {
            transform: [{ translateX }]
        };
    });

    const baseColor = isDark ? '#1A1A2E' : '#F0F0F5';
    const highlightColor = isDark ? '#2A2A4E' : '#FFFFFF';

    return (
        <View style={[styles.container, { backgroundColor: baseColor }, style]}>
            <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
                <LinearGradient
                    colors={[baseColor, highlightColor, baseColor]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>
        </View>
    );
};

export const ProductSkeleton = ({ style: containerStyle }) => {
    return (
        <View style={[styles.productCard, containerStyle]}>
            <Skeleton style={styles.image} />
            <Skeleton style={styles.lineSmall} />
            <Skeleton style={styles.lineMedium} />
            <View style={styles.row}>
                <Skeleton style={styles.price} />
                <Skeleton style={styles.button} />
            </View>
        </View>
    );
};

export const CategorySkeleton = () => {
    return (
        <View style={styles.categoryCircle}>
            <Skeleton style={styles.circle} />
            <Skeleton style={styles.catName} />
        </View>
    );
};

export const BannerSkeleton = () => {
    return <Skeleton style={styles.banner} />;
};

export const CartItemSkeleton = () => {
    return (
        <View style={styles.cartItem}>
            <Skeleton style={styles.cartImage} />
            <View style={styles.cartInfo}>
                <Skeleton style={styles.lineMedium} />
                <Skeleton style={styles.lineSmall} />
                <View style={styles.row}>
                    <Skeleton style={styles.price} />
                    <Skeleton style={styles.quantity} />
                </View>
            </View>
        </View>
    );
};

export const ProfileSkeleton = () => {
    return (
        <View style={styles.profileCard}>
            <Skeleton style={styles.avatar} />
            <Skeleton style={styles.lineMedium} />
            <Skeleton style={styles.lineSmall} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        borderRadius: 12,
    },
    productCard: {
        width: 160,
        marginRight: 15,
        backgroundColor: 'transparent',
    },
    image: {
        width: 160,
        height: 200,
        borderRadius: 24,
        marginBottom: 10,
    },
    lineSmall: {
        width: '60%',
        height: 12,
        borderRadius: 6,
        marginBottom: 6,
    },
    lineMedium: {
        width: '90%',
        height: 12,
        borderRadius: 6,
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    price: {
        width: 60,
        height: 20,
        borderRadius: 10,
    },
    button: {
        width: 35,
        height: 35,
        borderRadius: 17.5,
    },
    categoryCircle: {
        alignItems: 'center',
        marginRight: 20,
    },
    circle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        marginBottom: 8,
    },
    catName: {
        width: 50,
        height: 10,
        borderRadius: 5,
    },
    banner: {
        width: width - 40,
        height: 200,
        borderRadius: 30,
        alignSelf: 'center',
        marginVertical: 20,
    },
    cartItem: {
        flexDirection: 'row',
        padding: 16,
        marginBottom: 12,
        borderRadius: 16,
    },
    cartImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        marginRight: 12,
    },
    cartInfo: {
        flex: 1,
        justifyContent: 'space-between',
    },
    quantity: {
        width: 80,
        height: 32,
        borderRadius: 16,
    },
    profileCard: {
        padding: 20,
        alignItems: 'center',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
    }
});

export default Skeleton;
