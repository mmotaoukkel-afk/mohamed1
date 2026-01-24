
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function PaymentMethods({ onClose, cards = [], onAdd, onDelete }) {
    const { theme, isDark } = useTheme();
    const [newNumber, setNewNumber] = useState('');

    const handleAdd = () => {
        if (newNumber.trim().length >= 4) {
            // Mask the number for display
            const last4 = newNumber.trim().slice(-4);
            onAdd({ id: Date.now(), number: "**** **** **** " + last4, raw: newNumber.trim() });
            setNewNumber('');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.backgroundCard }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>طرق الدفع</Text>
                <TouchableOpacity onPress={onClose}>
                    <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
            </View>

            <View style={styles.inputRow}>
                <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
                    placeholder="رقم البطاقة..."
                    placeholderTextColor={theme.textMuted}
                    value={newNumber}
                    onChangeText={setNewNumber}
                    keyboardType="numeric"
                />
                <TouchableOpacity
                    style={[styles.addBtn, { backgroundColor: theme.primary }]}
                    onPress={handleAdd}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {cards.length === 0 ? (
                <View style={styles.empty}>
                    <Ionicons name="card-outline" size={48} color={theme.textMuted} />
                    <Text style={[styles.emptyText, { color: theme.textMuted }]}>لا توجد بطاقات محفوظة</Text>
                </View>
            ) : (
                <FlatList
                    data={cards}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => (
                        <View style={[styles.item, { borderBottomColor: theme.border }]}>
                            <View style={styles.itemLeft}>
                                <View style={[styles.iconBox, { backgroundColor: theme.accent + '15' }]}>
                                    <Ionicons name="card" size={18} color={theme.accent} />
                                </View>
                                <Text style={[styles.itemText, { color: theme.text }]}>{item.number}</Text>
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
    itemText: { fontSize: 16, fontWeight: '700' }
});
