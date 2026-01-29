import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function PaymentMethods({ onClose, cards = [], onAdd, onDelete }) {
    const { theme, isDark } = useTheme();
    const [newNumber, setNewNumber] = useState('');

    const handleAdd = () => {
        if (newNumber.trim().length >= 4) {
            const last4 = newNumber.trim().slice(-4);
            onAdd({
                id: Date.now(),
                number: "**** **** **** " + last4,
                raw: newNumber.trim()
            });
            setNewNumber('');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.backgroundCard }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>طرق الدفع</Text>
                <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.backgroundSecondary }]}>
                    <Ionicons name="close" size={20} color={theme.text} />
                </TouchableOpacity>
            </View>

            <View style={styles.inputRow}>
                <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                    <Ionicons name="card-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        placeholder="أدخل رقم البطاقة"
                        placeholderTextColor={theme.textMuted}
                        value={newNumber}
                        onChangeText={setNewNumber}
                        keyboardType="numeric"
                        maxLength={16}
                    />
                </View>
                <TouchableOpacity
                    style={[styles.addBtn, { backgroundColor: theme.primary }]}
                    onPress={handleAdd}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {cards.length === 0 ? (
                <View style={styles.empty}>
                    <View style={[styles.emptyIconBox, { backgroundColor: theme.accent + '10' }]}>
                        <Ionicons name="card-outline" size={48} color={theme.accent} />
                    </View>
                    <Text style={[styles.emptyText, { color: theme.text }]}>لا توجد بطاقات محفوظة</Text>
                    <Text style={[styles.emptySubtext, { color: theme.textMuted }]}>أضف بطاقتك لتسهيل عملية الدفع</Text>
                </View>
            ) : (
                <FlatList
                    data={cards}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => (
                        <View style={[styles.item, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', borderColor: theme.border }]}>
                            <View style={styles.itemLeft}>
                                <View style={[styles.iconBox, { backgroundColor: theme.accent + '15' }]}>
                                    <Ionicons name="card" size={18} color={theme.accent} />
                                </View>
                                <Text style={[styles.itemText, { color: theme.text }]}>{item.number}</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => onDelete(item.id)}
                                style={styles.deleteBtn}
                            >
                                <Ionicons name="trash-outline" size={18} color={theme.error} />
                            </TouchableOpacity>
                        </View>
                    )}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 24 },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' },
    title: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
    closeBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    inputRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, paddingHorizontal: 12 },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, height: 50, fontSize: 14, fontWeight: '500' },
    addBtn: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 50 },
    emptyIconBox: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyText: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
    emptySubtext: { fontSize: 14, textAlign: 'center', opacity: 0.7 },
    listContent: { paddingBottom: 40, gap: 12 },
    item: { padding: 16, borderRadius: 16, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    itemText: { fontSize: 16, fontWeight: '700', letterSpacing: 1 },
    deleteBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }
});
