import { Redirect } from "expo-router";
<<<<<<< HEAD

export default function Index() {
    // دخول مباشر للصفحة الرئيسية بدون تسجيل
    return <Redirect href="/(tabs)" />;
=======
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

    // Go to tabs (profile will show guest view if not logged in)
    return <Redirect href="/(tabs)/profile" />;
>>>>>>> origin/main
}
