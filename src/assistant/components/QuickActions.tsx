/**
 * QuickActions — أزرار اقتراحات سريعة
 * تظهر للمستخدم في بداية المحادثة لمساعدته على الانطلاق
 */

import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface Action {
  id: string;
  label: string;
  icon: string;
  message: string;
}

const QUICK_ACTIONS: Action[] = [
  { id: 'search_skin',    icon: '✨', label: 'عناية بالبشرة',      message: 'أرني منتجات عناية بالبشرة' },
  { id: 'search_serum',   icon: '💧', label: 'سيروم',              message: 'أرني سيروم' },
  { id: 'search_cream',   icon: '🧴', label: 'كريم مرطب',          message: 'أرني كريم مرطب' },
  { id: 'open_cart',      icon: '🛍️', label: 'سلة مشترياتي',       message: 'افتح السلة' },
];

interface Props {
  onSelect: (message: string) => void;
}

export const QuickActions: React.FC<Props> = ({ onSelect }) => (
  <View style={styles.wrapper}>
    <Text style={styles.hint}>اقتراحات سريعة:</Text>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {QUICK_ACTIONS.map((action) => (
        <TouchableOpacity
          key={action.id}
          style={styles.chip}
          onPress={() => onSelect(action.message)}
          activeOpacity={0.7}
        >
          <Text style={styles.chipIcon}>{action.icon}</Text>
          <Text style={styles.chipLabel}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212,175,118,0.1)',
  },
  hint: {
    color: 'rgba(240,235,244,0.4)',
    fontSize: 12,
    textAlign: 'right',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    writingDirection: 'rtl',
  },
  row: {
    paddingHorizontal: 12,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212,175,118,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,118,0.25)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    gap: 5,
  },
  chipIcon: {
    fontSize: 14,
  },
  chipLabel: {
    color: '#D4AF76',
    fontSize: 13,
    fontWeight: '500',
  },
});
