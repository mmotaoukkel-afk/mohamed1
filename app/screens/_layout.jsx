import React from 'react';
import { Stack } from 'expo-router';

export default function ScreensLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            {/* Stack will automatically handle nested routes in auth/ and checkout/ folders */}
        </Stack>
    );
}
