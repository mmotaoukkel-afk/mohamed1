import 'react-native-gesture-handler/jestSetup';

// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock Reanimated as it needs special handling in tests
jest.mock('react-native-reanimated', () => {
    const Reanimated = require('react-native-reanimated/mock');

    // The mock for `call` immediately calls the callback which is incorrect
    // So we override it with a no-op
    Reanimated.default.call = () => { };

    return Reanimated;
});

// Mock expo-blur
jest.mock('expo-blur', () => ({
    BlurView: 'BlurView',
}));

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
    LinearGradient: 'LinearGradient',
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons',
}));

// Mock expo-router
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
    }),
    Stack: 'Stack',
}));
