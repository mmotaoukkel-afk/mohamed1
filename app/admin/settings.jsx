/**
 * Admin Settings - Kataraa
 * Settings & Power Tools Center
 * 🔐 Protected by RequireAdmin
 * Features: Admin Management, Permissions, Coupons, Taxes, Delivery Prices
 * ✨ NEW: Editable Store Settings with Firestore persistence
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    TextInput,
    Alert,
    Modal,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import {
    ADMIN_ROLE_CONFIG,
    COUPON_TYPE_CONFIG,
    MOCK_ADMINS,
    MOCK_COUPONS,
    DELIVERY_ZONES,
    TAX_CONFIG,
    STORE_SETTINGS,
    getStoreSettings,
    updateStoreSettings,
    generateCouponCode,
    getAllCoupons,
    createCoupon,
    deleteCoupon,
    initializeCoupons,
    getAllCountries,
    addCountry,
    updateCountry,
    deleteCountry,
    addUpdateZone,
} from '../../src/services/adminSettingsService';
import { syncMockProductsToFirestore } from '../../src/services/syncProducts';
import currencyService from '../../src/services/currencyService';
import {
    getAllAdmins,
    addOrUpdateAdmin,
    removeAdmin,
    USER_ROLES
} from '../../src/services/userService';

const TABS = [
    { id: 'general', label: 'عام', icon: 'settings-outline' },
    { id: 'admins', label: 'المشرفين', icon: 'people-outline' },
    { id: 'coupons', label: 'الكوبونات', icon: 'pricetag-outline' },
    { id: 'shipping', label: 'الشحن', icon: 'car-outline' },
    { id: 'taxes', label: 'الضرائب', icon: 'calculator-outline' },
];

export default function AdminSettings() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { logout, user, role } = useAuth();
    const styles = getStyles(theme, isDark);

    // Filter tabs based on role
    const filteredTabs = TABS.filter(tab => {
        // Show all tabs for now to ensure the user sees them
        return true;
    });

    // Tab state
    const [activeTab, setActiveTab] = useState('general');

    // ==========================================
    // 🏪 EDITABLE STORE SETTINGS STATE
    // ==========================================
    const [storeSettings, setStoreSettings] = useState({
        name: STORE_SETTINGS.name,
        email: STORE_SETTINGS.email,
        currency: currencyService.getCustomerCurrency(),
    });
    const [settingsLoading, setSettingsLoading] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);

    // Edit modals state
    const [showNameModal, setShowNameModal] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [showCurrencyModal, setShowCurrencyModal] = useState(false);
    const [editValue, setEditValue] = useState('');

    // Available currencies for picker
    const availableCurrencies = currencyService.getAvailableCurrencies();

    // Load all data from Firestore on mount
    useEffect(() => {
        loadSettings();
        loadCoupons();
        loadCountries();
        loadAdmins();
        initializeCoupons(); // Populate if empty (first time)
    }, []);

    const loadCountries = async () => {
        try {
            const data = await getAllCountries();
            setCountries(data);
            if (data.length > 0 && !selectedCountry) {
                setSelectedCountry(data[0]);
            }
        } catch (error) {
            console.error('Error loading countries:', error);
        }
    };

    const loadCoupons = async () => {
        try {
            const data = await getAllCoupons();
            setCoupons(data);
        } catch (error) {
            console.error('Error loading coupons:', error);
        }
    };

    const loadAdmins = async () => {
        try {
            const data = await getAllAdmins();
            // Map the roles to the UI labels if needed, or just set it
            setAdmins(data);
        } catch (error) {
            console.error('Error loading admins:', error);
        }
    };

    const loadSettings = async () => {
        setSettingsLoading(true);
        try {
            const settings = await getStoreSettings();
            await currencyService.loadFromFirestore();
            setStoreSettings({
                name: settings.name || STORE_SETTINGS.name,
                email: settings.email || STORE_SETTINGS.email,
                currency: currencyService.getCustomerCurrency(),
            });
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setSettingsLoading(false);
        }
    };

    // Save individual setting
    const saveSetting = async (key, value) => {
        setSavingSettings(true);
        try {
            // Update Firestore
            await updateStoreSettings({ [key]: value });

            // If currency, also update currencyService
            if (key === 'currency') {
                await currencyService.setCustomerCurrency(value);
            }

            // Update local state
            setStoreSettings(prev => ({ ...prev, [key]: value }));
            Alert.alert('✅ تم', 'تم حفظ التغييرات بنجاح');
        } catch (error) {
            console.error('Error saving setting:', error);
            Alert.alert('خطأ', 'حدث خطأ أثناء الحفظ');
        } finally {
            setSavingSettings(false);
        }
    };

    // ==========================================
    // Other existing state
    // ==========================================
    const [admins, setAdmins] = useState(MOCK_ADMINS);
    const [coupons, setCoupons] = useState(MOCK_COUPONS);
    const [deliveryZones, setDeliveryZones] = useState(DELIVERY_ZONES);
    const [taxEnabled, setTaxEnabled] = useState(TAX_CONFIG.enabled);
    const [taxRate, setTaxRate] = useState(TAX_CONFIG.rate.toString());
    const [showCouponModal, setShowCouponModal] = useState(false);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [newAdmin, setNewAdmin] = useState({
        name: '',
        email: '',
        role: 'admin',
    });

    const [newCoupon, setNewCoupon] = useState({
        code: '',
        type: 'percentage',
        value: '',
        minOrder: '',
        maxUses: '',
        validUntil: '',
    });

    // Search state
    const [adminSearch, setAdminSearch] = useState('');
    const [couponSearch, setCouponSearch] = useState('');

    // Shipping Management State
    const [countries, setCountries] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [showCountryModal, setShowCountryModal] = useState(false);
    const [showZoneModal, setShowZoneModal] = useState(false);
    const [newCountryData, setNewCountryData] = useState({ name: '', code: '' });
    const [editingZone, setEditingZone] = useState(null);
    const [newZoneData, setNewZoneData] = useState({ city: '', price: '', freeAbove: '', estimatedDays: '' });

    const handleLogout = () => {
        Alert.alert('تسجيل الخروج', 'هل أنت متأكد؟', [
            { text: 'إلغاء', style: 'cancel' },
            { text: 'خروج', style: 'destructive', onPress: () => { logout(); router.replace('/auth'); } }
        ]);
    };

    const handleDeleteAdmin = (adminId) => {
        Alert.alert('حذف المشرف', 'هل أنت متأكد من حذف هذا المشرف؟ ستتم إزالة صلاحياته الإدارية.', [
            { text: 'إلغاء', style: 'cancel' },
            {
                text: 'حذف', style: 'destructive', onPress: async () => {
                    try {
                        const success = await removeAdmin(adminId);
                        if (success) {
                            setAdmins(prev => prev.filter(a => a.id !== adminId));
                            Alert.alert('✅ تم', 'تمت إزالة صلاحيات المشرف بنجاح');
                        }
                    } catch (error) {
                        console.error('Error removing admin:', error);
                        Alert.alert('خطأ', 'حدث خطأ أثناء إزالة المشرف');
                    }
                }
            }
        ]);
    };

    const handleAddAdmin = async () => {
        if (!newAdmin.name || !newAdmin.email) {
            Alert.alert('تنبيه', 'يرجى ملء جميع الحقول');
            return;
        }

        try {
            const addedAdmin = await addOrUpdateAdmin(newAdmin);
            setAdmins(prev => [...prev, addedAdmin]);
            setShowAdminModal(false);
            setNewAdmin({ name: '', email: '', role: 'admin' });
            Alert.alert('✅ تم', `تمت إضافة ${newAdmin.name} كمشرف`);
        } catch (error) {
            console.error('Error adding admin:', error);
            Alert.alert('خطأ', 'حدث خطأ أثناء إضافة المشرف');
        }
    };
    const handleDeleteCoupon = (couponId) => {
        Alert.alert('حذف الكوبون', 'هل أنت متأكد؟ سيتم حذفه نهائياً من قاعدة البيانات.', [
            { text: 'إلغاء', style: 'cancel' },
            {
                text: 'حذف', style: 'destructive', onPress: async () => {
                    try {
                        const success = await deleteCoupon(couponId);
                        if (success) {
                            setCoupons(prev => prev.filter(c => c.id !== couponId));
                            Alert.alert('تم', 'تم حذف الكوبون بنجاح');
                        } else {
                            Alert.alert('خطأ', 'فشل في حذف الكوبون');
                        }
                    } catch (error) {
                        console.error('Error deleting coupon:', error);
                        Alert.alert('خطأ', 'حدث خطأ أثناء الحذف');
                    }
                }
            }
        ]);
    };

    const handleCreateCoupon = async () => {
        if (!newCoupon.code || !newCoupon.value) {
            Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        setSavingSettings(true);
        try {
            const created = await createCoupon(newCoupon);
            setCoupons(prev => [created, ...prev]);
            setShowCouponModal(false);
            setNewCoupon({ code: '', type: 'percentage', value: '', minOrder: '', maxUses: '', validUntil: '' });
            Alert.alert('تم', 'تم إنشاء الكوبون بنجاح وحفظه في السحاب');
        } catch (error) {
            console.error('Error creating coupon:', error);
            Alert.alert('خطأ', 'فشل في إنشاء الكوبون');
        } finally {
            setSavingSettings(false);
        }
    };

    const handleAddCountry = async () => {
        if (!newCountryData.name || !newCountryData.code) {
            Alert.alert('خطأ', 'يرجى إدخال اسم الدولة ورمزها');
            return;
        }
        setSavingSettings(true);
        try {
            const country = await addCountry(newCountryData.name, newCountryData.code);
            setCountries(prev => [...prev, country]);
            setSelectedCountry(country);
            setShowCountryModal(false);
            setNewCountryData({ name: '', code: '' });
            Alert.alert('تم', 'تمت إضافة الدولة بنجاح');
        } catch (error) {
            console.error('Error adding country:', error);
            Alert.alert('خطأ', 'فشل في إضافة الدولة');
        } finally {
            setSavingSettings(false);
        }
    };

    const handleDeleteCountry = (countryId) => {
        Alert.alert('حذف الدولة', 'هل أنت متأكد؟ سيتم حذف جميع مدن الشحن المرتبطة بهذه الدولة.', [
            { text: 'إلغاء', style: 'cancel' },
            {
                text: 'حذف', style: 'destructive', onPress: async () => {
                    try {
                        const success = await deleteCountry(countryId);
                        if (success) {
                            const updatedCountries = countries.filter(c => c.id !== countryId);
                            setCountries(updatedCountries);
                            if (selectedCountry?.id === countryId) {
                                setSelectedCountry(updatedCountries[0] || null);
                            }
                            Alert.alert('تم', 'تم حذف الدولة بنجاح');
                        }
                    } catch (error) {
                        console.error('Error deleting country:', error);
                    }
                }
            }
        ]);
    };

    const handleSaveZone = async () => {
        if (!newZoneData.city || !newZoneData.price) {
            Alert.alert('خطأ', 'يرجى إدخال اسم المدينة وسعر الشحن');
            return;
        }
        if (!selectedCountry) return;

        setSavingSettings(true);
        try {
            const zone = {
                ...newZoneData,
                id: editingZone?.id || Date.now().toString(),
                price: parseInt(newZoneData.price),
                freeAbove: parseInt(newZoneData.freeAbove) || 0
            };

            const success = await addUpdateZone(selectedCountry.id, zone);
            if (success) {
                // Update local state
                const updatedCountries = countries.map(c => {
                    if (c.id === selectedCountry.id) {
                        const zones = [...(c.zones || [])];
                        const idx = zones.findIndex(z => z.id === zone.id);
                        if (idx > -1) zones[idx] = zone;
                        else zones.push(zone);
                        const updated = { ...c, zones };
                        setSelectedCountry(updated);
                        return updated;
                    }
                    return c;
                });
                setCountries(updatedCountries);
                setShowZoneModal(false);
                setEditingZone(null);
                setNewZoneData({ city: '', price: '', freeAbove: '', estimatedDays: '' });
                Alert.alert('تم', 'تم حفظ بيانات المدينة بنجاح');
            }
        } catch (error) {
            console.error('Error saving zone:', error);
            Alert.alert('خطأ', 'فشل في حفظ البيانات');
        } finally {
            setSavingSettings(false);
        }
    };

    // Render General Settings Tab
    const renderGeneralTab = () => {
        // Find current currency label
        const currentCurrency = availableCurrencies.find(c => c.code === storeSettings.currency);

        return (
            <View style={styles.tabContent}>
                {/* Store Info - Now Editable! */}
                <View style={[styles.section, { backgroundColor: theme.backgroundCard }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>معلومات المتجر</Text>
                        {settingsLoading && <ActivityIndicator size="small" color={theme.primary} />}
                    </View>

                    {/* Store Name - Editable */}
                    <TouchableOpacity
                        style={styles.settingRow}
                        onPress={() => {
                            setEditValue(storeSettings.name);
                            setShowNameModal(true);
                        }}
                        disabled={savingSettings}
                    >
                        <View style={[styles.settingIcon, { backgroundColor: theme.primary + '20' }]}>
                            <Ionicons name="storefront" size={18} color={theme.primary} />
                        </View>
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingLabel, { color: theme.textSecondary }]}>اسم المتجر</Text>
                            <Text style={[styles.settingValue, { color: theme.text }]}>{storeSettings.name}</Text>
                        </View>
                        <View style={styles.editIndicator}>
                            <Ionicons name="create-outline" size={16} color={theme.primary} />
                            <Ionicons name="chevron-back" size={18} color={theme.textMuted} />
                        </View>
                    </TouchableOpacity>

                    {/* Currency - Editable */}
                    <TouchableOpacity
                        style={styles.settingRow}
                        onPress={() => setShowCurrencyModal(true)}
                        disabled={savingSettings}
                    >
                        <View style={[styles.settingIcon, { backgroundColor: '#F59E0B20' }]}>
                            <Ionicons name="cash" size={18} color="#F59E0B" />
                        </View>
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingLabel, { color: theme.textSecondary }]}>عملة التطبيق</Text>
                            <Text style={[styles.settingValue, { color: theme.text }]}>
                                {currentCurrency?.name || storeSettings.currency} ({currentCurrency?.symbol})
                            </Text>
                        </View>
                        <View style={styles.editIndicator}>
                            <Ionicons name="create-outline" size={16} color={theme.primary} />
                            <Ionicons name="chevron-back" size={18} color={theme.textMuted} />
                        </View>
                    </TouchableOpacity>

                    {/* Email - Editable */}
                    <TouchableOpacity
                        style={[styles.settingRow, { borderBottomWidth: 0 }]}
                        onPress={() => {
                            setEditValue(storeSettings.email);
                            setShowEmailModal(true);
                        }}
                        disabled={savingSettings}
                    >
                        <View style={[styles.settingIcon, { backgroundColor: '#10B98120' }]}>
                            <Ionicons name="mail" size={18} color="#10B981" />
                        </View>
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingLabel, { color: theme.textSecondary }]}>البريد الإلكتروني</Text>
                            <Text style={[styles.settingValue, { color: theme.text }]}>{storeSettings.email}</Text>
                        </View>
                        <View style={styles.editIndicator}>
                            <Ionicons name="create-outline" size={16} color={theme.primary} />
                            <Ionicons name="chevron-back" size={18} color={theme.textMuted} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Database Tools - Restore Products */}
                <View style={[styles.section, { backgroundColor: theme.backgroundCard }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>أدوات قاعدة البيانات</Text>

                    <TouchableOpacity
                        style={[styles.settingRow, { borderBottomWidth: 0 }]}
                        onPress={() => {
                            Alert.alert(
                                'استرجاع المنتجات الأصلية',
                                'سيتم حذف المنتجات الحالية واستبدالها بالـ 30 منتج أصلي. هل أنت متأكد؟',
                                [
                                    { text: 'إلغاء', style: 'cancel' },
                                    {
                                        text: 'نعم، استرجاع',
                                        onPress: async () => {
                                            try {
                                                const result = await syncMockProductsToFirestore();
                                                Alert.alert('تم بنجاح', `تم استرجاع ${result.success} منتج`);
                                            } catch (error) {
                                                Alert.alert('خطأ', 'حدث خطأ أثناء الاسترجاع');
                                                console.error(error);
                                            }
                                        }
                                    }
                                ]
                            );
                        }}
                    >
                        <View style={[styles.settingIcon, { backgroundColor: theme.primary + '20' }]}>
                            <Ionicons name="cloud-upload" size={18} color={theme.primary} />
                        </View>
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingLabel, { color: theme.textSecondary }]}>المنتجات</Text>
                            <Text style={[styles.settingValue, { color: theme.text }]}>استرجاع المنتجات الأصلية</Text>
                        </View>
                        <Ionicons name="chevron-back" size={18} color={theme.textMuted} />
                    </TouchableOpacity>
                </View>

                {/* Notifications */}
                <View style={[styles.section, { backgroundColor: theme.backgroundCard }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>الإشعارات</Text>

                    <View style={styles.toggleRow}>
                        <View style={styles.toggleInfo}>
                            <Ionicons name="notifications" size={20} color={theme.primary} />
                            <Text style={[styles.toggleLabel, { color: theme.text }]}>إشعارات الطلبات</Text>
                        </View>
                        <Switch value={true} trackColor={{ true: theme.primary }} />
                    </View>

                    <View style={styles.toggleRow}>
                        <View style={styles.toggleInfo}>
                            <Ionicons name="alert-circle" size={20} color="#F59E0B" />
                            <Text style={[styles.toggleLabel, { color: theme.text }]}>تنبيه نفاذ المخزون</Text>
                        </View>
                        <Switch value={true} trackColor={{ true: theme.primary }} />
                    </View>
                </View>

                {/* Admin Account */}
                <View style={[styles.section, { backgroundColor: theme.backgroundCard }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>الحساب</Text>

                    <View style={styles.accountCard}>
                        <View style={[styles.accountAvatar, { backgroundColor: theme.primary }]}>
                            <Ionicons name="person" size={24} color="#fff" />
                        </View>
                        <View style={styles.accountInfo}>
                            <Text style={[styles.accountName, { color: theme.text }]}>
                                {user?.displayName || 'المشرف'}
                            </Text>
                            <Text style={[styles.accountEmail, { color: theme.textSecondary }]}>
                                {user?.email || 'admin@kataraa.com'}
                            </Text>
                        </View>
                        <View style={[styles.roleBadge, { backgroundColor: '#EF444420' }]}>
                            <Ionicons name="shield" size={12} color="#EF4444" />
                            <Text style={[styles.roleText, { color: '#EF4444' }]}>
                                {ADMIN_ROLE_CONFIG[role]?.label || 'مشرف'}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.logoutBtn, { backgroundColor: '#EF444420' }]}
                        onPress={handleLogout}
                    >
                        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                        <Text style={styles.logoutText}>تسجيل الخروج</Text>
                    </TouchableOpacity>
                </View>

                {/* Quick Access to Admins & Coupons (to prevent "deleted" confusion) */}
                <View style={[styles.section, { backgroundColor: theme.backgroundCard }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>الوصول السريع</Text>

                    <TouchableOpacity
                        style={styles.settingRow}
                        onPress={() => setActiveTab('admins')}
                    >
                        <View style={[styles.settingIcon, { backgroundColor: '#8B5CF620' }]}>
                            <Ionicons name="people" size={18} color="#8B5CF6" />
                        </View>
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingLabel, { color: theme.textSecondary }]}>المشرفين</Text>
                            <Text style={[styles.settingValue, { color: theme.text }]}>إدارة {admins.length} مشرفين</Text>
                        </View>
                        <Ionicons name="chevron-back" size={18} color={theme.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.settingRow, { borderBottomWidth: 0 }]}
                        onPress={() => setActiveTab('coupons')}
                    >
                        <View style={[styles.settingIcon, { backgroundColor: '#EC489920' }]}>
                            <Ionicons name="pricetag" size={18} color="#EC4899" />
                        </View>
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingLabel, { color: theme.textSecondary }]}>الكوبونات</Text>
                            <Text style={[styles.settingValue, { color: theme.text }]}>إدارة {coupons.length} كوبونات خصم</Text>
                        </View>
                        <Ionicons name="chevron-back" size={18} color={theme.textMuted} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    // Render Admins Tab
    const renderAdminsTab = () => {
        const filteredAdminsList = admins.filter(admin =>
            admin.name.toLowerCase().includes(adminSearch.toLowerCase()) ||
            admin.email.toLowerCase().includes(adminSearch.toLowerCase())
        );

        return (
            <View style={styles.tabContent}>
                <View style={[styles.section, { backgroundColor: theme.backgroundCard }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>المشرفين ({filteredAdminsList.length})</Text>
                        <TouchableOpacity
                            style={[styles.addBtn, { backgroundColor: theme.primary }]}
                            onPress={() => setShowAdminModal(true)}
                        >
                            <Ionicons name="add" size={18} color="#fff" />
                            <Text style={styles.addBtnText}>إضافة</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Admin Search Bar */}
                    <View style={[styles.searchBarContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
                        <Ionicons name="search" size={18} color={theme.textMuted} />
                        <TextInput
                            style={[styles.searchBarInput, { color: theme.text }]}
                            placeholder="بحث عن مشرف بالاسم أو البريد..."
                            placeholderTextColor={theme.textMuted}
                            value={adminSearch}
                            onChangeText={setAdminSearch}
                        />
                    </View>

                    {filteredAdminsList.length === 0 ? (
                        <Text style={{ color: theme.textMuted, textAlign: 'center', marginVertical: 20 }}>
                            لا يوجد نتائج للبحث
                        </Text>
                    ) : filteredAdminsList.map((admin) => {
                        const roleConfig = ADMIN_ROLE_CONFIG[admin.role] || ADMIN_ROLE_CONFIG.admin;
                        const isAdminByEmail = admin.email === 'admin@kataraa.com';

                        return (
                            <View key={admin.id} style={styles.adminRow}>
                                <View style={[styles.adminAvatar, { backgroundColor: roleConfig.color }]}>
                                    <Ionicons name={roleConfig.icon} size={20} color="#fff" />
                                </View>
                                <View style={styles.adminInfo}>
                                    <Text style={[styles.adminName, { color: theme.text }]}>{admin.name}</Text>
                                    <Text style={[styles.adminEmail, { color: theme.textMuted }]}>{admin.email}</Text>
                                    <View style={[styles.adminRole, { backgroundColor: roleConfig.color + '20' }]}>
                                        <Text style={[styles.adminRoleText, { color: roleConfig.color }]}>
                                            {roleConfig.label}
                                        </Text>
                                    </View>
                                    {admin.status === 'pending' && (
                                        <View style={[styles.adminRole, { backgroundColor: '#9CA3AF20', marginTop: 4 }]}>
                                            <Text style={[styles.adminRoleText, { color: '#9CA3AF' }]}>قيد الانتظار</Text>
                                        </View>
                                    )}
                                </View>
                                {!isAdminByEmail && (
                                    <TouchableOpacity onPress={() => handleDeleteAdmin(admin.id)}>
                                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        );
                    })}
                </View>

                {/* Permissions Legend */}
                <View style={[styles.section, { backgroundColor: theme.backgroundCard }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>صلاحيات الأدوار</Text>
                    {Object.entries(ADMIN_ROLE_CONFIG).map(([key, config]) => (
                        <View key={key} style={styles.permissionRow}>
                            <View style={[styles.permissionDot, { backgroundColor: config.color }]} />
                            <Text style={[styles.permissionLabel, { color: theme.text }]}>{config.label}</Text>
                            <Text style={[styles.permissionList, { color: theme.textMuted }]}>
                                {config.permissions.join(', ')}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    // Render Coupons Tab
    const renderCouponsTab = () => {
        const filteredCoupons = coupons.filter(coupon =>
            coupon.code.toLowerCase().includes(couponSearch.toLowerCase())
        );

        return (
            <View style={styles.tabContent}>
                <View style={[styles.section, { backgroundColor: theme.backgroundCard }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>الكوبونات ({filteredCoupons.length})</Text>
                        <TouchableOpacity
                            style={[styles.addBtn, { backgroundColor: theme.primary }]}
                            onPress={() => setShowCouponModal(true)}
                        >
                            <Ionicons name="add" size={18} color="#fff" />
                            <Text style={styles.addBtnText}>إنشاء</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Coupon Search Bar */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <View style={[styles.searchBarContainer, { backgroundColor: theme.background, borderColor: theme.border, marginBottom: 0, flex: 1 }]}>
                            <Ionicons name="search" size={18} color={theme.textMuted} />
                            <TextInput
                                style={[styles.searchBarInput, { color: theme.text }]}
                                placeholder="بحث بكود الكوبون..."
                                placeholderTextColor={theme.textMuted}
                                value={couponSearch}
                                onChangeText={setCouponSearch}
                            />
                        </View>
                        <TouchableOpacity
                            style={[styles.syncBtn, { backgroundColor: theme.primary + '15' }]}
                            onPress={async () => {
                                try {
                                    setSettingsLoading(true);
                                    await initializeCoupons();
                                    await loadCoupons();
                                    Alert.alert('تم بنجاح', 'تمت مزامنة الكوبونات مع الكلاود');
                                } catch (e) {
                                    Alert.alert('خطأ', 'فشل في المزامنة');
                                } finally {
                                    setSettingsLoading(false);
                                }
                            }}
                        >
                            <Ionicons name="refresh" size={20} color={theme.primary} />
                        </TouchableOpacity>
                    </View>

                    {filteredCoupons.length === 0 ? (
                        <Text style={{ color: theme.textMuted, textAlign: 'center', marginVertical: 20 }}>
                            لا يوجد نتائج للبحث
                        </Text>
                    ) : filteredCoupons.map((coupon) => {
                        const typeConfig = COUPON_TYPE_CONFIG[coupon.type];
                        const isExpired = coupon.status === 'expired';

                        return (
                            <View
                                key={coupon.id}
                                style={[styles.couponRow, isExpired && { opacity: 0.5 }]}
                            >
                                <View style={[styles.couponIcon, { backgroundColor: typeConfig.color + '20' }]}>
                                    <Ionicons name={typeConfig.icon} size={20} color={typeConfig.color} />
                                </View>
                                <View style={styles.couponInfo}>
                                    <Text style={[styles.couponCode, { color: theme.text }]}>{coupon.code}</Text>
                                    <Text style={[styles.couponValue, { color: typeConfig.color }]}>
                                        {coupon.type === 'free_shipping'
                                            ? 'شحن مجاني'
                                            : `${coupon.value}${coupon.type === 'fixed' ? currencyService.adminCurrency : typeConfig.suffix}`
                                        }
                                        {coupon.minOrder > 0 && (
                                            <Text style={{ fontSize: 11, color: theme.textSecondary }}> (أقل طلب: {currencyService.formatAdminPrice(coupon.minOrder)})</Text>
                                        )}
                                    </Text>
                                    <View style={styles.couponMeta}>
                                        <Text style={[styles.couponUsage, { color: theme.textMuted }]}>
                                            {coupon.usedCount}/{coupon.maxUses} استخدام
                                        </Text>
                                        {coupon.validUntil && (
                                            <Text style={[styles.couponUsage, { color: theme.textMuted }]}>
                                                • ينتهي في {coupon.validUntil}
                                            </Text>
                                        )}
                                        <Text style={[
                                            styles.couponStatus,
                                            { color: isExpired ? '#EF4444' : '#10B981', marginRight: 'auto' }
                                        ]}>
                                            {isExpired ? 'منتهي' : 'نشط'}
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={() => handleDeleteCoupon(coupon.id)}>
                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    };

    // Render Shipping Tab
    const renderShippingTab = () => (
        <View style={styles.tabContent}>
            {/* Country Selector & Management */}
            <View style={[styles.section, { backgroundColor: theme.backgroundCard }]}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>إدارة الدول ({countries.length})</Text>
                    <TouchableOpacity
                        style={[styles.addBtn, { backgroundColor: theme.primary }]}
                        onPress={() => setShowCountryModal(true)}
                    >
                        <Ionicons name="globe-outline" size={18} color="#fff" />
                        <Text style={styles.addBtnText}>إضافة دولة</Text>
                    </TouchableOpacity>
                </View>

                {countries.length === 0 ? (
                    <Text style={{ textAlign: 'center', padding: 20, color: theme.textMuted }}>لم يتم إضافة دول بعد</Text>
                ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.countryPicker}>
                        {countries.map(country => (
                            <TouchableOpacity
                                key={country.id}
                                style={[
                                    styles.countryChip,
                                    selectedCountry?.id === country.id && { backgroundColor: theme.primary, borderColor: theme.primary }
                                ]}
                                onPress={() => setSelectedCountry(country)}
                            >
                                <Text style={[
                                    styles.countryChipText,
                                    selectedCountry?.id === country.id && { color: '#fff' }
                                ]}>
                                    {country.name} ({country.code})
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </View>

            {/* Selected Country Zones */}
            {selectedCountry && (
                <View style={[styles.section, { backgroundColor: theme.backgroundCard }]}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>مناطق الشحن: {selectedCountry.name}</Text>
                            <Text style={{ fontSize: 12, color: theme.textMuted }}>{selectedCountry.zones?.length || 0} منطقة</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity
                                style={[styles.addBtn, { backgroundColor: '#EF4444' }]}
                                onPress={() => handleDeleteCountry(selectedCountry.id)}
                            >
                                <Ionicons name="trash-outline" size={18} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.addBtn, { backgroundColor: theme.primary }]}
                                onPress={() => {
                                    setEditingZone(null);
                                    setNewZoneData({ city: '', price: '', freeAbove: '', estimatedDays: '' });
                                    setShowZoneModal(true);
                                }}
                            >
                                <Ionicons name="add" size={18} color="#fff" />
                                <Text style={styles.addBtnText}>منطقة</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {(selectedCountry.zones || []).length === 0 ? (
                        <Text style={{ textAlign: 'center', padding: 20, color: theme.textMuted }}>لا توجد مناطق شحن مضافة لهذه الدولة</Text>
                    ) : (
                        selectedCountry.zones.map((zone) => (
                            <View key={zone.id} style={styles.deliveryRow}>
                                <View style={styles.deliveryInfo}>
                                    <Text style={[styles.deliveryCity, { color: theme.text }]}>{zone.city}</Text>
                                    <Text style={[styles.deliveryDays, { color: theme.textMuted }]}>
                                        {zone.estimatedDays || '1-3'} أيام
                                    </Text>
                                </View>
                                <View style={styles.deliveryPricing}>
                                    <Text style={[styles.deliveryPrice, { color: theme.primary }]}>
                                        {currencyService.formatAdminPrice(zone.price)}
                                    </Text>
                                    <Text style={[styles.freeAbove, { color: theme.textSecondary }]}>
                                        مجاني فوق {currencyService.formatAdminPrice(zone.freeAbove)}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => {
                                        setEditingZone(zone);
                                        setNewZoneData({
                                            city: zone.city,
                                            price: zone.price.toString(),
                                            freeAbove: zone.freeAbove.toString(),
                                            estimatedDays: zone.estimatedDays
                                        });
                                        setShowZoneModal(true);
                                    }}
                                >
                                    <Ionicons name="create-outline" size={20} color={theme.primary} />
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                </View>
            )}
        </View>
    );

    // Render Taxes Tab
    const renderTaxesTab = () => (
        <View style={styles.tabContent}>
            <View style={[styles.section, { backgroundColor: theme.backgroundCard }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>إعدادات الضريبة</Text>

                <View style={styles.toggleRow}>
                    <View style={styles.toggleInfo}>
                        <Ionicons name="calculator" size={20} color={theme.primary} />
                        <Text style={[styles.toggleLabel, { color: theme.text }]}>تفعيل الضريبة (TVA)</Text>
                    </View>
                    <Switch
                        value={taxEnabled}
                        onValueChange={setTaxEnabled}
                        trackColor={{ true: theme.primary }}
                    />
                </View>

                {taxEnabled && (
                    <>
                        <View style={styles.taxInputRow}>
                            <Text style={[styles.taxLabel, { color: theme.text }]}>نسبة الضريبة</Text>
                            <View style={[styles.taxInput, { backgroundColor: theme.background }]}>
                                <TextInput
                                    style={[styles.taxInputText, { color: theme.text }]}
                                    value={taxRate}
                                    onChangeText={setTaxRate}
                                    keyboardType="numeric"
                                />
                                <Text style={[styles.taxInputSuffix, { color: theme.textMuted }]}>%</Text>
                            </View>
                        </View>

                        <View style={styles.toggleRow}>
                            <View style={styles.toggleInfo}>
                                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                <Text style={[styles.toggleLabel, { color: theme.text }]}>الضريبة مضمنة في السعر</Text>
                            </View>
                            <Switch value={true} trackColor={{ true: theme.primary }} />
                        </View>

                        <View style={[styles.taxExample, { backgroundColor: theme.background }]}>
                            <Text style={[styles.taxExampleTitle, { color: theme.textSecondary }]}>مثال:</Text>
                            <Text style={[styles.taxExampleText, { color: theme.text }]}>
                                منتج بسعر {currencyService.formatAdminPrice(100)} = {currencyService.formatAdminPrice(83.33)} + {taxRate}% TVA
                            </Text>
                        </View>
                    </>
                )}
            </View>
        </View>
    );

    // Render Coupon Modal
    const renderCouponModal = () => (
        <Modal visible={showCouponModal} animationType="slide" presentationStyle="pageSheet">
            <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
                <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                    <TouchableOpacity onPress={() => setShowCouponModal(false)}>
                        <Text style={[styles.modalCancel, { color: theme.textSecondary }]}>إلغاء</Text>
                    </TouchableOpacity>
                    <Text style={[styles.modalTitle, { color: theme.text }]}>كوبون جديد</Text>
                    <TouchableOpacity onPress={handleCreateCoupon}>
                        <Text style={[styles.modalSave, { color: theme.primary }]}>حفظ</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent}>
                    <View style={[styles.inputGroup, { backgroundColor: theme.backgroundCard }]}>
                        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>كود الكوبون</Text>
                        <View style={styles.codeInputRow}>
                            <TextInput
                                style={[styles.input, { color: theme.text, flex: 1 }]}
                                value={newCoupon.code}
                                onChangeText={(v) => setNewCoupon(p => ({ ...p, code: v.toUpperCase() }))}
                                placeholder="مثال: SAVE20"
                                placeholderTextColor={theme.textMuted}
                                autoCapitalize="characters"
                            />
                            <TouchableOpacity
                                style={[styles.generateBtn, { backgroundColor: theme.primary }]}
                                onPress={() => setNewCoupon(p => ({ ...p, code: generateCouponCode() }))}
                            >
                                <Ionicons name="refresh" size={18} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.typeSelector}>
                        {Object.entries(COUPON_TYPE_CONFIG).map(([key, config]) => (
                            <TouchableOpacity
                                key={key}
                                style={[
                                    styles.typeOption,
                                    {
                                        backgroundColor: newCoupon.type === key
                                            ? theme.primary
                                            : theme.backgroundCard
                                    }
                                ]}
                                onPress={() => setNewCoupon(p => ({ ...p, type: key }))}
                            >
                                <Ionicons
                                    name={config.icon}
                                    size={20}
                                    color={newCoupon.type === key ? '#fff' : theme.text}
                                />
                                <Text style={[
                                    styles.typeLabel,
                                    { color: newCoupon.type === key ? '#fff' : theme.text }
                                ]}>
                                    {config.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {newCoupon.type !== 'free_shipping' && (
                        <View style={[styles.inputGroup, { backgroundColor: theme.backgroundCard }]}>
                            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                                {newCoupon.type === 'percentage' ? 'النسبة (%)' : `المبلغ (${currencyService.adminCurrency})`}
                            </Text>
                            <TextInput
                                style={[styles.input, { color: theme.text }]}
                                value={newCoupon.value}
                                onChangeText={(v) => setNewCoupon(p => ({ ...p, value: v }))}
                                placeholder="0"
                                placeholderTextColor={theme.textMuted}
                                keyboardType="numeric"
                            />
                        </View>
                    )}

                    <View style={[styles.inputGroup, { backgroundColor: theme.backgroundCard }]}>
                        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>الحد الأدنى للطلب ({currencyService.adminCurrency})</Text>
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            value={newCoupon.minOrder}
                            onChangeText={(v) => setNewCoupon(p => ({ ...p, minOrder: v }))}
                            placeholder="0"
                            placeholderTextColor={theme.textMuted}
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={[styles.inputGroup, { backgroundColor: theme.backgroundCard }]}>
                        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>الحد الأقصى للاستخدام</Text>
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            value={newCoupon.maxUses}
                            onChangeText={(v) => setNewCoupon(p => ({ ...p, maxUses: v }))}
                            placeholder="100"
                            placeholderTextColor={theme.textMuted}
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={[styles.inputGroup, { backgroundColor: theme.backgroundCard }]}>
                        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>تاريخ انتهاء الصلاحية</Text>
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            value={newCoupon.validUntil}
                            onChangeText={(v) => setNewCoupon(p => ({ ...p, validUntil: v }))}
                            placeholder="YYYY-MM-DD (مثال: 2026-12-31)"
                            placeholderTextColor={theme.textMuted}
                        />
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );

    const renderTabContent = () => {
        // Extra protection for sensitive tabs (uncomment later if needed)
        /*
        if (activeTab === 'admins' && role !== USER_ROLES.SUPER_ADMIN && role !== USER_ROLES.ADMIN) {
            return (
                <View style={styles.tabContent}>
                    <Text style={{ color: theme.textMuted, textAlign: 'center', marginTop: 20 }}>
                        لا تملك صلاحية الوصول لهذه الصفحة
                    </Text>
                </View>
            );
        }
        */

        switch (activeTab) {
            case 'general': return renderGeneralTab();
            case 'admins': return renderAdminsTab();
            case 'coupons': return renderCouponsTab();
            case 'shipping': return renderShippingTab();
            case 'taxes': return renderTaxesTab();
            default: return renderGeneralTab();
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* 1. Header Area with Tabs included in the same vertical flow to prevent large gaps */}
            <View style={{ zIndex: 10 }}>
                <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.header}>
                    <SafeAreaView edges={['top']}>
                        <View style={styles.headerRow}>
                            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                                <Ionicons name="arrow-back" size={24} color="#fff" />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>الإعدادات</Text>
                            <View style={styles.placeholder} />
                        </View>
                    </SafeAreaView>
                </LinearGradient>

                {/* Tabs directly under header (visually merged) */}
                <View style={[styles.tabsWrapper, { backgroundColor: theme.background }]}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={[styles.tabsContainer, { flexDirection: 'row-reverse', paddingHorizontal: 16 }]}
                    >
                        <View style={{ flexDirection: 'row-reverse' }}>
                            {filteredTabs.map((tab) => (
                                <TouchableOpacity
                                    key={tab.id}
                                    style={[
                                        styles.tab,
                                        {
                                            backgroundColor: activeTab === tab.id ? theme.primary : theme.backgroundCard,
                                            borderColor: activeTab === tab.id ? theme.primary : theme.border,
                                            borderWidth: 1,
                                            marginHorizontal: 4,
                                        }
                                    ]}
                                    onPress={() => setActiveTab(tab.id)}
                                >
                                    <Ionicons
                                        name={tab.icon}
                                        size={18}
                                        color={activeTab === tab.id ? '#fff' : theme.text}
                                    />
                                    <Text style={[
                                        styles.tabLabel,
                                        { color: activeTab === tab.id ? '#fff' : theme.text }
                                    ]}>
                                        {tab.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </View>
            </View>

            {/* 2. Main Content - Starts immediately after Tabs */}
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {renderTabContent()}
                <View style={styles.bottomPadding} />
            </ScrollView>

            {/* ==========================================
                🏪 STORE SETTINGS EDIT MODALS
            ========================================== */}

            {/* Store Name Edit Modal */}
            <Modal visible={showNameModal} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.editModalContainer, { backgroundColor: theme.backgroundCard }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                            <TouchableOpacity onPress={() => setShowNameModal(false)}>
                                <Text style={[styles.modalCancel, { color: theme.textSecondary }]}>إلغاء</Text>
                            </TouchableOpacity>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>تعديل اسم المتجر</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    if (editValue.trim()) {
                                        saveSetting('name', editValue.trim());
                                        setShowNameModal(false);
                                    }
                                }}
                                disabled={savingSettings}
                            >
                                {savingSettings ? (
                                    <ActivityIndicator size="small" color={theme.primary} />
                                ) : (
                                    <Text style={[styles.modalSave, { color: theme.primary }]}>حفظ</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                        <View style={styles.editModalContent}>
                            <Text style={[styles.editModalLabel, { color: theme.textSecondary }]}>اسم المتجر</Text>
                            <TextInput
                                style={[styles.editModalInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                value={editValue}
                                onChangeText={setEditValue}
                                placeholder="أدخل اسم المتجر"
                                placeholderTextColor={theme.textMuted}
                                autoFocus
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Email Edit Modal */}
            <Modal visible={showEmailModal} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.editModalContainer, { backgroundColor: theme.backgroundCard }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                            <TouchableOpacity onPress={() => setShowEmailModal(false)}>
                                <Text style={[styles.modalCancel, { color: theme.textSecondary }]}>إلغاء</Text>
                            </TouchableOpacity>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>تعديل البريد الإلكتروني</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    if (editValue.trim()) {
                                        saveSetting('email', editValue.trim());
                                        setShowEmailModal(false);
                                    }
                                }}
                                disabled={savingSettings}
                            >
                                {savingSettings ? (
                                    <ActivityIndicator size="small" color={theme.primary} />
                                ) : (
                                    <Text style={[styles.modalSave, { color: theme.primary }]}>حفظ</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                        <View style={styles.editModalContent}>
                            <Text style={[styles.editModalLabel, { color: theme.textSecondary }]}>البريد الإلكتروني</Text>
                            <TextInput
                                style={[styles.editModalInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                value={editValue}
                                onChangeText={setEditValue}
                                placeholder="example@email.com"
                                placeholderTextColor={theme.textMuted}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoFocus
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Currency Picker Modal */}
            <Modal visible={showCurrencyModal} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.editModalContainer, { backgroundColor: theme.backgroundCard, maxHeight: '70%' }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                            <TouchableOpacity onPress={() => setShowCurrencyModal(false)}>
                                <Text style={[styles.modalCancel, { color: theme.textSecondary }]}>إلغاء</Text>
                            </TouchableOpacity>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>اختر العملة</Text>
                            <View style={{ width: 50 }} />
                        </View>
                        <ScrollView style={styles.currencyList}>
                            {availableCurrencies.map((currency) => (
                                <TouchableOpacity
                                    key={currency.code}
                                    style={[
                                        styles.currencyOption,
                                        { borderBottomColor: theme.border },
                                        storeSettings.currency === currency.code && { backgroundColor: theme.primary + '15' }
                                    ]}
                                    onPress={async () => {
                                        await saveSetting('currency', currency.code);
                                        setShowCurrencyModal(false);
                                    }}
                                    disabled={savingSettings}
                                >
                                    <View style={styles.currencyInfo}>
                                        <Text style={[styles.currencySymbol, { color: theme.primary }]}>{currency.symbol}</Text>
                                        <View>
                                            <Text style={[styles.currencyName, { color: theme.text }]}>{currency.name}</Text>
                                            <Text style={[styles.currencyCode, { color: theme.textMuted }]}>{currency.code}</Text>
                                        </View>
                                    </View>
                                    {storeSettings.currency === currency.code && (
                                        <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Coupon Modal */}
            {renderCouponModal()}

            {/* Add Admin Modal */}
            <Modal visible={showAdminModal} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.editModalContainer, { backgroundColor: theme.backgroundCard }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                            <TouchableOpacity onPress={() => setShowAdminModal(false)}>
                                <Text style={[styles.modalCancel, { color: theme.textSecondary }]}>إلغاء</Text>
                            </TouchableOpacity>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>إضافة مشرف جديد</Text>
                            <TouchableOpacity onPress={handleAddAdmin} disabled={savingSettings}>
                                <Text style={[styles.modalSave, { color: theme.primary }]}>إضافة</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.editModalContent}>
                            <Text style={[styles.editModalLabel, { color: theme.textSecondary }]}>الاسم</Text>
                            <TextInput
                                style={[styles.editModalInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                value={newAdmin.name}
                                onChangeText={v => setNewAdmin(prev => ({ ...prev, name: v }))}
                                placeholder="اسم المشرف"
                                placeholderTextColor={theme.textMuted}
                            />
                            <View style={{ height: 16 }} />
                            <Text style={[styles.editModalLabel, { color: theme.textSecondary }]}>البريد الإلكتروني</Text>
                            <TextInput
                                style={[styles.editModalInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                value={newAdmin.email}
                                onChangeText={v => setNewAdmin(prev => ({ ...prev, email: v }))}
                                placeholder="example@email.com"
                                placeholderTextColor={theme.textMuted}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <View style={{ height: 16 }} />
                            <Text style={[styles.editModalLabel, { color: theme.textSecondary }]}>الدور / الصلاحيات</Text>
                            <View style={styles.typeSelector}>
                                {Object.entries(ADMIN_ROLE_CONFIG).map(([key, config]) => (
                                    <TouchableOpacity
                                        key={key}
                                        style={[
                                            styles.typeOption,
                                            { backgroundColor: theme.background },
                                            newAdmin.role === key && { borderColor: theme.primary, borderWidth: 2 }
                                        ]}
                                        onPress={() => setNewAdmin(prev => ({ ...prev, role: key }))}
                                    >
                                        <Ionicons name={config.icon} size={20} color={newAdmin.role === key ? theme.primary : theme.textMuted} />
                                        <Text style={[styles.typeLabel, { color: newAdmin.role === key ? theme.primary : theme.text }]}>
                                            {config.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Country Management Modal */}
            <Modal visible={showCountryModal} animationType="fade" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.editModalContainer, { backgroundColor: theme.backgroundCard }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                            <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                                <Text style={[styles.modalCancel, { color: theme.textSecondary }]}>إلغاء</Text>
                            </TouchableOpacity>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>إضافة دولة جديدة</Text>
                            <TouchableOpacity onPress={handleAddCountry} disabled={savingSettings}>
                                <Text style={[styles.modalSave, { color: theme.primary }]}>إضافة</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.editModalContent}>
                            <Text style={[styles.editModalLabel, { color: theme.textSecondary }]}>اسم الدولة (مثلاً: المغرب)</Text>
                            <TextInput
                                style={[styles.editModalInput, { color: theme.text, borderColor: theme.border }]}
                                value={newCountryData.name}
                                onChangeText={v => setNewCountryData(prev => ({ ...prev, name: v }))}
                                placeholder="المغرب"
                            />
                            <View style={{ height: 16 }} />
                            <Text style={[styles.editModalLabel, { color: theme.textSecondary }]}>رمز الدولة (مثلاً: MA)</Text>
                            <TextInput
                                style={[styles.editModalInput, { color: theme.text, borderColor: theme.border }]}
                                value={newCountryData.code}
                                onChangeText={v => setNewCountryData(prev => ({ ...prev, code: v }))}
                                placeholder="MA"
                                autoCapitalize="characters"
                                maxLength={3}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* View/Edit Zone Modal */}
            <Modal visible={showZoneModal} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.editModalContainer, { backgroundColor: theme.backgroundCard }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                            <TouchableOpacity onPress={() => { setShowZoneModal(false); setEditingZone(null); }}>
                                <Text style={[styles.modalCancel, { color: theme.textSecondary }]}>إلغاء</Text>
                            </TouchableOpacity>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>
                                {editingZone ? 'تعديل منطقة' : 'إضافة منطقة شحن'}
                            </Text>
                            <TouchableOpacity onPress={handleSaveZone} disabled={savingSettings}>
                                <Text style={[styles.modalSave, { color: theme.primary }]}>حفظ</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.editModalContent}>
                            <Text style={[styles.editModalLabel, { color: theme.textSecondary }]}>اسم المدينة/المنطقة</Text>
                            <TextInput
                                style={[styles.editModalInput, { color: theme.text, borderColor: theme.border }]}
                                value={newZoneData.city}
                                onChangeText={v => setNewZoneData(prev => ({ ...prev, city: v }))}
                                placeholder="الدار البيضاء"
                            />
                            <View style={{ height: 16 }} />
                            <View style={{ flexDirection: 'row-reverse', gap: 12 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.editModalLabel, { color: theme.textSecondary }]}>سعر الشحن</Text>
                                    <TextInput
                                        style={[styles.editModalInput, { color: theme.text, borderColor: theme.border }]}
                                        value={newZoneData.price}
                                        onChangeText={v => setNewZoneData(prev => ({ ...prev, price: v }))}
                                        keyboardType="numeric"
                                        placeholder="0"
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.editModalLabel, { color: theme.textSecondary }]}>توصيل مجاني فوق</Text>
                                    <TextInput
                                        style={[styles.editModalInput, { color: theme.text, borderColor: theme.border }]}
                                        value={newZoneData.freeAbove}
                                        onChangeText={v => setNewZoneData(prev => ({ ...prev, freeAbove: v }))}
                                        keyboardType="numeric"
                                        placeholder="300"
                                    />
                                </View>
                            </View>
                            <View style={{ height: 16 }} />
                            <Text style={[styles.editModalLabel, { color: theme.textSecondary }]}>مدة التوصيل (أيام)</Text>
                            <TextInput
                                style={[styles.editModalInput, { color: theme.text, borderColor: theme.border }]}
                                value={newZoneData.estimatedDays}
                                onChangeText={v => setNewZoneData(prev => ({ ...prev, estimatedDays: v }))}
                                placeholder="1-3"
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const getStyles = (theme, isDark) => StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingBottom: 20, // Increased to provide background for tabs interaction if needed, or visual overlap
        paddingTop: 0,
    },
    headerRow: {
        paddingHorizontal: 16,
        paddingTop: 8,
        flexDirection: 'row-reverse', // RTL Header
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    placeholder: {
        width: 40,
    },
    tabsWrapper: {
        marginTop: -20, // Negative margin to pull tabs slightly up over the gradient or just tight
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 16,
    },
    tabsContainer: {
        paddingHorizontal: 16,
        paddingBottom: 4,
    },
    tab: {
        flexDirection: 'row-reverse', // RTL within tab
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        marginLeft: 10, // Left margin because it's RTL list
        minWidth: 80,
        height: 40,
        justifyContent: 'center',
        gap: 8,
    },
    tabLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingTop: 0, // Ensure no top padding
    },
    tabContent: {
        marginTop: 4, // Very minimal margin from tabs
    },
    section: {
        marginHorizontal: 16,
        marginBottom: 16,
        marginTop: 0, // Explicitly 0
        padding: 16,
        borderRadius: 16,
    },
    sectionHeader: {
        flexDirection: 'row-reverse', // RTL
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'right', // RTL
    },
    addBtn: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 4,
    },
    addBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    settingRow: {
        flexDirection: 'row-reverse', // RTL
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        gap: 12,
    },
    settingIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingInfo: {
        flex: 1,
        alignItems: 'flex-end',
    },
    settingLabel: {
        fontSize: 12,
        textAlign: 'right', // RTL
    },
    settingValue: {
        fontSize: 15,
        fontWeight: '500',
        marginTop: 2,
        textAlign: 'right', // RTL
    },
    toggleRow: {
        flexDirection: 'row-reverse', // RTL
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    toggleInfo: {
        flexDirection: 'row-reverse', // RTL
        alignItems: 'center',
        gap: 12,
    },
    toggleLabel: {
        fontSize: 15,
        textAlign: 'right',
    },
    accountCard: {
        flexDirection: 'row-reverse', // RTL
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    accountAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    accountInfo: {
        flex: 1,
        alignItems: 'flex-end', // Align text to right
    },
    accountName: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'right',
    },
    accountEmail: {
        fontSize: 13,
        marginTop: 2,
        textAlign: 'right',
    },
    roleBadge: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    roleText: {
        fontSize: 11,
        fontWeight: '600',
    },
    logoutBtn: {
        flexDirection: 'row-reverse', // RTL
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 12,
        gap: 8,
    },
    logoutText: {
        color: '#EF4444',
        fontSize: 15,
        fontWeight: '600',
    },
    adminRow: {
        flexDirection: 'row-reverse', // RTL
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        gap: 12,
    },
    adminAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    adminInfo: {
        flex: 1,
        alignItems: 'flex-end', // Right align
    },
    adminName: {
        fontSize: 15,
        fontWeight: '600',
        textAlign: 'right',
    },
    adminEmail: {
        fontSize: 12,
        marginTop: 2,
        textAlign: 'right',
    },
    adminRole: {
        alignSelf: 'flex-end', // RTL
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        marginTop: 6,
    },
    adminRoleText: {
        fontSize: 10,
        fontWeight: '600',
    },
    permissionRow: {
        flexDirection: 'row-reverse', // RTL
        alignItems: 'center',
        paddingVertical: 8,
    },
    permissionDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginLeft: 10, // Left margin for dot in RTL
        marginRight: 0,
    },
    permissionLabel: {
        width: 100,
        fontSize: 13,
        fontWeight: '500',
        textAlign: 'right',
    },
    permissionList: {
        flex: 1,
        fontSize: 11,
        textAlign: 'right',
    },
    couponRow: {
        flexDirection: 'row-reverse', // RTL
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        gap: 12,
    },
    couponIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    couponInfo: {
        flex: 1,
        alignItems: 'flex-end', // Right align
    },
    couponCode: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'right',
    },
    couponValue: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 2,
        textAlign: 'right',
    },
    couponMeta: {
        flexDirection: 'row-reverse', // RTL
        alignItems: 'center',
        gap: 12,
        marginTop: 4,
    },
    couponUsage: {
        fontSize: 11,
        textAlign: 'right',
    },
    couponStatus: {
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'right',
    },
    deliveryRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    deliveryInfo: {
        flex: 1,
        marginRight: 12,
        alignItems: 'flex-end', // Right align text block
    },
    deliveryCity: {
        fontSize: 15,
        fontWeight: '600',
        textAlign: 'right',
    },
    deliveryDays: {
        fontSize: 12,
        marginTop: 4,
        textAlign: 'right',
    },
    deliveryPricing: {
        alignItems: 'flex-end', // Align inputs to right/end
    },
    priceInput: {
        flexDirection: 'row-reverse', // Input RTL
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 4,
    },
    priceInputText: {
        fontSize: 16,
        fontWeight: '600',
        minWidth: 40,
        textAlign: 'center',
    },
    priceInputSuffix: {
        fontSize: 12,
    },
    freeAbove: {
        fontSize: 11,
        marginTop: 4,
        textAlign: 'right',
    },
    taxInputRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    taxLabel: {
        fontSize: 15,
        textAlign: 'right',
    },
    taxInput: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        gap: 4,
    },
    taxInputText: {
        fontSize: 18,
        fontWeight: '600',
        minWidth: 40,
        textAlign: 'center',
    },
    taxInputSuffix: {
        fontSize: 14,
    },
    taxExample: {
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
    },
    taxExampleTitle: {
        fontSize: 12,
        marginBottom: 4,
        textAlign: 'right',
        alignSelf: 'flex-end',
    },
    taxExampleText: {
        fontSize: 14,
        textAlign: 'right',
    },
    bottomPadding: {
        height: 100,
    },
    searchBarContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        marginBottom: 16,
        gap: 8,
    },
    searchBarInput: {
        flex: 1,
        fontSize: 14,
        textAlign: 'right',
    },
    syncBtn: {
        width: 46,
        height: 46,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Modal styles
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row-reverse', // RTL
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    modalCancel: {
        fontSize: 16,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    modalSave: {
        fontSize: 16,
        fontWeight: '600',
    },
    modalContent: {
        flex: 1,
        padding: 16,
    },
    inputGroup: {
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    inputLabel: {
        fontSize: 12,
        marginBottom: 6,
        textAlign: 'right',
    },
    input: {
        fontSize: 16,
        padding: 0,
        textAlign: 'right',
    },
    codeInputRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8,
    },
    generateBtn: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    typeSelector: {
        flexDirection: 'row-reverse',
        gap: 8,
        marginBottom: 16,
    },
    typeOption: {
        flex: 1,
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    typeLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    // ==========================================
    // 🏪 EDIT MODALS STYLES
    // ==========================================
    editIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    editModalContainer: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
    },
    editModalContent: {
        padding: 20,
    },
    editModalLabel: {
        fontSize: 14,
        marginBottom: 8,
        textAlign: 'right',
    },
    editModalInput: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        textAlign: 'right',
    },
    // Currency Picker Styles
    currencyList: {
        maxHeight: 400,
    },
    currencyOption: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    currencyInfo: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 12,
    },
    currencySymbol: {
        fontSize: 24,
        fontWeight: 'bold',
        width: 50,
        textAlign: 'center',
    },
    currencyName: {
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'right',
    },
    currencyCode: {
        fontSize: 12,
        textAlign: 'right',
    },
    // Dynamic Shipping Styles
    countryPicker: {
        flexDirection: 'row-reverse',
        paddingVertical: 10,
    },
    countryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: theme.background,
        borderWidth: 1,
        borderColor: theme.border,
        marginLeft: 8,
    },
    countryChipText: {
        fontSize: 14,
        fontWeight: '500',
    },
    deliveryPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'right',
    },
    freeAbove: {
        fontSize: 11,
        marginTop: 2,
        textAlign: 'right',
    },
});
