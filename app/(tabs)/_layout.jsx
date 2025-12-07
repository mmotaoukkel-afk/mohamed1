import { Ionicons } from "@expo/vector-icons";
import Feather from "@expo/vector-icons/Feather";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useContext } from "react";
import { StyleSheet, Text, View } from "react-native";
import Basket from "../(tabs)/Basket";
import index from "../(tabs)/index";
import save from "../(tabs)/Save";
import { CartContext } from "../../src/context/CardContext";
import EditProfile from "../components/EditProfile";
import ProductsDeltScreen from "../components/ProductsDeltScreen";
import SaveTabIcon from "../components/SaveTabIcon";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import PaymentScreen from "../screens/checkout/PaymentScreen";
import ShippingScreen from "../screens/checkout/ShippingScreen";
import profile from "./profile";

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

const App = () => (
    <Tab.Navigator
        screenOptions={{
            tabBarActiveTintColor: "#667eea",
            tabBarInactiveTintColor: "#888",
            tabBarShowLabel: false,
            tabBarStyle: {
                backgroundColor: "rgba(20, 20, 20, 0.95)",
                borderRadius: 50,
                marginHorizontal: 15,
                marginBottom: 15,
                height: 60,
                position: "absolute",
                overflow: "hidden",
                borderWidth: 0,
                borderTopWidth: 0,
                elevation: 5,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
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
                    if (routeName === "Login" || routeName === "Register") {
                        return { display: "none" }
                    }
                    return {
                        backgroundColor: "rgba(20, 20, 20, 0.95)",
                        borderRadius: 50,
                        marginHorizontal: 15,
                        marginBottom: 15,
                        height: 60,
                        position: "absolute",
                        overflow: "hidden",
                        borderWidth: 0,
                        borderTopWidth: 0,
                        elevation: 5,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                    }
                })(route),
                tabBarIcon: ({ color }) => (
                    <Feather name="user" size={30} color={color} style={styles.top} />
                ),
            })}
        />

    </Tab.Navigator>
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
