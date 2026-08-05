/**
 * ProductCardMessage — كرت المنتج داخل الشات
 * يعرض صورة + اسم + سعر + زر "أضف للسلة" مباشرة
 */

import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { AssistantProduct } from '../../types';

import { getAssistantLocale } from '../../core/localeService';

interface Props {
  product: AssistantProduct;
  onAddToCart: (product: AssistantProduct) => void;
  onPress?: (product: AssistantProduct) => void;
  horizontal?: boolean;
}

const getImageUri = (product: AssistantProduct): string | null => {
  if (product.thumbnail) return product.thumbnail;
  if (typeof product.image === 'string') return product.image;
  if (product.images && product.images.length > 0) return product.images[0].src;
  return null;
};

export const ProductCardMessage: React.FC<Props> = ({ product, onAddToCart, onPress, horizontal }) => {
  const imageUri = getImageUri(product);
  const price = typeof product.price === 'number' ? product.price : parseFloat(String(product.price) || '0');
  const locale = getAssistantLocale();

  const Wrapper = onPress ? TouchableOpacity : View;

  const nameStyle: { textAlign: 'left' | 'right'; writingDirection: 'ltr' | 'rtl' } = {
    textAlign: locale === 'ar' ? 'right' : 'left',
    writingDirection: locale === 'ar' ? 'rtl' : 'ltr',
  };

  const formattedPrice = locale === 'ar'
    ? `${price.toFixed(2)} د.م`
    : `${price.toFixed(2)} KWD`;

  const addBtnLabel = locale === 'ar' ? '+ أضف للسلة' : '+ Add to Cart';

  return (
    <Wrapper
      style={[styles.card, horizontal && { width: 260, marginRight: 8, marginVertical: 0 }]}
      onPress={onPress ? () => onPress(product) : undefined}
      activeOpacity={0.9}
    >
      {/* صورة المنتج */}
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderIcon}>📦</Text>
        </View>
      )}

      {/* معلومات المنتج */}
      <View style={styles.info}>
        <Text style={[styles.name, nameStyle]} numberOfLines={2}>{product.name}</Text>
        <View style={styles.priceRow}>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => onAddToCart(product)}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>{addBtnLabel}</Text>
          </TouchableOpacity>
          <Text style={styles.price}>{formattedPrice}</Text>
        </View>
      </View>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212,175,118,0.2)',
    overflow: 'hidden',
    marginVertical: 4,
  },
  image: {
    width: 80,
    height: 80,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(212,175,118,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderIcon: {
    fontSize: 28,
  },
  info: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  name: {
    color: '#F0EBF4',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    color: '#D4AF76',
    fontSize: 13,
    fontWeight: '700',
  },
  addBtn: {
    backgroundColor: '#D4AF76',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  addBtnText: {
    color: '#0D0A12',
    fontSize: 12,
    fontWeight: '700',
  },
});
