import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';
import { ThemeProvider } from '../../../context/ThemeContext';

// Wrap component in ThemeProvider for tests
const renderWithTheme = (component) => {
    return render(
        <ThemeProvider>
            {component}
        </ThemeProvider>
    );
};

describe('Button Component', () => {
    it('renders correctly with title', () => {
        const { getByText } = renderWithTheme(<Button title="Click Me" onPress={() => { }} />);
        expect(getByText('Click Me')).toBeTruthy();
    });

    it('calls onPress when pressed', () => {
        const onPressMock = jest.fn();
        const { getByText } = renderWithTheme(<Button title="Press Me" onPress={onPressMock} />);

        fireEvent.press(getByText('Press Me'));
        expect(onPressMock).toHaveBeenCalledTimes(1);
    });

    it('shows activity indicator when loading', () => {
        const { getByTestId } = renderWithTheme(<Button title="Loading" loading onPress={() => { }} />);
        // Testing library uses testID for activity indicators usually, 
        // or we check if the title is not visible if it's replaced
        expect(getByTestId('activity-indicator')).toBeTruthy();
    });
});
