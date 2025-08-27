export const VARIABLE_REGEX = /{{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*}}/g;

export type ValidationError = {
  message: string;
  line?: number;
  column?: number;
  startOffset?: number;
  endOffset?: number;
};

export function validateJsonWithVariables(text: string): { 
  isValid: boolean; 
  errors: ValidationError[] 
} {
  const errors: ValidationError[] = [];
  const matches = [...text.matchAll(/{{(.*?)}}/g)];
  let replaced = text;
  
  // Valida variáveis
  matches.forEach(match => {
    const variable = match[1];
    if (!/^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*$/.test(variable)) {
      const startOffset = match.index ?? 0;
      const endOffset = startOffset + match[0].length;
      const lines = text.substring(0, startOffset).split('\n');
      const line = lines.length;
      const column = lines[lines.length - 1].length + 1;
      
      errors.push({
        message: `Variável mal formatada: {{${variable}}}`,
        line,
        column,
        startOffset,
        endOffset
      });
    }
    replaced = replaced.replace(match[0], '0');
  });
  
  // Valida JSON
  try {
    JSON.parse(replaced);
  } catch (e: any) {
    const errorMsg = e?.message || 'Erro de sintaxe';
    let line = 1;
    let column = 1;
    
    // Tenta extrair posição do erro do JSON
    const posMatch = errorMsg.match(/at position (\d+)/);
    if (posMatch) {
      const position = parseInt(posMatch[1]);
      const lines = replaced.substring(0, position).split('\n');
      line = lines.length;
      column = lines[lines.length - 1].length + 1;
    }
    
    errors.push({
      message: 'JSON inválido: ' + errorMsg,
      line,
      column
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function formatJsonWithVariables(text: string): string {
  const vars: string[] = [];
  let stage = text.replace(/"\s*{{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*}}\s*"/g, (_m, v) => {
    const id = vars.push(v) - 1;
    return `"__VAR_${id}__"`;
  });
  stage = stage.replace(/{{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*}}/g, (_m, v) => {
    const id = vars.push(v) - 1;
    return `"__VAR_${id}__"`;
  });
  try {
    const obj = JSON.parse(stage);
    let pretty = JSON.stringify(obj, null, 2);
    vars.forEach((v, i) => {
      const token = new RegExp(`"__VAR_${i}__"`, 'g');
      pretty = pretty.replace(token, `{{${v}}}`);
    });
    return pretty;
  } catch {
    return text;
  }
}
