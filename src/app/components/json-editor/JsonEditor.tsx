import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Editor } from '@monaco-editor/react';
import type * as MonacoEditorType from 'monaco-editor';

// Types
import { formatJsonWithVariables } from '../../utils/jsonUtils';

interface JsonEditorProps {
  value: string;
  onChange?: (value: string) => void;
  editable?: boolean;
}

export function JsonEditor({ value, onChange, editable = true }: JsonEditorProps) {
  const [editorText, setEditorText] = useState(value);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const editorRef = useRef<MonacoEditorType.IStandaloneCodeEditor | null>(null);

  // Sync external value changes
  useEffect(() => {
    if (value !== editorText) {
      setEditorText(value);
    }
  }, [value]);

  // Format JSON
  const handleFormat = useCallback(() => {
    const pretty = formatJsonWithVariables(editorText);
    setEditorText(pretty);
    onChange?.(pretty);
  }, [editorText, onChange]);

  // Handle text changes
  const handleChange = useCallback(
    (val?: string) => {
      const next = val ?? '';
      setEditorText(next);
      onChange?.(next);
    },
    [onChange]
  );

  // Monaco configuration before mount
  const handleBeforeMount = useCallback((monaco: any) => {
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: false,
      allowComments: true,
      trailingComments: 'ignore',
    });
  }, []);

  // Editor reference after mount
  const handleMount = useCallback((editor: MonacoEditorType.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    setIsEditorReady(true);
  }, []);

  // Add CSS for variable highlighting
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const styleId = 'json-variable-highlight-style';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          .json-variable-highlight {
            color: #e67e22 !important;
            font-weight: bold !important;
            font-style: italic !important;
            background: none !important;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      {/* Format Button - only show in editable mode */}
      {onChange && editable && (
        <button
          onClick={handleFormat}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            zIndex: 1000,
            width: '28px',
            height: '28px',
            padding: '0',
            borderRadius: '4px',
            background: 'transparent',
            color: '#888',
            border: 'none',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#888';
          }}
          title="Format JSON (Ctrl+Shift+F)"
        >
          ⚡
        </button>
      )}

      {/* Editor Mode */}
      <Editor
        value={editorText}
        language="json"
        height="100%"
        theme="vs-dark"
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        onChange={editable ? handleChange : undefined}
        options={{
          minimap: { enabled: false },
          automaticLayout: true,
          formatOnPaste: true,
          formatOnType: true,
          readOnly: !editable,
          glyphMargin: false,
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          fontSize: 14,
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Consolas, Monaco, Liberation Mono, monospace',
          lineHeight: 20,
        }}
      />
    </div>
  );
}
