'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Editor } from '@monaco-editor/react';
import type { editor as MonacoEditorType } from 'monaco-editor';

import { HttpMethod, RequestsService } from '@/app/services/RequestsService';
import {
  VARIABLE_REGEX,
  type ValidationError,
  formatJsonWithVariables,
  validateJsonWithVariables,
} from '@/app/utils/jsonUtils';

export type JsonEditorProps = {
  value: string;
  onChange?: (val: string) => void;
  selectedFields?: { path: string; alias: string }[];
  onSelectField?: (path: string) => void;
  onAliasChange?: (path: string, alias: string) => void;
  editable?: boolean;
};

function useVariableDecorations(
  editor: MonacoEditorType.IStandaloneCodeEditor | null,
  value: string
) {
  const decorationsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!editor || typeof editor.deltaDecorations !== 'function') return;
    const model = editor.getModel();
    if (!model) return;

    // Aguarda a disponibilidade do Monaco global
    const applyDecorations = () => {
      const Monaco = (window as any).monaco;
      if (!Monaco) {
        // Tenta novamente após um pequeno delay
        setTimeout(applyDecorations, 50);
        return;
      }

      const matches = [...value.matchAll(VARIABLE_REGEX)];
      const decorations = matches.map(match => {
        const start = match.index ?? 0;
        const end = start + match[0].length;
        const startPos = model.getPositionAt(start);
        const endPos = model.getPositionAt(end);
        return {
          range: new Monaco.Range(
            startPos.lineNumber,
            startPos.column,
            endPos.lineNumber,
            endPos.column
          ),
          options: {
            inlineClassName: 'json-variable-highlight',
          },
        };
      });

      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, decorations);
    };

    applyDecorations();
  }, [editor, value]);
}

function useValidationMarkers(
  editor: MonacoEditorType.IStandaloneCodeEditor | null,
  validation: { isValid: boolean; errors: ValidationError[] }
) {
  useEffect(() => {
    if (!editor) return;
    const model = editor.getModel();
    if (!model) return;

    const Monaco = (window as any).monaco;
    if (!Monaco) return;

    // Limpa markers existentes
    Monaco.editor.setModelMarkers(model, 'json-validation', []);

    if (!validation.isValid && validation.errors.length > 0) {
      const markers = validation.errors.map(error => {
        const startLineNumber = error.line || 1;
        const startColumn = error.column || 1;

        // Se temos offset, calculamos posições mais precisas
        let endLineNumber = startLineNumber;
        let endColumn = startColumn;

        if (error.startOffset !== undefined && error.endOffset !== undefined) {
          const endPos = model.getPositionAt(error.endOffset);
          endLineNumber = endPos.lineNumber;
          endColumn = endPos.column;
        } else {
          // Se não temos offset, destacamos a linha inteira
          const lineContent = model.getLineContent(startLineNumber);
          endColumn = lineContent.length + 1;
        }

        return {
          severity: Monaco.MarkerSeverity.Error,
          message: error.message,
          startLineNumber,
          startColumn,
          endLineNumber,
          endColumn,
        };
      });

      Monaco.editor.setModelMarkers(model, 'json-validation', markers);
    }
  }, [editor, validation]);
}

export function JsonEditor({
  value,
  onChange,
  selectedFields = [],
  onSelectField,
  onAliasChange,
  editable = true,
}: JsonEditorProps) {
  const [editorText, setEditorText] = useState(() => formatJsonWithVariables(value));
  const [isEditorReady, setIsEditorReady] = useState(false);
  const editorRef = useRef<MonacoEditorType.IStandaloneCodeEditor | null>(null);

  // Inline decorations and widgets for field selection/alias
  useEffect(() => {
    if (!isEditorReady || !editorRef.current) return;
    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return;
    const Monaco = (window as any).monaco;
    if (!Monaco) return;

    // Remove decorações e widgets de seleção de campo
    let decorations: any[] = [];
    let widgets: any[] = [];

    // Only for top-level fields
    // Não adiciona decorações ou widgets de seleção de campo

    // Apply decorations
    editor.deltaDecorations([], decorations);

    // Register widgets
    widgets.forEach(widget => {
      editor.addContentWidget(widget);
    });

    // Cleanup widgets on unmount or change
    return () => {
      widgets.forEach(widget => {
        try {
          editor.removeContentWidget(widget);
        } catch {}
      });
    };
  }, [isEditorReady, editorText, selectedFields, onAliasChange]);

  // Parse JSON para renderização em árvore
  let parsedJson: any = null;
  try {
    parsedJson = JSON.parse(value);
  } catch {
    parsedJson = null;
  }

  // Renderiza árvore de campos
  function renderTree(obj: any, path: string[] = []) {
    if (typeof obj !== 'object' || obj === null) return null;
    return Object.entries(obj).map(([key, val]) => {
      const fieldPath = [...path, key].join('.');
      const isSelected = selectedFields?.some(f => f.path === fieldPath);
      const alias = selectedFields?.find(f => f.path === fieldPath)?.alias || '';
      return (
        <div
          key={fieldPath}
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 4,
            marginLeft: path.length * 16,
          }}
        >
          <button
            style={{
              marginRight: 8,
              background: isSelected ? '#00E091' : '#23262F',
              color: isSelected ? '#181A20' : '#fff',
              border: 'none',
              borderRadius: 4,
              width: 24,
              height: 24,
              cursor: 'pointer',
            }}
            onClick={() => onSelectField?.(fieldPath)}
          >
            {isSelected ? '✓' : '+'}
          </button>
          <span style={{ fontWeight: 'bold', marginRight: 8 }}>{key}:</span>
          {typeof val === 'object' && val !== null ? (
            <span>{Array.isArray(val) ? '[...]' : '{...}'}</span>
          ) : (
            <span style={{ marginRight: 8 }}>{String(val)}</span>
          )}
          {isSelected && (
            <input
              type="text"
              placeholder="Alias"
              value={alias}
              onChange={e => onAliasChange?.(fieldPath, e.target.value)}
              style={{
                marginLeft: 8,
                background: '#181A20',
                color: '#fff',
                border: '1px solid #23262F',
                borderRadius: 4,
                padding: '2px 6px',
                fontSize: 12,
              }}
            />
          )}
        </div>
      );
    });
  }

  // Validação do JSON com variáveis
  const validation = validateJsonWithVariables(editorText);

  // ...existing code...

  // Decoração dos placeholders - só aplica quando o editor estiver pronto
  useVariableDecorations(isEditorReady ? editorRef.current : null, editorText);

  // Marcadores de validação no editor
  useValidationMarkers(isEditorReady ? editorRef.current : null, validation);

  // Sincroniza editorText com value externo, sempre formatando
  useEffect(() => {
    setEditorText(formatJsonWithVariables(value));
  }, [value]);

  // Formata JSON preservando placeholders
  const handleFormat = useCallback(() => {
    const pretty = formatJsonWithVariables(editorText);
    setEditorText(pretty);
    onChange?.(pretty);
  }, [editorText, onChange]);

  // Atualiza texto do editor
  const handleChange = useCallback(
    (val?: string) => {
      const next = val ?? '';
      setEditorText(next);
      onChange?.(next);
    },
    [onChange]
  );

  // Configuração do Monaco antes do mount
  const handleBeforeMount = useCallback((monaco: any) => {
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: false,
      allowComments: true,
      trailingCommas: 'ignore',
    });
  }, []);

  // Referência do editor após mount
  const handleMount = useCallback((editor: MonacoEditorType.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    setIsEditorReady(true);
    // Adiciona listener para clique na margem
    editor.onMouseDown(e => {
      const monaco = (window as any).monaco;
      if (!monaco) return;
      if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
        const lineNumber = e.target.position?.lineNumber;
        if (!lineNumber) return;
        // Tenta identificar o campo pelo texto da linha
        const model = editor.getModel();
        if (!model) return;
        const lineText = model.getLineContent(lineNumber);
        const match = /"([^"]+)"\s*:/.exec(lineText);
        if (match) {
          const fieldPath = match[1];
          onSelectField?.(fieldPath);
        }
      }
    });
  }, []);

  // Adiciona CSS para destaque das variáveis
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
    <div style={{ position: 'relative' }}>
      {/* Add CSS for glyph margin button */}
      <style>{`
          .json-field-select-btn {
            background: transparent;
            width: 18px;
            height: 18px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 4px;
            font-size: 16px;
          }
          .json-field-select-btn:before {
            content: '👁';
            color: #00E091;
            transition: color 0.2s;
          }
          .json-field-select-btn.selected:before {
            content: '✓';
            color: #00E091;
          }
          .json-field-select-btn:hover:before {
            color: #fff;
          }
        `}</style>
      {/* Format Button */}
      {onChange && (
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
          title="Formatar JSON (Ctrl+Shift+F)"
        >
          ⚡
        </button>
      )}

      {/* Editor principal */}
      {(!editable || onChange) && (
        <Editor
          value={editorText}
          language="json"
          height="70vh"
          theme="vs-dark"
          beforeMount={handleBeforeMount}
          onMount={handleMount}
          onChange={handleChange}
          options={{
            minimap: { enabled: false },
            automaticLayout: true,
            formatOnPaste: true,
            formatOnType: true,
            glyphMargin: true,
          }}
        />
      )}

      {/* Árvore de campos para seleção/alias */}
      {editable === false && parsedJson && (
        <div style={{ marginTop: 16 }}>{renderTree(parsedJson)}</div>
      )}
    </div>
  );
}
