import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta = {
  title: 'Atoms/Button',
  component: Button,
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    disabled: {
      control: 'boolean',
    },
    loading: {
      control: 'boolean',
    },
    fullWidth: {
      control: 'boolean',
    },
  },
  args: {
    title: 'Button',
    onPress: () => console.log('Button pressed'),
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    title: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    title: 'Secondary Button',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    title: 'Outline Button',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    title: 'Ghost Button',
  },
};

export const Small: Story = {
  args: {
    size: 'small',
    title: 'Small Button',
  },
};

export const Medium: Story = {
  args: {
    size: 'medium',
    title: 'Medium Button',
  },
};

export const Large: Story = {
  args: {
    size: 'large',
    title: 'Large Button',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    title: 'Disabled Button',
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    title: 'Loading Button',
  },
};

export const FullWidth: Story = {
  args: {
    fullWidth: true,
    title: 'Full Width Button',
  },
};

export const WithAccessibility: Story = {
  args: {
    title: 'Start Test',
    accessibilityLabel: 'Start reintroduction test',
    accessibilityHint: 'Tap to begin testing a FODMAP group',
  },
};
