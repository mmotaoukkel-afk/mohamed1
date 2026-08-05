/**
 * UserMessage — فقاعة رسالة المستخدم
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ChatMessage } from '../../types';

interface Props {
  message: ChatMessage;
}

export const UserMessage: React.FC<Props> = ({ message }) => (
  <View style={styles.wrapper}>
    <View style={styles.bubble}>
      <Text style={styles.text}>{message.content}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'flex-start',
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  bubble: {
    backgroundColor: '#2A2530',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  text: {
    color: '#F0EBF4',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
