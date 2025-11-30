import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Alert,
  Switch,
  ScrollView,
  Modal,
  StyleSheet
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { useSettings } from "../../src/context/SettingsContext";
import { CartContext } from "../../src/context/CardContext";
import SavedAddresses from "../components/SavedAddresses";
import PaymentMethods from "../components/PaymentMethods";
import { useNavigation } from "@react-navigation/native";
import { sanitizeEmail } from "../../src/utils/helpers";
import PremiumBackground from "../components/PremiumBackground";
import { sendNewProductNotification } from "../../src/utils/notifications";

const { width } = Dimensions.get("window");

const Profile = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const { colors, toggleTheme, theme } = useTheme();
  const { carts } = React.useContext(CartContext);
  const {
    notifications,
    toggleNotifications,
  } = useSettings();

  const [imageUri, setImageUri] = useState(null);
  const [imageKey, setImageKey] = useState(Date.now().toString());

  // Modal States
  const [showAddresses, setShowAddresses] = useState(false);
  const [showPayments, setShowPayments] = useState(false);

  // Data States (Lifted Up)
  const [addresses, setAddresses] = useState([
    { id: '1', label: 'Home', name: 'John Doe', address: '123 Main St, New York, NY 10001', phone: '+1 234 567 890', isDefault: true },
    { id: '2', label: 'Work', name: 'John Doe', address: '456 Office Ave, Brooklyn, NY 11201', phone: '+1 987 654 321', isDefault: false },
  ]);
  const [cards, setCards] = useState([
    { id: '1', type: 'Visa', number: '**** **** **** 4242', expiry: '12/25', holder: 'John Doe', isDefault: true },
    { id: '2', type: 'Mastercard', number: '**** **** **** 8888', expiry: '09/24', holder: 'John Doe', isDefault: false },
  ]);

  const [selectedOrderTab, setSelectedOrderTab] = useState('all'); // Will be changed to category-based
  const [selectedCategory, setSelectedCategory] = useState('All'); // Category filter: All, Discount, T-shirt, Hoodie, Hat
  const [language, setLanguage] = useState('en'); // en or ar

  const scrollViewRef = useRef(null);
  const ordersRef = useRef(null);
  const favoritesRef = useRef(null);

  // Load saved profile image on component mount or user change
  useEffect(() => {
    const loadSavedImage = async () => {
      if (!user) {
        setImageUri(null);
        return;
      }
      try {
        const userImageKey = `profile_image_${sanitizeEmail(user.email)}`;
        const savedUri = await SecureStore.getItemAsync(userImageKey);
        if (savedUri) {
          setImageUri(savedUri);
        } else {
          setImageUri(null);
        }
        setImageKey(Date.now().toString());
      } catch (error) {
        console.error("Error loading saved image:", error);
        setImageUri(null);
      }
    };

    loadSavedImage();
  }, [user]);

  // Convert cart items to order history format (simulating completed purchases)
  const allOrders = carts.map((item, index) => ({
    id: item.id.toString(),
    name: item.name,
    price: `$${item.price}`,
    category: item.category, // Add category from cart item
    img: item.image,
    date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  }));

  const favorites = carts.slice(0, 4).map(item => ({
    id: item.id.toString(),
    name: item.name,
    price: `$${item.price}`,
    img: item.image,
  }));

  const userStats = {
    totalOrders: allOrders.length,
    favorites: favorites.length,
    reviews: Math.min(allOrders.length, 5),
  };

  const getFilteredOrders = () => {
    if (selectedCategory === 'All') return allOrders;
    return allOrders.filter(order => order.category === selectedCategory);
  };

  const pickAndCropImage = async () => {
    if (!user) {
      Alert.alert("Alert", "You must sign in first");
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permissions Required",
          "We need permission to access photos"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        const localUri = result.assets[0].uri;

        try {
          const userImageKey = `profile_image_${sanitizeEmail(user.email)}`;
          await SecureStore.setItemAsync(userImageKey, localUri);
          setImageUri(localUri);
          setImageKey(Date.now().toString());
        } catch (e) {
          console.error("Error saving image:", e);
          setImageUri(localUri);
          setImageKey(Date.now().toString());
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error("Logout failed:", error);
            }
          }
        }
      ]
    );
  };

  const scrollToSection = (y) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y, animated: true });
    }
  };

  const quickActions = [
    {
      id: 1,
      icon: 'location',
      label: 'Addresses',
      count: addresses.length,
      onPress: () => setShowAddresses(true)
    },
    {
      id: 2,
      icon: 'card',
      label: 'Payments',
      count: cards.length,
      onPress: () => setShowPayments(true)
    },
    {
      id: 3,
      icon: 'heart',
      label: 'Favorites',
      count: favorites.length,
      onPress: () => scrollToSection(500) // Approximate scroll position
    },
    {
      id: 4,
      icon: 'receipt',
      label: 'Orders',
      count: userStats.totalOrders,
      onPress: () => scrollToSection(300) // Approximate scroll position
    },
  ];

  const settingsOptions = [
    {
      id: 1,
      type: "toggle",
      label: "Dark Mode",
      iconName: "moon",
      value: theme === "dark",
      onToggle: toggleTheme,
    },
    {
      id: 2,
      type: "toggle",
      label: "Notifications",
      iconName: "notifications",
      value: notifications,
      onToggle: toggleNotifications,
    },
    {
      id: 3,
      type: "link",
      label: "Language",
      iconName: "language",
      rightText: language === 'en' ? 'English' : 'العربية',
      onPress: () => setLanguage(language === 'en' ? 'ar' : 'en'),
    },
    {
      id: 4,
      type: "link",
      label: "Privacy Policy",
      iconName: "shield-checkmark",
      onPress: () => Alert.alert("Privacy Policy", "Privacy policy content here"),
    },
  ];

  const supportOptions = [
    {
      id: 1,
      label: "Customer Service",
      iconName: "headset",
      onPress: () => Alert.alert("Customer Service", "Contact us at support@fashionstore.com"),
    },
    {
      id: 2,
      label: "FAQ",
      iconName: "help-circle",
      onPress: () => Alert.alert("FAQ", "Frequently asked questions about orders, shipping & returns"),
    },
    {
      id: 3,
      label: "Rate App",
      iconName: "star",
      onPress: () => Alert.alert("Rate App", "Thank you for rating Fashion Store!"),
    },
    {
      id: 4,
      label: "Invite Friends",
      iconName: "people",
      onPress: () => Alert.alert("Referral Program", "Share with friends and get 20% off your next order!"),
    },
  ];

  const renderStatCard = (icon, label, value) => (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={24} color="#fff" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const renderQuickAction = ({ item }) => (
    <TouchableOpacity
      style={styles.quickActionCard}
      onPress={item.onPress}
    >
      <View style={styles.quickActionIconWrapper}>
        <Ionicons name={item.icon} size={24} color="#fff" />
        {item.count > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{item.count}</Text>
          </View>
        )}
      </View>
      <Text style={styles.quickActionLabel}>{item.label}</Text>
    </TouchableOpacity>
  );

  const renderOrderTabButton = (category, label) => (
    <TouchableOpacity
      style={[styles.orderTab, selectedCategory === category && styles.orderTabActive]}
      onPress={() => setSelectedCategory(category)}
    >
      <Text style={[styles.orderTabText, selectedCategory === category && styles.orderTabTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderOrderCard = ({ item }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => navigation.navigate('screens/orders/OrderTrackingScreen', {
        id: item.id,
        name: item.name,
        price: item.price,
        date: item.date,
        img: item.img
      })}
    >
      <Image source={{ uri: item.img }} style={styles.orderImage} />
      <View style={styles.orderInfo}>
        <Text style={styles.orderName}>{item.name}</Text>
        <Text style={styles.orderDate}>{item.date}</Text>
      </View>
      <View style={styles.orderRight}>
        <Text style={styles.orderPrice}>{item.price}</Text>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFavoriteCard = ({ item }) => (
    <View style={styles.favoriteCard}>
      <Image source={{ uri: item.img }} style={styles.favoriteImage} />
      <Text style={styles.favoriteName}>{item.name}</Text>
      <Text style={styles.favoritePrice}>{item.price}</Text>
      <TouchableOpacity style={styles.addToCartBtn}>
        <Ionicons name="cart" size={16} color="#667eea" />
      </TouchableOpacity>
    </View>
  );

  const renderSettingOption = ({ item, index }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <TouchableOpacity
        style={styles.menuItem}
        onPress={item.type === "toggle" ? item.onToggle : item.onPress}
        activeOpacity={0.7}
      >
        <View style={styles.menuIconContainer}>
          <Ionicons name={item.iconName} size={20} color="#fff" />
        </View>
        <Text style={styles.menuLabel}>{item.label}</Text>
        <View style={styles.menuAction}>
          {item.type === "toggle" ? (
            <Switch
              trackColor={{ false: "#767577", true: "#667eea" }}
              thumbColor="#f4f3f4"
              onValueChange={item.onToggle}
              value={item.value}
            />
          ) : item.rightText ? (
            <Text style={styles.rightText}>{item.rightText}</Text>
          ) : (
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderSupportOption = ({ item, index }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <TouchableOpacity
        style={styles.supportItem}
        onPress={item.onPress}
        activeOpacity={0.7}
      >
        <Ionicons name={item.iconName} size={22} color="#fff" />
        <Text style={styles.supportLabel}>{item.label}</Text>
        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
      </TouchableOpacity>
    </Animated.View>
  );

  if (!user) {
    return (
      <PremiumBackground>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
          <Ionicons name="person-circle-outline" size={100} color="rgba(255,255,255,0.8)" />
          <Text style={[styles.headerTitle, { marginTop: 20, marginBottom: 10, fontSize: 26 }]}>
            Welcome to Fashion Store!
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 30, fontSize: 15 }}>
            Sign in to access your orders, favorites, and exclusive deals
          </Text>

          <TouchableOpacity
            style={[styles.authButton, { backgroundColor: '#fff', width: '100%', marginBottom: 15 }]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={[styles.authButtonText, { color: '#667eea' }]}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.authButton, { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#fff', width: '100%' }]}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={[styles.authButtonText, { color: '#fff' }]}>Create New Account</Text>
          </TouchableOpacity>
        </View>
      </PremiumBackground>
    );
  }

  return (
    <PremiumBackground>
      <View style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Profile Info */}
          <Animated.View entering={FadeIn.delay(100).springify()} style={styles.header}>
            <View style={styles.headerTopRow}>
              <Text style={styles.headerTitle}>My Profile</Text>
            </View>

            <View style={styles.profileInfoContainer}>
              <View style={styles.profileImageWrapper}>
                <Image
                  key={imageKey}
                  source={
                    imageUri
                      ? { uri: imageUri }
                      : { uri: "https://via.placeholder.com/150/CCCCCC/FFFFFF/?text=Profile" }
                  }
                  style={styles.profileImage}
                />
                <TouchableOpacity onPress={pickAndCropImage} style={styles.cameraBadge}>
                  <Ionicons name="camera" size={16} color="#667eea" />
                </TouchableOpacity>
              </View>
              <Text style={styles.userName}>{user?.name ?? "User"}</Text>
              <Text style={styles.userEmail}>{user?.email ?? ""}</Text>

              {/* User Stats */}
              <View style={styles.statsContainer}>
                {renderStatCard('receipt-outline', 'Orders', userStats.totalOrders)}
                {renderStatCard('heart-outline', 'Favorites', userStats.favorites)}
                {renderStatCard('star-outline', 'Reviews', userStats.reviews)}
              </View>
            </View>
          </Animated.View>

          <View style={styles.contentSheet}>
            {/* Quick Actions */}
            <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <FlatList
                data={quickActions}
                renderItem={renderQuickAction}
                keyExtractor={item => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickActionsContainer}
              />
            </Animated.View>

            {/* Orders Section */}
            <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.section} ref={ordersRef}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Purchases</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>

              {/* Category Tabs */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.orderTabsScrollContent}
                style={styles.orderTabsScroll}
              >
                {renderOrderTabButton('All', 'All')}
                {renderOrderTabButton('Discount', 'Discount')}
                {renderOrderTabButton('T-shirt', 'T-shirt')}
                {renderOrderTabButton('Hoodie', 'Hoodie')}
                {renderOrderTabButton('Hat', 'Hat')}
              </ScrollView>

              {getFilteredOrders().length > 0 ? (
                <FlatList
                  data={getFilteredOrders()}
                  renderItem={renderOrderCard}
                  keyExtractor={item => item.id}
                  scrollEnabled={false}
                />
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="shirt-outline" size={60} color="rgba(255,255,255,0.5)" />
                  <Text style={styles.emptyTitle}>
                    {selectedCategory === 'All' ? 'No Purchase History!' : `No ${selectedCategory} items purchased`}
                  </Text>
                  {selectedCategory === 'All' && (
                    <>
                      <Text style={styles.emptySubtitle}>
                        Browse our latest fashion collection and make your first purchase
                      </Text>
                      <TouchableOpacity
                        style={styles.shopNowButton}
                        onPress={() => navigation.navigate('index')}
                      >
                        <Ionicons name="storefront" size={20} color="#fff" />
                        <Text style={styles.shopNowText}>Explore Collection</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
            </Animated.View>

            {/* Favorites Section */}
            <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.section} ref={favoritesRef}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>My Favorites</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              {favorites.length > 0 ? (
                <FlatList
                  data={favorites}
                  renderItem={renderFavoriteCard}
                  keyExtractor={item => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 10 }}
                />
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="heart-outline" size={50} color="rgba(255,255,255,0.5)" />
                  <Text style={styles.emptyText}>No favorites yet</Text>
                </View>
              )}
            </Animated.View>

            {/* Settings Section */}
            <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.section}>
              <Text style={styles.sectionTitle}>Settings</Text>
              {settingsOptions.map((item, index) => (
                <View key={item.id}>{renderSettingOption({ item, index })}</View>
              ))}
            </Animated.View>

            {/* Support Section */}
            <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.section}>
              <Text style={styles.sectionTitle}>Support & Info</Text>
              {supportOptions.map((item, index) => (
                <View key={item.id}>{renderSupportOption({ item, index })}</View>
              ))}
            </Animated.View>

            {/* Developer Tools (For Testing) */}
            <Animated.View entering={FadeInDown.delay(650).springify()} style={styles.section}>
              <Text style={styles.sectionTitle}>Developer Tools</Text>
              <TouchableOpacity
                style={styles.supportItem}
                onPress={async () => {
                  await sendNewProductNotification();
                  Alert.alert("Notification Sent", "Check your notifications tray!");
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="construct" size={22} color="#fff" />
                <Text style={styles.supportLabel}>Simulate New Product Alert</Text>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </Animated.View>

            {/* Logout Button */}
            <Animated.View entering={FadeInDown.delay(700).springify()} style={styles.section}>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={22} color="#ff4444" />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>

        <Modal
          visible={showAddresses}
          animationType="slide"
          onRequestClose={() => setShowAddresses(false)}
        >
          <SavedAddresses
            onClose={() => setShowAddresses(false)}
            addresses={addresses}
            setAddresses={setAddresses}
          />
        </Modal>

        <Modal
          visible={showPayments}
          animationType="slide"
          onRequestClose={() => setShowPayments(false)}
        >
          <PaymentMethods
            onClose={() => setShowPayments(false)}
            cards={cards}
            setCards={setCards}
          />
        </Modal>
      </View>
    </PremiumBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 30,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  headerTitle: { fontSize: 24, fontWeight: "700", color: '#fff' },
  profileInfoContainer: { alignItems: "center", width: '100%' },
  profileImageWrapper: { position: "relative", marginBottom: 15 },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.3)",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    padding: 8,
    borderRadius: 25,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  userName: { fontSize: 26, fontWeight: "700", marginBottom: 4, color: '#fff' },
  userEmail: { fontSize: 14, marginBottom: 20, color: 'rgba(255,255,255,0.8)' },

  // Stats Cards
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 10,
  },
  statCard: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    minWidth: 100,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },

  // Content Sheet
  contentSheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 50,
    minHeight: 500,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  section: { marginBottom: 25 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: '#fff',
  },
  seeAllText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },

  // Quick Actions
  quickActionsContainer: {
    paddingVertical: 5,
  },
  quickActionCard: {
    alignItems: 'center',
    padding: 15,
    marginRight: 12,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    minWidth: 90,
  },
  quickActionIconWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  countBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  countBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },

  // Order Tabs
  orderTabsScroll: {
    marginBottom: 15,
  },
  orderTabsScrollContent: {
    paddingRight: 20,
    gap: 10,
  },
  orderTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  orderTabActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  orderTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  orderTabTextActive: {
    color: '#fff',
  },

  // Order Cards
  orderCard: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 12,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
  },
  orderImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  orderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  orderName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  orderPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.5)',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },

  // Favorites
  favoriteCard: {
    width: 130,
    marginRight: 12,
    padding: 10,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  favoriteImage: {
    width: '100%',
    height: 110,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  favoriteName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  favoritePrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  addToCartBtn: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },

  // Menu Items
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    padding: 16,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: '#fff'
  },
  menuAction: {
    justifyContent: "center",
  },
  rightText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },

  // Support Items
  supportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 10,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  supportLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 12,
  },

  // Empty States
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginTop: 15,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 20,
  },
  shopNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    gap: 8,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  shopNowText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },


  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ff4444',
    marginLeft: 10,
  },

  // Auth Buttons (for non-logged in state)
  authButton: {
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default Profile;
