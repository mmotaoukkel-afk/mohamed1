import { Ionicons } from "@expo/vector-icons";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import index from "../(tabs)/index";
import save from "../(tabs)/Save";
import profile from "./profile";
import SaveTabIcon from "../components/SaveTabIcon";
import ProductsDeltScreen from "../components/ProductsDeltScreen";
import ShippingScreen from "../screens/checkout/ShippingScreen";
import PaymentScreen from "../screens/checkout/PaymentScreen";
import EditProfile from "../components/EditProfile";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { CartContext, CartProvider } from "../../src/context/CardContext";
import { useAuth, AuthProvider } from "../../src/context/AuthContext";
import { ThemeProvider } from "../../src/context/ThemeContext";
import { SettingsProvider } from "../../src/context/SettingsContext";
import { useContext } from "react";
import { View, Text, StyleSheet } from "react-native";
import Basket from "./Basket";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MyHomeStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={index} />
        <Stack.Screen name="ProductsDelt" component={ProductsDeltScreen} />
    </Stack.Navigator>
);

const MyBasketStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="BasketMain" component={Basket} />
        <Stack.Screen name="ShippingScreen" component={ShippingScreen} />
        <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
    </Stack.Navigator>
);

const MyProfileStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ProfileMain" component={profile} />
        <Stack.Screen name="EditProfile" component={EditProfile} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
);
const AppContent = () => {
    const { user } = useAuth();

    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: "#1e1d1dff",
                tabBarShowLabel: false,
                tabBarStyle: {
                    backgroundColor: "#e3e3e3ff",
                    borderRadius: 50,
                    marginHorizontal: 15,
                    marginBottom: 15,
                    height: 50,
                    position: "absolute",
                    overflow: "hidden",
                    borderWidth: 1,
                },
            }}
        >
            <Tab.Screen
                name="index"
                component={MyHomeStack}
                options={{
                    title: "",
                    headerShown: false,
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="home" size={25} color={color} style={styles.top} />
                    ),
                }}
            />
            <Tab.Screen
                name="Save"
                component={save}
                options={{
                    title: "",
                    headerShown: false,
                    tabBarIcon: ({ color }) => <SaveTabIcon color={color} />,
                }}
            />
            <Tab.Screen
                name="Basket"
                component={MyBasketStack}
                options={{
                    title: "",
                    headerShown: false,
                    tabBarIcon: ({ color }) => {
                        const { carts } = useContext(CartContext);
                        return (
                            <View style={{ position: "relative" }}>
                                <Feather name="shopping-cart" size={25} color={color} style={styles.top} />
                                <View
                                    style={{
                                        height: 14,
                                        width: 14,
                                        borderRadius: 7,
                                        backgroundColor: "#afacacff",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        position: "absolute",
                                        top: -5,
                                        right: -5,
                                    }}
                                >
                                    <Text style={styles.container}>{carts?.length}</Text>
                                </View>
                            </View>
                        );
                    },
                }}
            />
            <Tab.Screen
                name="profile"
                component={MyProfileStack}
                options={({ route }) => ({
                    title: "",
                    headerShown: false,
                    tabBarStyle: ((route) => {
                        const routeName = getFocusedRouteNameFromRoute(route) ?? ""
                        // Hide tab bar on Login/Register screens OR if user is not logged in (showing welcome screen)
                        if (routeName === "Login" || routeName === "Register" || !user) {
                            return { display: "none" }
                        }
                        return {
                            backgroundColor: "#e3e3e3ff",
                            borderRadius: 50,
                            marginHorizontal: 15,
                            marginBottom: 15,
                            height: 50,
                            position: "absolute",
                            overflow: "hidden",
                            borderWidth: 1,
                        }
                    })(route),
                    tabBarIcon: ({ color }) => (
                        <Feather name="user" size={30} color={color} style={styles.top} />
                    ),
                })}
            />

        </Tab.Navigator >
    );
};

const App = () => (
    <AuthProvider>
        <ThemeProvider>
            <SettingsProvider>
                <CartProvider>
                    <AppContent />
                </CartProvider>
            </SettingsProvider>
        </ThemeProvider>
    </AuthProvider>
);

const styles = StyleSheet.create({
    container: {
        fontSize: 11,
        fontWeight: "bold",
    },
    top: {
        marginTop: 4,
    },
});

export default App;
