import React from 'react';
import { render } from '@testing-library/react-native';
import { Button } from '../Button';
import { Input } from '../Input';
import { Card } from '../Card';
import { Text } from 'react-native';

describe('Accessibility Tests', () => {
  describe('Button Accessibility', () => {
    it('should have accessibility label', () => {
      const { getByRole } = render(<Button title="Submit" onPress={() => {}} />);
      const button = getByRole('button');

      expect(button.props.accessibilityLabel).toBe('Submit');
    });

    it('should use custom accessibility label when provided', () => {
      const { getByRole } = render(
        <Button title="Submit" onPress={() => {}} accessibilityLabel="Submit form" />
      );
      const button = getByRole('button');

      expect(button.props.accessibilityLabel).toBe('Submit form');
    });

    it('should have accessibility hint when provided', () => {
      const { getByRole } = render(
        <Button title="Submit" onPress={() => {}} accessibilityHint="Submits the form data" />
      );
      const button = getByRole('button');

      expect(button.props.accessibilityHint).toBe('Submits the form data');
    });

    it('should have correct accessibility state when disabled', () => {
      const { getByRole } = render(<Button title="Submit" onPress={() => {}} disabled />);
      const button = getByRole('button');

      expect(button.props.accessibilityState).toEqual(expect.objectContaining({ disabled: true }));
    });

    it('should have correct accessibility state when loading', () => {
      const { getByRole } = render(<Button title="Submit" onPress={() => {}} loading />);
      const button = getByRole('button');

      expect(button.props.accessibilityState).toEqual(
        expect.objectContaining({ disabled: true, busy: true })
      );
    });

    it('should meet minimum touch target size (44x44)', () => {
      const { getByRole } = render(<Button title="Submit" onPress={() => {}} size="small" />);
      const button = getByRole('button');

      expect(button.props.style.minHeight).toBeGreaterThanOrEqual(44);
    });

    it('should meet minimum touch target size for all sizes', () => {
      const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];

      sizes.forEach((size) => {
        const { getByRole } = render(<Button title="Submit" onPress={() => {}} size={size} />);
        const button = getByRole('button');

        expect(button.props.style.minHeight).toBeGreaterThanOrEqual(44);
      });
    });
  });

  describe('Input Accessibility', () => {
    it('should have accessibility label from label prop', () => {
      const { getByLabelText } = render(<Input label="Email" placeholder="Enter email" />);

      expect(getByLabelText('Email')).toBeTruthy();
    });

    it('should use custom accessibility label when provided', () => {
      const { getByLabelText } = render(
        <Input label="Email" placeholder="Enter email" accessibilityLabel="Email address" />
      );

      expect(getByLabelText('Email address')).toBeTruthy();
    });

    it('should have accessible error message with alert role', () => {
      const { getByRole } = render(
        <Input label="Email" placeholder="Enter email" error="Invalid email" />
      );

      const errorText = getByRole('alert');
      expect(errorText).toBeTruthy();
      expect(errorText.props.accessibilityLiveRegion).toBe('polite');
    });

    it('should meet minimum touch target size (44x44)', () => {
      const { getByLabelText } = render(<Input label="Email" placeholder="Enter email" />);
      const input = getByLabelText('Email');

      expect(input.props.style.minHeight).toBeGreaterThanOrEqual(44);
    });

    it('should have accessible helper text', () => {
      const { getByText } = render(
        <Input label="Email" placeholder="Enter email" helperText="We'll never share your email" />
      );

      const helperText = getByText("We'll never share your email");
      expect(helperText.props.accessibilityRole).toBe('text');
    });
  });

  describe('Card Accessibility', () => {
    it('should have accessibility label when provided', () => {
      const { getByLabelText } = render(
        <Card accessibilityLabel="User profile card">
          <Text>Content</Text>
        </Card>
      );

      expect(getByLabelText('User profile card')).toBeTruthy();
    });

    it('should have button role when onPress is provided', () => {
      const { getByRole } = render(
        <Card onPress={() => {}} accessibilityLabel="Clickable card">
          <Text>Content</Text>
        </Card>
      );

      const card = getByRole('button');
      expect(card).toBeTruthy();
    });

    it('should have accessibility hint when provided and pressable', () => {
      const { getByRole } = render(
        <Card
          onPress={() => {}}
          accessibilityLabel="Profile card"
          accessibilityHint="Opens user profile"
        >
          <Text>Content</Text>
        </Card>
      );

      const card = getByRole('button');
      expect(card.props.accessibilityHint).toBe('Opens user profile');
    });

    it('should not have button role when not pressable', () => {
      const { queryByRole } = render(
        <Card accessibilityLabel="Static card">
          <Text>Content</Text>
        </Card>
      );

      expect(queryByRole('button')).toBeNull();
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('should mark Button as accessible', () => {
      const { getByRole } = render(<Button title="Submit" onPress={() => {}} />);
      const button = getByRole('button');

      expect(button.props.accessible).toBe(true);
    });

    it('should mark Input as accessible', () => {
      const { getByLabelText } = render(<Input label="Email" />);
      const input = getByLabelText('Email');

      expect(input.props.accessible).toBe(true);
    });

    it('should mark Card as accessible', () => {
      const { getByLabelText } = render(
        <Card accessibilityLabel="Test card">
          <Text>Content</Text>
        </Card>
      );
      const card = getByLabelText('Test card');

      expect(card.props.accessible).toBe(true);
    });

    it('should have proper accessibility role for Button', () => {
      const { getByRole } = render(<Button title="Submit" onPress={() => {}} />);

      expect(getByRole('button')).toBeTruthy();
    });

    it('should announce errors with live region', () => {
      const { getByRole } = render(<Input label="Email" error="Invalid email format" />);

      const errorMessage = getByRole('alert');
      expect(errorMessage.props.accessibilityLiveRegion).toBe('polite');
    });
  });

  describe('Touch Target Size Compliance', () => {
    it('should ensure all Button variants meet minimum size', () => {
      const variants: Array<'primary' | 'secondary' | 'outline' | 'ghost'> = [
        'primary',
        'secondary',
        'outline',
        'ghost',
      ];

      variants.forEach((variant) => {
        const { getByRole } = render(<Button title="Test" onPress={() => {}} variant={variant} />);
        const button = getByRole('button');

        expect(button.props.style.minHeight).toBeGreaterThanOrEqual(44);
      });
    });

    it('should ensure Input meets minimum touch target height', () => {
      const { getByLabelText } = render(<Input label="Test input" />);
      const input = getByLabelText('Test input');

      expect(input.props.style.minHeight).toBe(44);
    });

    it('should ensure small Button still meets minimum size', () => {
      const { getByRole } = render(<Button title="Small" onPress={() => {}} size="small" />);
      const button = getByRole('button');

      // Even small buttons should meet the 44px minimum
      expect(button.props.style.minHeight).toBe(44);
    });
  });
});
