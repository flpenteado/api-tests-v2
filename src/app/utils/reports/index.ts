// Utilitários de reports para API testing
// Implementa: flatten, project, toReportRows

/**
 * Achata um objeto aninhado em um objeto plano com paths como chaves
 */
export function flatten(obj: any, prefix = ''): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(out, flatten(value, path));
    } else {
      out[path] = value;
    }
  }
  return out;
}

/**
 * Projeta um objeto para apenas os paths desejados
 */
export function project(obj: any, paths: string[]): Record<string, any> {
  const flat = flatten(obj);
  const out: Record<string, any> = {};
  for (const path of paths) {
    out[path] = flat[path];
  }
  return out;
}

/**
 * Converte uma lista de RequestRecord em linhas de relatório
 * @param records Array de RequestRecord
 * @param mapping Array de paths a projetar
 * @returns Array de objetos para relatório
 */
export function toReportRows(records: any[], mapping: string[]): Record<string, any>[] {
  return records.map(record => project(record, mapping));
}
