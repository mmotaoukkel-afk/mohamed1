import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, {
    FadeInRight,
    FadeOutLeft,
    Layout,
    SlideInDown
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import ProductCardSoko from '../src/components/ProductCardSoko';
import { useCart } from '../src/context/CartContext';
import { useFavorites } from '../src/context/FavoritesContext';
import { useTheme } from '../src/context/ThemeContext';
import { useSearchProducts } from '../src/hooks/useProducts';
import { useTranslation } from '../src/hooks/useTranslation';
import { SKIN_QUESTIONS, getRecommendations } from '../src/services/skinQuizService';

const { width } = Dimensions.get('window');

export default function SkinQuizScreen() {
    const router = useRouter();
    const { tokens, isDark } = useTheme();
    const { t } = useTranslation();
    const { addToCart } = useCart();
    const { toggleFavorite, isFavorite } = useFavorites();

    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState({});
    const [showResults, setShowResults] = useState(false);

    const question = SKIN_QUESTIONS[currentStep];
    const progress = ((currentStep + 1) / SKIN_QUESTIONS.length) * 100;

    const handleAnswer = (optionId) => {
        const newAnswers = { ...answers, [question.id]: optionId };
        setAnswers(newAnswers);

        if (currentStep < SKIN_QUESTIONS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            setShowResults(true);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        } else {
            router.back();
        }
    };

    const recommendations = useMemo(() => {
        if (!showResults) return null;
        return getRecommendations(answers);
    }, [showResults, answers]);

    const { data: recommendedProducts, isLoading } = useSearchProducts(recommendations?.searchQuery);

    if (showResults) {
        return (
            <View style={[styles.container, { backgroundColor: tokens.colors.background }]}>
                <LinearGradient colors={[tokens.colors.primary + '20', 'transparent']} style={styles.topGradient} />

                <SafeAreaView style={{ flex: 1 }}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => setShowResults(false)} style={styles.backBtn}>
                            <Ionicons name="arrow-back" size={24} color={tokens.colors.text} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: tokens.colors.text }]}>{t('yourRoutine')}</Text>
                        <View style={{ width: 44 }} />
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.resultsContent}>
                        <Animated.View entering={SlideInDown.duration(800)} style={styles.resultCard}>
                            <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={styles.resultBlur}>
                                <View style={[styles.iconCircle, { backgroundColor: tokens.colors.primary + '20' }]}>
                                    <Ionicons name="sparkles" size={32} color={tokens.colors.primary} />
                                </View>
                                <Text style={[styles.resultSubtitle, { color: tokens.colors.primary }]}>
                                    {t('routineFor')} {t(recommendations.skinType)} ✨
                                </Text>
                                <Text style={[styles.resultTitle, { color: tokens.colors.text }]}>
                                    {t(recommendations.routineKey)}
                                </Text>
                            </BlurView>
                        </Animated.View>

                        <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>{t('recommendedForYou')}</Text>

                        {isLoading ? (
                            <ActivityIndicator size="large" color={tokens.colors.primary} style={{ marginTop: 40 }} />
                        ) : (
                            <View style={styles.productsGrid}>
                                {recommendedProducts?.map((item, index) => (
                                    <View key={item.id} style={styles.productItem}>
                                        <ProductCardSoko
                                            item={item}
                                            onPress={() => router.push(`/product/${item.id}`)}
                                            onAddToCart={(item) => addToCart({ ...item, quantity: 1 })}
                                            onFavorite={toggleFavorite}
                                            isFavorite={isFavorite(item.id)}
                                        />
                                    </View>
                                ))}
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.finishBtn, { backgroundColor: tokens.colors.primary }]}
                            onPress={() => router.replace('/')}
                        >
                            <Text style={styles.finishBtnText}>{t('backToHome')}</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: tokens.colors.background }]}>
            <LinearGradient colors={[tokens.colors.primary + '15', 'transparent']} style={styles.topGradient} />

            <SafeAreaView style={{ flex: 1 }}>
                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { backgroundColor: tokens.colors.border }]}>
                        <Animated.View
                            layout={Layout.springify()}
                            style={[styles.progressIndicator, { width: `${progress}%`, backgroundColor: tokens.colors.primary }]}
                        />
                    </View>
                    <TouchableOpacity onPress={handleBack} style={styles.backBtnQuiz}>
                        <Ionicons name="chevron-back" size={24} color={tokens.colors.text} />
                    </TouchableOpacity>
                </View>

                <Animated.View
                    key={currentStep}
                    entering={FadeInRight}
                    exiting={FadeOutLeft}
                    style={styles.quizContent}
                >
                    <Text style={[styles.stepText, { color: tokens.colors.primary }]}>
                        {t('step')} {currentStep + 1} / {SKIN_QUESTIONS.length}
                    </Text>
                    <Text style={[styles.questionText, { color: tokens.colors.text }]}>
                        {t(question.question)}
                    </Text>

                    <View style={styles.optionsGrid}>
                        {question.options.map((opt) => (
                            <TouchableOpacity
                                key={opt.id}
                                style={styles.optionBtn}
                                onPress={() => handleAnswer(opt.id)}
                            >
                                <BlurView intensity={isDark ? 30 : 50} tint={isDark ? "dark" : "light"} style={styles.optionBlur}>
                                    <View style={[styles.optionIcon, { backgroundColor: tokens.colors.primary + '10' }]}>
                                        <Ionicons name={opt.icon} size={24} color={tokens.colors.primary} />
                                    </View>
                                    <Text style={[styles.optionLabel, { color: tokens.colors.text }]}>
                                        {t(opt.label)}
                                    </Text>
                                    <Ionicons name="chevron-forward" size={18} color={tokens.colors.textMuted} />
                                </BlurView>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 400 },

    progressContainer: {
        paddingHorizontal: 24,
        paddingTop: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15
    },
    progressBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
    progressIndicator: { height: '100%', borderRadius: 3 },
    backBtnQuiz: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },

    quizContent: { flex: 1, paddingHorizontal: 24, paddingTop: 40 },
    stepText: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
    questionText: { fontSize: 28, fontWeight: '800', lineHeight: 36, marginBottom: 40 },

    optionsGrid: { gap: 16 },
    optionBtn: { borderRadius: 20, overflow: 'hidden' },
    optionBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        gap: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    optionIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    optionLabel: { flex: 1, fontSize: 16, fontWeight: '600' },

    // Results styles
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 10 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(150,150,150,0.1)', justifyContent: 'center', alignItems: 'center' },

    resultsContent: { padding: 24, paddingBottom: 100 },
    resultCard: { borderRadius: 32, overflow: 'hidden', marginBottom: 40 },
    resultBlur: { padding: 30, alignItems: 'center' },
    iconCircle: { width: 64, height: 64, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    resultSubtitle: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
    resultTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center', lineHeight: 32 },

    sectionTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20 },
    productsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    productItem: { width: (width - 48 - 16) / 2 },

    finishBtn: {
        marginTop: 40,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5
    },
    finishBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' }
});
