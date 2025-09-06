import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Editor } from '@monaco-editor/react';
import type * as MonacoTypes from 'monaco-editor';

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
  const editorRef = useRef<MonacoTypes.editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<string[]>([]);

  // Sync external value changes
  useEffect(() => {
    if (value !== editorText) {
      setEditorText(value);
    }
  }, [value, editorText]);

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
  const applyDecorations = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const model = editor.getModel();
    if (!model) return;

    const text = model.getValue();
    const regex = /\{\{([\w.-]+)\}\}/g;
    const decorations: MonacoTypes.editor.IModelDeltaDecoration[] = [];
    const g = text.matchAll(regex) as Iterable<RegExpMatchArray>;
    for (const match of g) {
      const start = match.index ?? 0;
      const end = start + match[0].length;
      const startPos = model.getPositionAt(start);
      const endPos = model.getPositionAt(end);
      const m: any = (typeof window !== 'undefined' && (window as any).monaco) || null;
      if (!m) continue;
      decorations.push({
        range: new m.Range(startPos.lineNumber, startPos.column, endPos.lineNumber, endPos.column),
        options: { inlineClassName: 'json-variable-highlight' },
      });
    }
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, decorations);
  }, []);

  const handleMount = useCallback(
    (editor: MonacoTypes.editor.IStandaloneCodeEditor) => {
      editorRef.current = editor;
      setIsEditorReady(true);
      // Apply once right after mount
      applyDecorations();
      // Re-apply when content changes inside Monaco (e.g., undo/redo not captured)
      const disposable = editor.onDidChangeModelContent(() => applyDecorations());
      return () => disposable.dispose();
    },
    [applyDecorations]
  );

  // Highlight `{{variable}}` occurrences with inline decorations
  useEffect(() => {
    if (!isEditorReady) return;
    applyDecorations();
    return () => {
      const editor = editorRef.current;
      if (editor) editor.deltaDecorations(decorationsRef.current, []);
      decorationsRef.current = [];
    };
  }, [editorText, isEditorReady, applyDecorations]);

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
          fontSize: 12,
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Consolas, Monaco, Liberation Mono, monospace',
          lineHeight: 18,
        }}
      />
    </div>
  );
}
