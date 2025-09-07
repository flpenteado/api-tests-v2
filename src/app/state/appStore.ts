import { type StoreApi, createStore } from 'zustand';

import type { ApiResponse, PlaceholderMeta } from '../../types/modularApiTesting';
import type { HttpMethod } from '../../types/modularApiTesting';

export type AliasField = { path: string; alias: string };

export interface AppState {
  endpoint: string;
  method: HttpMethod;
  body: string;
  response: ApiResponse | null;

  placeholders: PlaceholderMeta[];
  placeholderValues: Record<string, string | number>;

  availableRequestFields: string[];
  availableResponseFields: string[];

  selectedRequestFields: AliasField[];
  selectedResponseFields: AliasField[];
}

export interface AppActions {
  setEndpoint: (value: string) => void;
  setMethod: (value: HttpMethod) => void;
  setBody: (value: string) => void;
  setResponse: (value: ApiResponse | null) => void;

  setPlaceholders: (value: PlaceholderMeta[]) => void;
  setPlaceholderValue: (name: string, value: string) => void;

  setAvailableRequestFields: (fields: string[]) => void;
  setAvailableResponseFields: (fields: string[]) => void;

  setSelectedRequestFields: (next: AliasField[] | ((prev: AliasField[]) => AliasField[])) => void;
  setSelectedResponseFields: (next: AliasField[] | ((prev: AliasField[]) => AliasField[])) => void;
}

export type AppStore = StoreApi<AppState & AppActions>;

const DEFAULT_ENDPOINT = 'https://fakestoreapi.com/carts';
const DEFAULT_METHOD: HttpMethod = 'POST';
const DEFAULT_BODY = `{
  "id": 0,
  "userId": 0,
  "products": [
    {
      "id": 0,
      "title": "Demo Product",
      "price": 0.1,
      "description": "Simple product description",
      "category": "Electronics",
      "image": "http://example.com"
    }
  ]
}`;

export function createAppStore(initial?: Partial<AppState>): AppStore {
  return createStore<AppState & AppActions>(set => ({
    // State
    endpoint: initial?.endpoint ?? DEFAULT_ENDPOINT,
    method: initial?.method ?? DEFAULT_METHOD,
    body: initial?.body ?? DEFAULT_BODY,
    response: initial?.response ?? null,

    placeholders: initial?.placeholders ?? [],
    placeholderValues: initial?.placeholderValues ?? {},

    availableRequestFields: initial?.availableRequestFields ?? [],
    availableResponseFields: initial?.availableResponseFields ?? [],

    selectedRequestFields: initial?.selectedRequestFields ?? [],
    selectedResponseFields: initial?.selectedResponseFields ?? [],

    // Actions
    setEndpoint: value => set({ endpoint: value }),
    setMethod: value => set({ method: value }),
    setBody: value => set({ body: value }),
    setResponse: value => set({ response: value }),

    setPlaceholders: value => set({ placeholders: value }),
    setPlaceholderValue: (name, value) =>
      set(state => ({ placeholderValues: { ...state.placeholderValues, [name]: value } })),

    setAvailableRequestFields: fields => set({ availableRequestFields: fields }),
    setAvailableResponseFields: fields => set({ availableResponseFields: fields }),

    setSelectedRequestFields: next =>
      set(state => ({
        selectedRequestFields:
          typeof next === 'function'
            ? (next as (prev: AliasField[]) => AliasField[])(state.selectedRequestFields)
            : next,
      })),

    setSelectedResponseFields: next =>
      set(state => ({
        selectedResponseFields:
          typeof next === 'function'
            ? (next as (prev: AliasField[]) => AliasField[])(state.selectedResponseFields)
            : next,
      })),
  }));
}
