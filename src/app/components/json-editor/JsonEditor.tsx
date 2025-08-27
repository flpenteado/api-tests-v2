import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Editor } from '@monaco-editor/react';
import type { editor as MonacoEditorType } from 'monaco-editor';

import {
  VARIABLE_REGEX,
  formatJsonWithVariables,
  validateJsonWithVariables,
  type ValidationError,
} from '@/app/utils/jsonUtils';

export type JsonEditorProps = {
  value: string;
  onChange?: (val: string) => void;
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
      
      decorationsRef.current = editor.deltaDecorations(
        decorationsRef.current,
        decorations
      );
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
      const markers = validation.errors.map((error) => {
        const startLineNumber = error.line || 1;
        const startColumn = error.column || 1;
        
        // Se temos offset, calculamos posições mais precisas
        let endLineNumber = startLineNumber;
        let endColumn = startColumn;
        
        if (error.startOffset !== undefined && error.endOffset !== undefined) {
          const startPos = model.getPositionAt(error.startOffset);
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

export function JsonEditor({ value, onChange }: JsonEditorProps) {
  const [editorText, setEditorText] = useState(() => formatJsonWithVariables(value));
  const [isEditorReady, setIsEditorReady] = useState(false);
  const editorRef = useRef<MonacoEditorType.IStandaloneCodeEditor | null>(null);

  // Validação do JSON com variáveis
  const validation = validateJsonWithVariables(editorText);

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
      <button
        onClick={handleFormat}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 1000,
          padding: '8px 12px',
          borderRadius: '8px',
          background: 'rgba(40, 40, 40, 0.9)',
          color: '#fff',
          border: '1px solid rgba(85, 85, 85, 0.6)',
          fontSize: '12px',
          cursor: 'pointer',
          backdropFilter: 'blur(4px)',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(60, 60, 60, 0.95)';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(40, 40, 40, 0.9)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
        }}
        title="Formatar JSON (Ctrl+Shift+F)"
      >
        ✨ Formatar
      </button>
      <Editor
        value={editorText}
        language="json"
        height="90vh"
        theme="vs-dark"
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        onChange={handleChange}
        options={{
          minimap: { enabled: false },
          automaticLayout: true,
          formatOnPaste: true,
          formatOnType: true,
        }}
      />
    </div>
  );
}
