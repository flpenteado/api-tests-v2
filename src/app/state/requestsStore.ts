// Estado de domínio para RequestRecord
// Persistência: localStorage (simples), listar e filtrar
import { RequestRecord } from '../../types/businessTesting';

const STORAGE_KEY = 'requestRecords';

export class RequestsStore {
  static save(record: RequestRecord): void {
    const records = RequestsStore.list();
    records.push(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  static list(): RequestRecord[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static filter(predicate: (record: RequestRecord) => boolean): RequestRecord[] {
    return RequestsStore.list().filter(predicate);
  }

  static clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
