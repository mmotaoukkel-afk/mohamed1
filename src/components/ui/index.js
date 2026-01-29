/**
 * Kataraa UI Kit - Component Exports
 * 
 * Usage:
 * import { Button, Surface, Text, Input, IconButton } from '@/components/ui';
 */

// Core Components
export { Button } from './Button';
export { default as Surface } from './Surface';
export { default as EmptyState } from './EmptyState';
export { default as ConsentModal } from './ConsentModal';
export { Text, Title, Subtitle, Body, Caption, Label } from './Text';
export { Input, SearchInput } from './Input';
export { IconButton, Badge } from './IconButton';
export { default as PatternBackground } from './PatternBackground';

// Re-export tokens for convenience
export {
    colors,
    spacing,
    radius,
    typography,
    shadows,
    animations,
    layout,
    gradients,
    lightTheme,
    darkTheme,
} from '../../theme/tokens';
