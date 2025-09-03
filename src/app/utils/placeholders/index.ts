// Utilitários de placeholders para API testing
// Implementa: VARIABLE_REGEX, extractPlaceholders, substitutePlaceholders

export const VARIABLE_REGEX = /\{\{([\w.-]+)\}\}/g;

/**
 * Extrai todos os placeholders de um objeto JSON
 * @param json Objeto JSON
 * @returns Array de nomes de placeholders
 */
export function extractPlaceholders(json: any): string[] {
  const found = new Set<string>();
  const search = (obj: any) => {
    if (typeof obj === 'string') {
      let match;
      while ((match = VARIABLE_REGEX.exec(obj)) !== null) {
        found.add(match[1]);
      }
      VARIABLE_REGEX.lastIndex = 0;
    } else if (Array.isArray(obj)) {
      obj.forEach(search);
    } else if (obj && typeof obj === 'object') {
      Object.values(obj).forEach(search);
    }
  };
  search(json);
  return Array.from(found);
}

/**
 * Substitui placeholders em um objeto JSON por valores fornecidos
 * @param json Objeto JSON
 * @param values Mapeamento de valores
 * @returns Novo objeto com placeholders substituídos
 */
export function substitutePlaceholders(json: any, values: Record<string, any>): any {
  const replace = (obj: any): any => {
    if (typeof obj === 'string') {
      // If the whole string is a single placeholder, return the typed value directly
      const singleMatch = obj.match(/^\{\{([\w.-]+)\}\}$/);
      if (singleMatch) {
        const key = singleMatch[1];
        return key in values ? values[key] : obj;
      }
      // Otherwise, treat as a string template and stringify pieces
      return obj.replace(VARIABLE_REGEX, (_m, key) =>
        key in values ? String(values[key]) : `{{${key}}}`
      );
    } else if (Array.isArray(obj)) {
      return obj.map(replace);
    } else if (obj && typeof obj === 'object') {
      const out: any = {};
      for (const [k, v] of Object.entries(obj)) {
        out[k] = replace(v);
      }
      return out;
    }
    return obj;
  };
  return replace(json);
}

/**
 * Substitui placeholders em um texto (documento inteiro) preservando tipos:
 * - Se o placeholder estiver entre aspas, insere o valor como string bruta
 * - Se estiver fora de aspas, usa JSON.stringify(valor) para manter números/objetos corretos
 */
export function substitutePlaceholdersInText(template: string, values: Record<string, any>): string {
  return template.replace(VARIABLE_REGEX, (match, key, offset) => {
    if (!(key in values)) return match;
    const before = template[offset - 1];
    const after = template[offset + match.length];
    const isQuoted = before === '"' && after === '"';
    const val = values[key];
    return isQuoted ? String(val) : JSON.stringify(val);
  });
}
