import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import PremiumBackground from './PremiumBackground';

const SavedAddresses = ({ onClose, addresses, setAddresses }) => {
    // Local state removed, using props now

    const [showAddModal, setShowAddModal] = useState(false);
    const [newAddress, setNewAddress] = useState({ label: '', name: '', address: '', phone: '' });

    const handleDelete = (id) => {
        Alert.alert(
            "Delete Address",
            "Are you sure you want to delete this address?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => setAddresses(addresses.filter(a => a.id !== id)) }
            ]
        );
    };

    const handleAddAddress = () => {
        if (!newAddress.label || !newAddress.address) {
            Alert.alert("Error", "Please fill in at least Label and Address");
            return;
        }
        const address = {
            id: Date.now().toString(),
            ...newAddress,
            isDefault: addresses.length === 0
        };
        setAddresses([...addresses, address]);
        setShowAddModal(false);
        setNewAddress({ label: '', name: '', address: '', phone: '' });
    };

    const renderAddressItem = ({ item, index }) => (
        <Animated.View entering={FadeInDown.delay(index * 100).springify()} style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.labelContainer}>
                    <Ionicons name={item.label.toLowerCase() === 'home' ? 'home' : item.label.toLowerCase() === 'work' ? 'briefcase' : 'location'} size={18} color="#fff" />
                    <Text style={styles.label}>{item.label}</Text>
                    {item.isDefault && <View style={styles.defaultBadge}><Text style={styles.defaultText}>Default</Text></View>}
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Ionicons name="trash-outline" size={20} color="#ff4444" />
                </TouchableOpacity>
            </View>

            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.address}>{item.address}</Text>
            <Text style={styles.phone}>{item.phone}</Text>

            <TouchableOpacity style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <PremiumBackground>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Saved Addresses</Text>
                    <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButton}>
                        <Ionicons name="add" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={addresses}
                    renderItem={renderAddressItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="location-outline" size={60} color="rgba(255,255,255,0.5)" />
                            <Text style={styles.emptyText}>No saved addresses</Text>
                        </View>
                    }
                />

                <Modal visible={showAddModal} animationType="slide" transparent={true}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Add New Address</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Label (e.g. Home)"
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                value={newAddress.label}
                                onChangeText={t => setNewAddress({ ...newAddress, label: t })}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Full Name"
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                value={newAddress.name}
                                onChangeText={t => setNewAddress({ ...newAddress, name: t })}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Address"
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                value={newAddress.address}
                                onChangeText={t => setNewAddress({ ...newAddress, address: t })}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Phone Number"
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                value={newAddress.phone}
                                onChangeText={t => setNewAddress({ ...newAddress, phone: t })}
                            />

                            <View style={styles.modalButtons}>
                                <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setShowAddModal(false)}>
                                    <Text style={styles.btnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleAddAddress}>
                                    <Text style={styles.btnText}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </PremiumBackground>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 50 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
    backButton: { padding: 5 },
    addButton: { padding: 5 },
    listContent: { padding: 20 },
    card: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    labelContainer: { flexDirection: 'row', alignItems: 'center' },
    label: { fontSize: 16, fontWeight: '700', color: '#fff', marginLeft: 8, marginRight: 10 },
    defaultBadge: {
        backgroundColor: 'rgba(102, 126, 234, 0.3)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 5,
    },
    defaultText: { color: '#fff', fontSize: 10, fontWeight: '600' },
    name: { fontSize: 15, color: '#fff', marginBottom: 4 },
    address: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
    phone: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 10 },
    editButton: {
        alignSelf: 'flex-start',
        paddingHorizontal: 15,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    editButtonText: { color: '#fff', fontSize: 12 },
    emptyContainer: { alignItems: 'center', marginTop: 50 },
    emptyText: { color: 'rgba(255,255,255,0.6)', marginTop: 10 },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#2d3436',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    modalTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 20, textAlign: 'center' },
    input: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 10,
        padding: 12,
        color: '#fff',
        marginBottom: 15,
    },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    modalBtn: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    cancelBtn: { backgroundColor: 'rgba(255, 68, 68, 0.3)' },
    saveBtn: { backgroundColor: '#667eea' },
    btnText: { color: '#fff', fontWeight: '600' },
});

export default SavedAddresses;
