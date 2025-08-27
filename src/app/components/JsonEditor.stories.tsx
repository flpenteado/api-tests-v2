import type { Meta, StoryObj } from '@storybook/nextjs';

import { JsonEditor } from './JsonEditor';

const meta = {
  title: 'JsonEditor',
  component: JsonEditor,
} satisfies Meta<typeof JsonEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultJson = `
{
  "name": "John Doe",
  "age": 30,
  "email": "john.doe@example.com"
}
`;

export const Default: Story = {
  args: {
    value: defaultJson,
  },
};

const jsonWithVars = `
{
  "name": "John Doe",
  "age": {{idade}},
  "email": "john.doe@example.com"
}
`;

export const WithVariables: Story = {
  name: 'With variables',
  args: {
    value: jsonWithVars,
    onChange: (v: string) => {
      // eslint-disable-next-line no-console
      console.log('Changed:', v);
    },
  },
};
