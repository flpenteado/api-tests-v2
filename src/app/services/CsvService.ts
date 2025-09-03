// Serviço de CSV para API testing
// Métodos: generateTemplate, parseCsv, runBatch
import Papa from 'papaparse';
import type { ParseResult } from 'papaparse';

import { RequestRecord } from '../../types/businessTesting';
import { HttpMethod, RequestsService } from './RequestsService';

export class CsvService {
  /**
   * Gera um template CSV com cabeçalhos dos placeholders
   */
  static generateTemplate(placeholders: string[]): string {
    return Papa.unparse([placeholders]);
  }

  /**
   * Faz o parse de um arquivo CSV para array de objetos
   */
  static async parseCsv(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results: ParseResult<any>) => resolve(results.data),
        error: (err: Error) => reject(err),
      });
    });
  }

  /**
   * Executa requests em batch usando RequestsService
   * @param rows Array de objetos (cada linha do CSV)
   * @param endpoint Endpoint para requests
   * @param method HTTP method
   * @returns Array de resultados por linha
   */
  static async runBatch(
    rows: any[],
    endpoint: string,
    method: HttpMethod
  ): Promise<{ row: any; result: any; error?: any }[]> {
    const results: { row: any; result: any; error?: any }[] = [];
    for (const row of rows) {
      try {
        const result = await RequestsService.executeOnce(row, endpoint, method);
        results.push({ row, result });
      } catch (error) {
        results.push({ row, result: null, error });
      }
    }
    return results;
  }
}
