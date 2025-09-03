// Serviço de execução de requests para API testing
// Métodos: executeOnce, save, list
import { RequestRecord } from '../../types/businessTesting';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ExecuteResult {
  status: number;
  duration: number;
  response: any;
}

export class RequestsService {
  static async executeOnce(
    payload: any,
    endpoint: string,
    method: HttpMethod
  ): Promise<ExecuteResult> {
    const start = Date.now();
    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: method !== 'GET' ? JSON.stringify(payload) : undefined,
    });
    const duration = Date.now() - start;
    const response = await res.json().catch(() => res.text());
    return {
      status: res.status,
      duration,
      response,
    };
  }

  static save(record: RequestRecord): void {
    // Persistir RequestRecord (localStorage)
    const records = RequestsService.list();
    records.push(record);
    localStorage.setItem('requestRecords', JSON.stringify(records));
  }

  static list(): RequestRecord[] {
    const raw = localStorage.getItem('requestRecords');
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
}
