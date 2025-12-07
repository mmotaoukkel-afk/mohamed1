import { Redirect } from "expo-router";

export default function Index() {
    // دخول مباشر للصفحة الرئيسية بدون تسجيل
    return <Redirect href="/(tabs)" />;
}
