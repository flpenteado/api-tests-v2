'use client';

import React, { useMemo, useState } from 'react';

import { ApiResponse, PlaceholderMeta } from '../types/modularApiTesting';
import {
  AppHeader,
  AppLayout,
  AppMainContent,
  AppRightSidebar,
  AppSidebar,
} from './components/layout';
import { extractPlaceholders, substitutePlaceholders } from './utils/placeholders';

const DEFAULT_ENDPOINT = 'https://jsonplaceholder.typicode.com/posts';
const DEFAULT_METHOD = 'POST';
const DEFAULT_BODY = `{
  "userId": "{{user_id}}",
  "title": "{{post_title}}",
  "body": "{{post_content}}"
}`;

export default function Home() {
  // Estado principal - movido do AppPage.tsx
  const [endpoint, setEndpoint] = useState(DEFAULT_ENDPOINT);
  const [method, setMethod] = useState(DEFAULT_METHOD);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [placeholders, setPlaceholders] = useState<PlaceholderMeta[]>([]);
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string | number>>({});

  // Estado para campos disponíveis e selecionados
  const [availableRequestFields, setAvailableRequestFields] = useState<string[]>([]);
  const [availableResponseFields, setAvailableResponseFields] = useState<string[]>([]);
  const [selectedRequestFields, setSelectedRequestFields] = useState<
    { path: string; alias: string }[]
  >([]);
  const [selectedResponseFields, setSelectedResponseFields] = useState<
    { path: string; alias: string }[]
  >([]);

  // Helper function to extract all fields from an object
  const extractAllFields = (obj: any, prefix = ''): string[] => {
    const fields: string[] = [];
    if (!obj || typeof obj !== 'object') return fields;

    for (const [key, value] of Object.entries(obj)) {
      const fieldPath = prefix ? `${prefix}.${key}` : key;
      fields.push(fieldPath);
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        fields.push(...extractAllFields(value, fieldPath));
      }
    }
    return fields;
  };

  // Handlers para seleção e alias de campos do request
  const handleSelectRequestField = (path: string) => {
    setSelectedRequestFields(fields => {
      const isSelected = fields.some(f => f.path === path);
      if (isSelected) {
        return fields.filter(f => f.path !== path);
      } else {
        return [...fields, { path, alias: '' }];
      }
    });
  };

  const handleRequestAliasChange = (path: string, alias: string) => {
    setSelectedRequestFields(fields => fields.map(f => (f.path === path ? { ...f, alias } : f)));
  };

  // Handlers para seleção e alias de campos do response
  const handleSelectResponseField = (path: string) => {
    setSelectedResponseFields(fields => {
      const isSelected = fields.some(f => f.path === path);
      if (isSelected) {
        return fields.filter(f => f.path !== path);
      } else {
        return [...fields, { path, alias: '' }];
      }
    });
  };

  const handleResponseAliasChange = (path: string, alias: string) => {
    setSelectedResponseFields(fields => fields.map(f => (f.path === path ? { ...f, alias } : f)));
  };

  // Extrai placeholders do body
  const detectedPlaceholders = useMemo(() => {
    try {
      const parsed = JSON.parse(body);
      return extractPlaceholders(parsed).map((name: string) => ({ name, path: name }));
    } catch {
      const matches = body.match(/\{\{([\w.-]+)\}\}/g);
      return matches ? matches.map(m => ({ name: m.slice(2, -2), path: m.slice(2, -2) })) : [];
    }
  }, [body]);

  // Sincroniza placeholders detectados
  React.useEffect(() => {
    setPlaceholders(detectedPlaceholders);
  }, [detectedPlaceholders]);

  // Atualiza campos disponíveis do request quando o body muda
  React.useEffect(() => {
    try {
      const parsed = JSON.parse(body);
      if (parsed && typeof parsed === 'object') {
        const allFields = extractAllFields(parsed);
        setAvailableRequestFields(allFields);

        // Auto-seleciona todos os campos na primeira vez
        const newSelectedFields = allFields.map(path => ({ path, alias: '' }));
        if (
          newSelectedFields.length !== selectedRequestFields.length ||
          !newSelectedFields.every(field => selectedRequestFields.some(f => f.path === field.path))
        ) {
          setSelectedRequestFields(newSelectedFields);
        }
      }
    } catch {
      // Invalid JSON, clear fields
      setAvailableRequestFields([]);
      setSelectedRequestFields([]);
    }
  }, [body]);

  // Atualiza campos disponíveis do response quando há uma resposta válida
  React.useEffect(() => {
    if (response && response.response && typeof response.response === 'object') {
      const allFields = extractAllFields(response.response);
      setAvailableResponseFields(allFields);

      // Auto-seleciona todos os campos na primeira vez
      const newSelectedFields = allFields.map(path => ({ path, alias: '' }));
      if (
        newSelectedFields.length !== selectedResponseFields.length ||
        !newSelectedFields.every(field => selectedResponseFields.some(f => f.path === field.path))
      ) {
        setSelectedResponseFields(newSelectedFields);
      }
    } else {
      // No valid response, clear fields
      setAvailableResponseFields([]);
      setSelectedResponseFields([]);
    }
  }, [response]);

  // Função para executar a requisição
  const handleSend = async () => {
    try {
      let parsedBody;
      try {
        parsedBody = JSON.parse(body);
      } catch {
        parsedBody = body;
      }
      const bodyWithValues = substitutePlaceholders(parsedBody, placeholderValues);
      const start = performance.now();
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method !== 'GET' ? JSON.stringify(bodyWithValues) : undefined,
      });
      const durationMs = Math.round(performance.now() - start);
      const responseJson = await res.json();
      setResponse({
        status: res.status,
        durationMs,
        response: responseJson,
      });
    } catch (err) {
      setResponse({
        status: 0,
        durationMs: 0,
        response: { error: String(err) },
      });
    }
  };

  // Handler para alteração de valores de placeholder
  const handlePlaceholderValueChange = (name: string, value: string) => {
    setPlaceholderValues(prev => ({ ...prev, [name]: value }));
  };

  // Handler para settings (placeholder)
  const handleSettingsClick = () => {
    console.log('Settings clicked');
  };

  // Handler para seleção de collection (placeholder)
  const handleCollectionSelect = (collectionId: string) => {
    console.log('Collection selected:', collectionId);
  };

  return (
    <AppLayout
      header={
        <AppHeader title="API Tests v2" version="v0.0.1" onSettingsClick={handleSettingsClick} />
      }
      sidebar={
        <AppSidebar
          collections={[{ id: '1', name: 'My First Collection', isActive: true }]}
          activeCollectionId="1"
          onCollectionSelect={handleCollectionSelect}
          userEmail="user@example.com"
        />
      }
      mainContent={
        <AppMainContent
          endpoint={endpoint}
          method={method}
          body={body}
          onEndpointChange={setEndpoint}
          onMethodChange={setMethod}
          onBodyChange={setBody}
          onSend={handleSend}
          response={response}
        />
      }
      rightSidebar={
        <AppRightSidebar
          placeholders={placeholders}
          placeholderValues={placeholderValues}
          onPlaceholderValueChange={handlePlaceholderValueChange}
          selectedRequestFields={selectedRequestFields}
          onSelectRequestField={handleSelectRequestField}
          onRequestAliasChange={handleRequestAliasChange}
          selectedResponseFields={selectedResponseFields}
          onSelectResponseField={handleSelectResponseField}
          onResponseAliasChange={handleResponseAliasChange}
          availableRequestFields={availableRequestFields}
          availableResponseFields={availableResponseFields}
          response={response}
        />
      }
    />
  );
}
