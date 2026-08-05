import React, { useEffect } from 'react';
import { StyleSheet, Pressable, Platform, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAssistantContext } from '../context/AssistantProvider';
import OrbFallback from './OrbFallback';
import * as Haptics from 'expo-haptics';

export const FloatingAssistantButton: React.FC = () => {
  const { overlayVisible, triggerAssistant } = useAssistantContext();
  const router = useRouter();
  
  const scale = useSharedValue(0);

  useEffect(() => {
    // Animate button entry/exit based on overlay visibility
    if (!overlayVisible) {
      scale.value = withSpring(1, { damping: 15 });
    } else {
      scale.value = withSpring(0, { damping: 15 });
    }
  }, [overlayVisible, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: scale.value,
    };
  });

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    triggerAssistant();
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.pressed
        ]}
        accessibilityLabel="تحدث مع مساعد كتارا"
        accessibilityRole="button"
      >
        {/* Use OrbFallback directly — the 3D Canvas renders as black on small sizes */}
        <OrbFallback size={52} status="idle" />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 110 : 100,
    right: 16,
    zIndex: 9999,
    elevation: 9999,
    overflow: 'visible',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.92 }],
  },
});

