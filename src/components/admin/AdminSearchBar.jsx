import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { BORDER_RADIUS } from '../../../src/constants/adminDesignTokens';
import { useTheme } from '../../../src/context/ThemeContext';

export default function AdminSearchBar({
    value,
    onChangeText,
    placeholder,
    containerStyle,
    onClear
}) {
    const { theme, isDark } = useTheme();

    return (
        <View style={[styles.container, containerStyle]}>
            <View style={[styles.searchBox, { backgroundColor: isDark ? theme.backgroundCard : '#FFFFFF', borderColor: theme.border }]}>
                <Ionicons name="search" size={20} color={theme.textMuted} />
                <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder={placeholder}
                    placeholderTextColor={theme.textMuted}
                    value={value}
                    onChangeText={onChangeText}
                />
                {value?.length > 0 && (
                    <TouchableOpacity onPress={() => {
                        onChangeText('');
                        if (onClear) onClear();
                    }}>
                        <Ionicons name="close-circle" size={20} color={theme.textMuted} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 50,
        borderRadius: BORDER_RADIUS.xl,
        borderWidth: 1,
    },
    input: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        textAlign: 'right', // RTL support
    }
});
