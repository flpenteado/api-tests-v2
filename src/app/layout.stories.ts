import type { Meta, StoryObj } from '@storybook/nextjs';

import RootLayout from '@/app/layout';
import Home from '@/app/page';

const meta = {
  title: 'Root Layout',
  component: RootLayout,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof RootLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RootLayoutStory: Story = {
  args: {
    children: Home(),
  },
};
