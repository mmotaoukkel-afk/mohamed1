import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import Text from './ui/Text';

const STEPS = [
    { id: 'pending', icon: 'time', key: 'orderPlaced' },
    { id: 'processing', icon: 'cog', key: 'processing' },
    { id: 'shipped', icon: 'airplane', key: 'shipped' },
    { id: 'delivered', icon: 'checkmark-circle', key: 'delivered' },
];

const OrderTimeline = ({ status = 'pending', style }) => {
    const { tokens } = useTheme();
    const { t } = useTranslation();

    const currentStepIndex = useMemo(() => {
        switch (status.toLowerCase()) {
            case 'paid':
            case 'processing': return 1;
            case 'shipped':
            case 'on_way': return 2;
            case 'delivered':
            case 'completed': return 3;
            default: return 0;
        }
    }, [status]);

    return (
        <View style={[styles.container, style]}>
            {STEPS.map((step, index) => {
                const isActive = index <= currentStepIndex;
                const isLast = index === STEPS.length - 1;

                return (
                    <View key={step.id} style={styles.stepContainer}>
                        {/* Step Icon */}
                        <View style={[
                            styles.iconCircle,
                            { backgroundColor: isActive ? tokens.colors.primary : tokens.colors.surface }
                        ]}>
                            <Ionicons
                                name={step.icon}
                                size={14}
                                color={isActive ? '#FFF' : tokens.colors.textMuted}
                            />
                        </View>

                        {/* Step Label (Only for active or first/last to save space) */}
                        <Text
                            variant="caption"
                            style={[
                                styles.label,
                                {
                                    color: isActive ? tokens.colors.text : tokens.colors.textMuted,
                                    fontWeight: isActive ? 'bold' : 'normal'
                                }
                            ]}
                        >
                            {t(step.key)}
                        </Text>

                        {/* Connecting Line */}
                        {!isLast && (
                            <View style={[
                                styles.line,
                                { backgroundColor: index < currentStepIndex ? tokens.colors.primary : tokens.colors.border }
                            ]} />
                        )}
                    </View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        width: '100%',
        paddingVertical: 16,
    },
    stepContainer: {
        flex: 1,
        alignItems: 'center',
        position: 'relative',
    },
    iconCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
        marginBottom: 6,
    },
    line: {
        position: 'absolute',
        top: 13, // Center of circle (28/2 = 14) - half height (2/1 = 1)
        left: '50%',
        right: '-50%',
        height: 2,
        zIndex: 1,
    },
    label: {
        textAlign: 'center',
        fontSize: 10,
        width: '120%',
    },
});

export default OrderTimeline;
