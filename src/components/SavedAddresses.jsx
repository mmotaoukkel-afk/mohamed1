
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { BlurView } from 'expo-blur';

export default function SavedAddresses({ onClose, addresses = [], onAdd, onDelete }) {
    const { theme, isDark } = useTheme();
    const [newTitle, setNewTitle] = useState('');

    const handleAdd = () => {
        if (newTitle.trim()) {
            onAdd({ id: Date.now(), title: newTitle.trim() });
            setNewTitle('');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.backgroundCard }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>العناوين المحفوظة</Text>
                <TouchableOpacity onPress={onClose}>
                    <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
            </View>

            <View style={styles.inputRow}>
                <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
                    placeholder="مثلاً: المنزل، العمل..."
                    placeholderTextColor={theme.textMuted}
                    value={newTitle}
                    onChangeText={setNewTitle}
                />
                <TouchableOpacity
                    style={[styles.addBtn, { backgroundColor: theme.primary }]}
                    onPress={handleAdd}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {addresses.length === 0 ? (
                <View style={styles.empty}>
                    <Ionicons name="location-outline" size={48} color={theme.textMuted} />
                    <Text style={[styles.emptyText, { color: theme.textMuted }]}>لا توجد عناوين محفوظة</Text>
                </View>
            ) : (
                <FlatList
                    data={addresses}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => (
                        <View style={[styles.item, { borderBottomColor: theme.border }]}>
                            <View style={styles.itemLeft}>
                                <View style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]}>
                                    <Ionicons name="location" size={18} color={theme.primary} />
                                </View>
                                <View>
                                    <Text style={[styles.itemText, { color: theme.text }]}>{item.title}</Text>
                                    {item.data && (
                                        <Text style={[styles.itemSubtext, { color: theme.textMuted }]}>
                                            {item.data.city}, {item.data.street}
                                        </Text>
                                    )}
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => onDelete(item.id)}>
                                <Ionicons name="trash-outline" size={20} color={theme.error} />
                            </TouchableOpacity>
                        </View>
                    )}
                    contentContainerStyle={{ paddingBottom: 40 }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 25 },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25, alignItems: 'center' },
    title: { fontSize: 22, fontWeight: '900' },
    inputRow: { flexDirection: 'row', gap: 10, marginBottom: 25 },
    input: { flex: 1, height: 50, borderRadius: 15, paddingHorizontal: 15, borderWidth: 1, fontSize: 14 },
    addBtn: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
    emptyText: { fontSize: 16, fontWeight: '600' },
    item: { paddingVertical: 18, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    itemText: { fontSize: 16, fontWeight: '700' },
    itemSubtext: { fontSize: 12, marginTop: 2 }
});
