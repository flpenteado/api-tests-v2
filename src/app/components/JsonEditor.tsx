import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Editor } from '@monaco-editor/react';

export type JsonEditorProps = {
  value: string;
  onChange?: (val: string) => void;
};

export function JsonEditor({ value, onChange }: JsonEditorProps) {
  // Regex para identificar variáveis no formato {{variableName}}
  const variableRegex = /{{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*}}/g;

  // Função para validar variáveis
  const [text, setText] = useState(value);
  const validation = useMemo(() => {
    const errors: string[] = [];
    // Encontrar todas as ocorrências de {{...}}
    const matches = [...text.matchAll(/{{(.*?)}}/g)];
    let replaced = text;
    matches.forEach(match => {
      const variable = match[1];
      // Verifica se está no formato correto
      if (!/^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*$/.test(variable)) {
        errors.push(`Variável mal formatada: {{${variable}}}`);
      }
      // Substitui todas as variáveis por um valor dummy para validação JSON
      replaced = replaced.replace(match[0], '0');
    });
    // Tenta validar o JSON após substituição dos placeholders
    try {
      JSON.parse(replaced);
    } catch (e: any) {
      errors.push('JSON inválido: ' + (e?.message || 'Erro de sintaxe'));
    }
    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [text]);

  const editorRef = useRef<any>(null);
  // Armazena decorations para variáveis
  const decorationsRef = useRef<string[]>([]);

  const handleBeforeMount = useCallback((monaco: any) => {
    // Desabilita validação padrão do JSON para não marcar placeholders como erro
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: false,
      allowComments: true,
      trailingCommas: 'ignore',
    });
  }, []);

  const handleMount = useCallback(
    (editor: any) => {
      editorRef.current = editor;
      // Aplica decoração inicial
      setTimeout(() => {
        updateVariableDecorations(editor, text);
      }, 100);
    },
    [text]
  );

  const handleChange = useCallback(
    (val?: string) => {
      const next = val ?? '';
      setText(next);
      onChange?.(next);
      // Atualiza decoração das variáveis
      if (editorRef.current) {
        updateVariableDecorations(editorRef.current, next);
      }
    },
    [onChange]
  );

  // Função para aplicar decoração nas variáveis
  function updateVariableDecorations(editor: any, value: string) {
    if (!editor || typeof editor.deltaDecorations !== 'function') return;
    const model = editor.getModel();
    if (!model) return;
    const matches = [...value.matchAll(/{{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*}}/g)];
    const decorations = matches.map(match => {
      const start = match.index ?? 0;
      const end = start + match[0].length;
      // Calcula posição inicial e final (linha/coluna)
      const startPos = model.getPositionAt(start);
      const endPos = model.getPositionAt(end);
      // Obtém referência do Monaco via editor
      // Tenta obter Monaco do editor ou global
      const Monaco =
        (editor.constructor && editor.constructor.monaco) || (globalThis as any).monaco || null;
      if (!Monaco) return null;
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
      decorations.filter(Boolean)
    );
  }

  // Mantém estado interno sincronizado quando a prop value muda externamente

  useEffect(() => {
    // Atualiza decoração sempre que o texto muda
    if (editorRef.current) {
      updateVariableDecorations(editorRef.current, text);
    }
  }, [text]);

  useEffect(() => {
    setText(value);
    // Atualiza decoração ao receber novo valor externo
    if (editorRef.current) {
      updateVariableDecorations(editorRef.current, value);
    }
  }, [value]);

  // Formatação preservando placeholders {{var}}
  const handleFormat = useCallback(() => {
    const original = text;
    const vars: string[] = [];

    // 1) Substitui placeholders já entre aspas
    let stage = original.replace(/"\s*{{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*}}\s*"/g, (_m, v) => {
      const id = vars.push(v) - 1;
      return `"__VAR_${id}__"`;
    });

    // 2) Substitui placeholders não entre aspas
    stage = stage.replace(/{{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*}}/g, (_m, v) => {
      const id = vars.push(v) - 1;
      return `"__VAR_${id}__"`;
    });

    try {
      const obj = JSON.parse(stage);
      let pretty = JSON.stringify(obj, null, 2);
      // 3) Restaura placeholders
      vars.forEach((v, i) => {
        const token = new RegExp(`"__VAR_${i}__"`, 'g');
        pretty = pretty.replace(token, `{{${v}}}`);
      });
      setText(pretty);
      onChange?.(pretty);
      // Reaplica decoração dos placeholders após formatar
      if (editorRef.current) {
        updateVariableDecorations(editorRef.current, pretty);
      }
    } catch (e) {
      // Mantém texto e exibe erro na barra
      console.warn('Falha ao formatar JSON com variáveis:', e);
    }
  }, [onChange, text]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <button
          onClick={handleFormat}
          style={{
            padding: '6px 10px',
            borderRadius: 6,
            background: '#333',
            color: '#fff',
            border: '1px solid #555',
          }}
        >
          Formatar
        </button>
      </div>
      {!validation.isValid && (
        <div style={{ color: 'red', marginBottom: '8px' }}>
          {validation.errors.map((err, idx) => (
            <div key={idx}>{err}</div>
          ))}
        </div>
      )}
      <Editor
        value={text}
        language="json"
        height="90vh"
        theme="vs-dark"
        beforeMount={monaco => {
          handleBeforeMount(monaco);
          // Adiciona CSS para destaque das variáveis
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
        }}
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
