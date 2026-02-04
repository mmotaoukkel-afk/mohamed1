/**
 * Profile Screen - Redesign
 * Clean, list-based layout matching the "Charlotte King" reference
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
  I18nManager,
  Switch,
  Linking
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { useSettings } from "../../src/context/SettingsContext";
import { useFavorites } from "../../src/context/FavoritesContext";
import { useCheckout } from "../../src/context/CheckoutContext";
import { useTranslation } from "../../src/hooks/useTranslation";
import { BlurView } from "expo-blur";
import { Text, Surface, Button, IconButton } from "../../src/components/ui";
import EditProfileModal from "../../src/components/EditProfileModal";
import SavedAddresses from "../../src/components/SavedAddresses";
import PaymentMethods from "../../src/components/PaymentMethods";
import { ProfileSkeleton } from "../../src/components/SkeletonLoader";
import { useCartAnimation } from "../../src/context/CartAnimationContext";
import ProductCardCinematic from "../../src/components/ProductCardCinematic";
import { LinearGradient } from "expo-linear-gradient";

const Profile = () => {
  const router = useRouter();
  const { user, logout, updateUser, isAdmin, loading } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const { language, changeLanguage, updateConsent } = useSettings();
  const { savedAddresses, deleteAddress, saveAddress, deletePaymentMethod, savePaymentMethod } = useCheckout();
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const { savedPaymentMethods } = useCheckout();
  const { triggerAddToCart } = useCartAnimation();

  const [loadingImage, setLoadingImage] = useState(false);
  const [showAddresses, setShowAddresses] = useState(false);
  const [showPayments, setShowPayments] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  const pickAndCropImage = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setLoadingImage(true);
        await updateUser({ photoURL: result.assets[0].uri });
        setLoadingImage(false);
      }
    } catch (error) {
      setLoadingImage(false);
      Alert.alert(t('error'), t('updateFailed'));
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('logout'),
      t('logoutConfirm'),
      [
        { text: t('cancel'), style: "cancel" },
        {
          text: t('logout'),
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace('/');
          }
        }
      ]
    );
  };

  const handleWhatsAppSupport = () => {
    const message = t('supportMessage') || 'مرحباً، أحتاج إلى مساعدة بخصوص طلبي.';
    const whatsappUrl = `https://wa.me/9659910326?text=${encodeURIComponent(message)}`;
    Linking.openURL(whatsappUrl);
  };

  const handleProductPress = (item) => {
    router.push(`/product/${item.id}`);
  };

  const handleAddToCart = (item, sourceRef) => {
    triggerAddToCart({
      id: item.id,
      name: item.name,
      price: item.sale_price || item.price,
      image: item.images?.[0]?.src,
      quantity: 1,
    }, sourceRef);
  };

  const handleFavorite = (item) => {
    toggleFavorite({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.images?.[0]?.src,
      quantity: 1,
    });
  };





  // New Menu Items Config
  const menuItems = [
    ...(isAdmin ? [{
      id: 'admin',
      label: t('adminDashboard'),
      icon: 'shield-checkmark-outline',
      onPress: () => router.push('/admin/overview'),
      showChevron: true,
      color: theme.primary,
      isHighlighted: true
    }] : []),
    {
      id: 'favorites',
      label: t('favorites'),
      icon: 'heart-outline',
      onPress: () => router.push('/favorites'),
      showChevron: true
    },
    {
      id: 'orders',
      label: t('orders'),
      icon: 'receipt-outline',
      onPress: () => router.push('/orders'),
      showChevron: true
    },
    {
      id: 'language',
      label: t('language'),
      icon: 'globe-outline',
      onPress: () => changeLanguage(language === 'en' ? 'ar' : 'en'),
      showChevron: true,
      rightText: language === 'en' ? 'English' : 'العربية'
    },
    {
      id: 'theme',
      label: isDark ? t('lightMode') : t('darkMode'),
      icon: isDark ? 'sunny-outline' : 'moon-outline',
      onPress: toggleTheme,
      showChevron: false,
      rightElement: (
        <Switch
          trackColor={{ false: '#767577', true: theme.primary }}
          thumbColor={'#fff'}
          ios_backgroundColor="#3e3e3e"
          onValueChange={toggleTheme}
          value={isDark}
        />
      )
    },
    {
      id: 'location',
      label: t('addresses'),
      icon: 'location-outline',
      onPress: () => setShowAddresses(true),
      showChevron: true
    },
    {
      id: 'payment',
      label: t('paymentMethods'),
      icon: 'card-outline',
      onPress: () => setShowPayments(true),
      showChevron: true
    },
    {
      id: 'support',
      label: t('contactSupport'),
      icon: 'chatbubble-ellipses-outline',
      onPress: handleWhatsAppSupport,
      showChevron: true,
      color: '#25D366'
    },
    {
      id: 'privacy',
      label: t('privacyPolicy') || (language === 'ar' ? 'الخصوصية والأمان' : 'Privacy & Safety'),
      icon: 'shield-outline',
      onPress: () => {
        Alert.alert(
          t('privacyPolicy') || (language === 'ar' ? 'إعدادات الخصوصية' : 'Privacy Settings'),
          language === 'ar' ? 'هل تريد مراجعة تفضيلات الخصوصية الخاصة بك؟' : 'Would you like to review your privacy preferences?',
          [
            { text: t('cancel'), style: 'cancel' },
            {
              text: language === 'ar' ? 'مراجعة' : 'Review',
              onPress: () => updateConsent(null)
            }
          ]
        );
      },
      showChevron: true
    },
    {
      id: 'about',
      label: t('aboutApp'),
      icon: 'information-circle-outline',
      onPress: () => router.push('/about'),
      showChevron: true
    },
    {
      id: 'logout',
      label: t('logout'),
      icon: 'log-out-outline',
      onPress: handleLogout,
      showChevron: true,
      color: '#EF4444'
    }
  ];

  const styles = getStyles(theme, isDark);

  if (loading) {
    return (
      <View style={[styles.container, { padding: 20, paddingTop: 100 }]}>
        <View style={{ alignItems: 'center' }}>
          <ProfileSkeleton />
        </View>
      </View>
    );
  }

  if (!user) {
    // Simple Guest View
    return (
      <View style={styles.container}>
        <View style={styles.guestContent}>
          <Ionicons name="person-circle-outline" size={100} color={theme.textMuted} />
          <Text variant="title" style={{ marginTop: 20 }}>{t('welcome')}</Text>
          <Text variant="body" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 8 }}>
            {t('loginToAccessProfile')}
          </Text>
          <Button
            title={t('login')}
            onPress={() => router.push('/auth')}
            style={{ marginTop: 32, width: 200 }}
            variant="primary"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="title" style={styles.headerTitle}>
          {t('profile')}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={pickAndCropImage} style={styles.avatarContainer}>
            {loadingImage ? (
              <ActivityIndicator color={theme.primary} />
            ) : user.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: theme.text + '10', justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.text }}>
                  {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                </Text>
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={12} color="#FFF" />
            </View>
          </TouchableOpacity>

          <View style={styles.infoContainer}>
            <Text variant="title" style={styles.name}>{user.displayName || 'User'}</Text>
            <Text variant="bodySmall" style={styles.handle}>{user.email}</Text>

            <TouchableOpacity style={styles.editBtn} onPress={() => setShowEditProfile(true)}>
              <Text style={styles.editBtnText}>{t('editProfile')}</Text>
            </TouchableOpacity>

            {isAdmin && (
              <TouchableOpacity
                style={[styles.editBtn, { backgroundColor: theme.primary, marginTop: 8 }]}
                onPress={() => router.push('/admin/overview')}
              >
                <Ionicons name="speedometer-outline" size={14} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.editBtnText}>{t('adminDashboard')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>





        {/* Menu List */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                <Ionicons name={item.icon} size={22} color={item.color || theme.text} />
                <Text variant="body" style={[styles.menuLabel, { color: item.color || theme.text }]}>
                  {item.label}
                </Text>
              </View>

              <View style={styles.menuRight}>
                {item.rightText && (
                  <Text variant="bodySmall" style={styles.rightText}>{item.rightText}</Text>
                )}
                {item.rightElement}
                {item.showChevron && (
                  <Ionicons
                    name={I18nManager.isRTL ? "chevron-back" : "chevron-forward"}
                    size={18}
                    color={theme.textMuted}
                  />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Modals */}
      <Modal visible={showAddresses} animationType="slide" transparent={true} onRequestClose={() => setShowAddresses(false)}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          <View style={styles.modalContent}>
            <SavedAddresses
              onClose={() => setShowAddresses(false)}
              addresses={savedAddresses}
              onDelete={deleteAddress}
              onAdd={saveAddress}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={showPayments} animationType="slide" transparent={true} onRequestClose={() => setShowPayments(false)}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          <View style={styles.modalContent}>
            <PaymentMethods
              onClose={() => setShowPayments(false)}
              cards={savedPaymentMethods}
              onDelete={deletePaymentMethod}
              onAdd={savePaymentMethod}
            />
          </View>
        </View>
      </Modal>

      <EditProfileModal visible={showEditProfile} onClose={() => setShowEditProfile(false)} />
    </View>
  );
};

const getStyles = (theme, isDark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  guestContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 20,
    marginLeft: 0,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.text,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.background,
  },
  infoContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 4,
  },
  handle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 12,
  },
  editBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  menuContainer: {
    paddingHorizontal: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rightText: {
    fontSize: 14,
    color: theme.textMuted,
  },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: {
    height: '85%',
    backgroundColor: theme.backgroundCard,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
    paddingTop: 10
  },

  // Recent Section
  recentSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  carouselScroll: {
    paddingHorizontal: 24,
  }
});

export default Profile;
