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
import {
  VARIABLE_REGEX,
  extractPlaceholders,
  substitutePlaceholders,
  substitutePlaceholdersInText,
} from './utils/placeholders';

const DEFAULT_ENDPOINT = 'https://jsonplaceholder.typicode.com/posts';
const DEFAULT_METHOD = 'POST';
const DEFAULT_BODY = `{
  "userId": 33,
  "title": {{titulo}},
  "body": {{conteudo}}
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
  const loadedDisplaySelectionsRef = React.useRef(false);

  // Load persisted Display selections (aliases) on mount
  React.useEffect(() => {
    try {
      const req = localStorage.getItem('display.selectedRequestFields');
      const res = localStorage.getItem('display.selectedResponseFields');
      if (req) {
        const parsed = JSON.parse(req);
        if (Array.isArray(parsed)) {
          setSelectedRequestFields(
            parsed
              .filter((x: any) => x && typeof x.path === 'string')
              .map((x: any) => ({ path: x.path, alias: x.alias ?? '' }))
          );
        }
      }
      if (res) {
        const parsed = JSON.parse(res);
        if (Array.isArray(parsed)) {
          setSelectedResponseFields(
            parsed
              .filter((x: any) => x && typeof x.path === 'string')
              .map((x: any) => ({ path: x.path, alias: x.alias ?? '' }))
          );
        }
      }
      loadedDisplaySelectionsRef.current = true;
    } catch {}
  }, []);

  // Clean up invalid selections when availableFields change
  React.useEffect(() => {
    if (!loadedDisplaySelectionsRef.current) return;
    
    setSelectedRequestFields(prev => 
      prev.filter(field => availableRequestFields.includes(field.path))
    );
  }, [availableRequestFields.join('|')]);

  React.useEffect(() => {
    if (!loadedDisplaySelectionsRef.current) return;
    
    setSelectedResponseFields(prev => 
      prev.filter(field => availableResponseFields.includes(field.path))
    );
  }, [availableResponseFields.join('|')]);

  // Persist Display selections whenever they change
  React.useEffect(() => {
    try {
      localStorage.setItem('display.selectedRequestFields', JSON.stringify(selectedRequestFields));
    } catch {}
  }, [selectedRequestFields]);
  React.useEffect(() => {
    try {
      localStorage.setItem(
        'display.selectedResponseFields',
        JSON.stringify(selectedResponseFields)
      );
    } catch {}
  }, [selectedResponseFields]);

  // Helper function to extract all fields from an object, including array indices
  const extractAllFields = (obj: any, prefix = ''): string[] => {
    const fields: string[] = [];
    if (obj === null || obj === undefined) return fields;

    // If array at root
    if (Array.isArray(obj)) {
      obj.forEach((item, idx) => {
        const itemPath = `${prefix}[${idx}]`;
        fields.push(itemPath);
        if (item && typeof item === 'object') {
          fields.push(...extractAllFields(item, itemPath));
        }
      });
      return fields;
    }

    if (typeof obj !== 'object') return fields;

    for (const [key, value] of Object.entries(obj)) {
      const fieldPath = prefix ? `${prefix}.${key}` : key;
      fields.push(fieldPath);
      if (Array.isArray(value)) {
        value.forEach((item, idx) => {
          const itemPath = `${fieldPath}[${idx}]`;
          fields.push(itemPath);
          if (item && typeof item === 'object') {
            fields.push(...extractAllFields(item, itemPath));
          }
        });
      } else if (value && typeof value === 'object') {
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

  // Atualiza campos disponíveis do request quando o body muda (com debounce)
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        const parsed = JSON.parse(body);
        if (parsed && typeof parsed === 'object') {
          const allFields = extractAllFields(parsed);
          setAvailableRequestFields(allFields);
        } else if (body.trim() === '' || body.trim() === '{}') {
          // Only clear if truly empty
          setAvailableRequestFields([]);
        }
        // Don't clear fields for temporary JSON syntax errors during editing
      } catch (error) {
        // Fallback: prefer original keys when mapping key: {{placeholder}}
        const placeholderMatches = body.match(/\{\{([\w.-]+)\}\}/g) || [];
        const placeholderNames = placeholderMatches.map(m => m.slice(2, -2));
        // Extract keys heuristically
        const keyRegex = /"([^"]+)"\s*:|\b([A-Za-z_][A-Za-z0-9_\-]*)\s*:/g;
        const keyNames: string[] = [];
        let m: RegExpExecArray | null;
        while ((m = keyRegex.exec(body)) !== null) {
          const k = m[1] || m[2];
          if (k) keyNames.push(k);
        }
        // Map pairs "key": {{placeholder}}
        const pairRegex = /"([\w.-]+)"\s*:\s*\{\{([\w.-]+)\}\}/g;
        const keysFromPairs = new Set<string>();
        const placeholdersInPairs = new Set<string>();
        let mp: RegExpExecArray | null;
        while ((mp = pairRegex.exec(body)) !== null) {
          keysFromPairs.add(mp[1]);
          placeholdersInPairs.add(mp[2]);
        }
        const uniq = (arr: string[]) => Array.from(new Set(arr));
        const othersKeys = keyNames.filter(k => !keysFromPairs.has(k));
        const remainingPlaceholders = placeholderNames.filter(p => !placeholdersInPairs.has(p));
        const all = uniq([...Array.from(keysFromPairs), ...othersKeys, ...remainingPlaceholders]);
        if (all.length > 0) {
          setAvailableRequestFields(all);
        } else if (body.trim() === '' || body.trim() === '{}') {
          setAvailableRequestFields([]);
        }
        // otherwise keep current fields silently (user is typing)
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [body]);

  // Auto-seleciona todos os campos disponíveis do request
  React.useEffect(() => {
    if (availableRequestFields.length > 0) {
      if (!loadedDisplaySelectionsRef.current || selectedRequestFields.length === 0) {
        const newSelectedFields = availableRequestFields.map(path => ({ path, alias: '' }));
        setSelectedRequestFields(newSelectedFields);
      }
    }
  }, [availableRequestFields, selectedRequestFields.length]);

  // Fallback: auto-seleciona placeholders como campos de request quando não há JSON válido
  React.useEffect(() => {
    if (availableRequestFields.length === 0 && placeholders.length > 0) {
      setSelectedRequestFields(placeholders.map(p => ({ path: p.name, alias: '' })));
    }
    if (availableRequestFields.length === 0 && placeholders.length === 0) {
      setSelectedRequestFields([]);
    }
  }, [availableRequestFields.length, placeholders]);

  // Atualiza campos disponíveis do response quando há uma resposta válida
  React.useEffect(() => {
    if (response && response.response && typeof response.response === 'object') {
      const allFields = extractAllFields(response.response);
      setAvailableResponseFields(allFields);
    } else {
      // No valid response, clear fields
      setAvailableResponseFields([]);
    }
  }, [response]);

  // Auto-seleciona todos os campos disponíveis do response
  React.useEffect(() => {
    if (availableResponseFields.length > 0 && selectedResponseFields.length === 0) {
      const newSelectedFields = availableResponseFields.map(path => ({ path, alias: '' }));
      setSelectedResponseFields(newSelectedFields);
    } else if (availableResponseFields.length === 0 && selectedResponseFields.length > 0) {
      // Keep existing selection (persisted) until a valid response arrives
    }
  }, [availableResponseFields, selectedResponseFields.length]);

  // Função para executar a requisição
  const handleSend = async () => {
    try {
      let parsedBody;
      try {
        parsedBody = JSON.parse(body);
      } catch {
        parsedBody = body;
      }
      let bodyWithValues: any;
      if (typeof parsedBody === 'string') {
        // Replace in full text with quote-awareness
        const replaced = substitutePlaceholdersInText(parsedBody, placeholderValues);
        // Clean any remaining placeholders to keep valid JSON
        const cleaned = replaced.replace(VARIABLE_REGEX, (m, _k, offset) => {
          const before = replaced[offset - 1];
          const after = replaced[offset + m.length];
          const isQuoted = before === '"' && after === '"';
          return isQuoted ? '' : 'null';
        });
        try {
          bodyWithValues = JSON.parse(cleaned);
        } catch {
          // As last resort, try parsing replaced directly (if it was valid already)
          try {
            bodyWithValues = JSON.parse(replaced);
          } catch {
            bodyWithValues = cleaned; // still send as string if not JSON
          }
        }
      } else {
        bodyWithValues = substitutePlaceholders(parsedBody, placeholderValues);
      }
      const start = performance.now();
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, method, body: bodyWithValues }),
      });
      const durationMs = Math.round(performance.now() - start);
      const proxyJson = await res.json();
      setResponse({
        status: proxyJson.status,
        durationMs,
        response: proxyJson.response,
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
  const handleSettingsClick = () => {};

  // Handler para seleção de collection (placeholder)
  const handleCollectionSelect = (_collectionId: string) => {};

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
          availableRequestFields={availableRequestFields}
          availableResponseFields={availableResponseFields}
          selectedRequestFields={selectedRequestFields}
          selectedResponseFields={selectedResponseFields}
          onSelectRequestField={handleSelectRequestField}
          onRequestAliasChange={handleRequestAliasChange}
          onSelectResponseField={handleSelectResponseField}
          onResponseAliasChange={handleResponseAliasChange}
          placeholders={placeholders}
          placeholderValues={placeholderValues}
          onPlaceholderValueChange={handlePlaceholderValueChange}
        />
      }
      rightSidebar={null}
    />
  );
}
