import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('renders correctly with title', () => {
    const { getByText } = render(<Button title="Click me" onPress={() => {}} />);
    expect(getByText('Click me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<Button title="Click me" onPress={onPressMock} />);

    fireEvent.press(getByText('Click me'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<Button title="Click me" onPress={onPressMock} disabled />);

    fireEvent.press(getByText('Click me'));
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('shows loading indicator when loading', () => {
    const { queryByText, UNSAFE_getByType } = render(
      <Button title="Click me" onPress={() => {}} loading />
    );

    expect(queryByText('Click me')).toBeNull();
    expect(UNSAFE_getByType('ActivityIndicator')).toBeTruthy();
  });

  it('has correct accessibility attributes', () => {
    const { getByRole } = render(
      <Button
        title="Click me"
        onPress={() => {}}
        accessibilityLabel="Custom label"
        accessibilityHint="Custom hint"
      />
    );

    const button = getByRole('button');
    expect(button.props.accessibilityLabel).toBe('Custom label');
    expect(button.props.accessibilityHint).toBe('Custom hint');
  });
});
