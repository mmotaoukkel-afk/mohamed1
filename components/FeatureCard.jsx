import Feather from '@expo/vector-icons/Feather';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function FeatureCard({ title, description, icon, onPress, color = '#667eea' }) {
    return (
        <TouchableOpacity onPress={onPress} style={styles.container}>
            <LinearGradient
                colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
                style={styles.gradient}
            >
                <View style={[styles.iconContainer, { backgroundColor: color }]}>
                    <Feather name={icon} size={24} color="#fff" />
                </View>
                <View>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.description} numberOfLines={3}>{description}</Text>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 160,
        height: 200,
        marginRight: 12,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    gradient: {
        flex: 1,
        padding: 16,
        justifyContent: 'space-between',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    description: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        lineHeight: 18,
    }
});
