import type { Meta, StoryObj } from '@storybook/nextjs';

import { JsonEditor } from '@/app/components/json-editor';

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

const jsonWithVars = `
{
  "name": "John Doe",
  "age": {{idade}},
  "email": "john.doe@example.com"
}
`;

const jsonWithErrors = `
{
  "name": "John Doe"
  "age": {{idade}}
  "email": "john.doe@example.com"
}
`;

export const Default: Story = {
  name: 'default',
  args: {
    value: defaultJson,
  },
};

export const WithVariables: Story = {
  name: 'with variables',
  args: {
    value: jsonWithVars,
    onChange: (v: string) => {
      console.log('Changed:', v);
    },
  },
};

export const WithErrors: Story = {
  name: 'with errors',
  args: {
    value: jsonWithErrors,
    onChange: (v: string) => {
      console.log('Changed:', v);
    },
  },
};
