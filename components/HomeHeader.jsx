import { ScrollView, StyleSheet, Text, View } from 'react-native';
import FeatureCard from './FeatureCard';
import Hero3D from './Hero3D';

export default function HomeHeader() {
    return (
        <View style={styles.container}>
            <Hero3D />

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Future Tech 🚀</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuresScroll}>
                    <FeatureCard
                        title="AI Skin Analysis"
                        description="Analyze your skin type with our advanced AI camera."
                        icon="camera"
                        color="#FF6B6B"
                        onPress={() => { }}
                    />
                    <FeatureCard
                        title="Virtual Try-On"
                        description="Try makeup products in real-time using AR."
                        icon="eye"
                        color="#4ECDC4"
                        onPress={() => { }}
                    />
                    <FeatureCard
                        title="Smart Routine"
                        description="Get a personalized daily routine based on your needs."
                        icon="activity"
                        color="#FFE66D"
                        onPress={() => { }}
                    />
                </ScrollView>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Explore Collection</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 10,
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 16,
        letterSpacing: 1,
    },
    featuresScroll: {
        paddingRight: 16,
    }
});
