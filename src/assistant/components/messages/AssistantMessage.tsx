/**
 * AssistantMessage — فقاعة رسالة المساعد
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ChatMessage } from '../../types';

interface Props {
  message: ChatMessage;
}

export const AssistantMessage: React.FC<Props> = ({ message }) => (
  <View style={styles.wrapper}>
    {/* أيقونة المساعد */}
    <View style={styles.avatar}>
      <Text style={styles.avatarIcon}>✨</Text>
    </View>

    <View style={styles.bubble}>
      <Text style={styles.text}>{message.content}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 4,
    paddingHorizontal: 16,
    gap: 8,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(212,175,118,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,118,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  avatarIcon: {
    fontSize: 14,
  },
  bubble: {
    backgroundColor: 'rgba(212,175,118,0.08)',
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: '78%',
    borderWidth: 1,
    borderColor: 'rgba(212,175,118,0.2)',
  },
  text: {
    color: '#F0EBF4',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
