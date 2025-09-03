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
      return obj.replace(VARIABLE_REGEX, (_, key) =>
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
