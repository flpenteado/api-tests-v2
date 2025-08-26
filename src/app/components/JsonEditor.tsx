import { Editor } from '@monaco-editor/react';

export type JsonEditorProps = {
  value: string;
};

export function JsonEditor({ value }: JsonEditorProps) {
  return (
    <div>
      <Editor value={value} language="json" height="90vh" theme="vs-dark" />
    </div>
  );
}
