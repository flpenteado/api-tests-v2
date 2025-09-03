// Interfaces globais para integração modular do fluxo de testes de API

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRequest {
  endpoint: string;
  method: HttpMethod;
  payload: object;
  placeholders: PlaceholderMeta[];
  placeholderValues: Record<string, string | number>;
}

export interface ApiResponse {
  status: number;
  durationMs: number;
  response: object | string;
  error?: string;
}

export interface PlaceholderMeta {
  name: string;
  path: string;
  description?: string;
  example?: string | number;
}

export interface ReportRow {
  requestId: string;
  values: Record<string, string | number>;
  status: string;
  error?: string;
}

export interface ModularApiTestingState {
  request: ApiRequest;
  response: ApiResponse | null;
  reportRows: ReportRow[];
}
