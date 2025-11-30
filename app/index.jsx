import { Redirect } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import { useSettings } from "../src/context/SettingsContext";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
    const { user, loading: authLoading } = useAuth();
    const { isFirstLaunch } = useSettings();

    // Show loading if auth is loading OR first launch check is pending
    if (authLoading || isFirstLaunch === null) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="#6366F1" />
            </View>
        );
    }

    // If first launch, go to onboarding
    if (isFirstLaunch) {
        return <Redirect href="/screens/OnboardingScreen" />;
    }

    // If user is logged in, go to tabs
    if (user) {
        return <Redirect href="/(tabs)" />;
    }

    // If not logged in, go to login screen
    return <Redirect href="/screens/auth/LoginScreen" />;
}
