'use client';

import React, { useMemo } from 'react';

import { AppHeader, AppLayout, AppMainContent, AppSidebar } from './components/layout';
import { useAppStore } from './state/StoreProvider';
import {
  VARIABLE_REGEX,
  extractPlaceholders,
  substitutePlaceholders,
  substitutePlaceholdersInText,
} from './utils/placeholders';

export default function Home() {
  // Estado global via Zustand
  const endpoint = useAppStore(s => s.endpoint);
  const method = useAppStore(s => s.method);
  const body = useAppStore(s => s.body);
  const response = useAppStore(s => s.response);
  const setResponse = useAppStore(s => s.setResponse);
  const placeholders = useAppStore(s => s.placeholders);
  const setPlaceholders = useAppStore(s => s.setPlaceholders);
  const placeholderValues = useAppStore(s => s.placeholderValues);

  const availableRequestFields = useAppStore(s => s.availableRequestFields);
  const setAvailableRequestFields = useAppStore(s => s.setAvailableRequestFields);
  const availableResponseFields = useAppStore(s => s.availableResponseFields);
  const setAvailableResponseFields = useAppStore(s => s.setAvailableResponseFields);
  const setSelectedRequestFields = useAppStore(s => s.setSelectedRequestFields);
  const selectedResponseFields = useAppStore(s => s.selectedResponseFields);
  const setSelectedResponseFields = useAppStore(s => s.setSelectedResponseFields);

  const loadedDisplaySelectionsRef = React.useRef(false);

  // Início limpo (sem qualquer persistência local)
  React.useEffect(() => {
    loadedDisplaySelectionsRef.current = true;
  }, []);

  // Clean up invalid selections when availableFields change - disabled to prevent conflicts
  // React.useEffect(() => {
  //   if (!loadedDisplaySelectionsRef.current) return;
  //   setSelectedRequestFields(prev =>
  //     prev.filter(field => availableRequestFields.includes(field.path))
  //   );
  // }, [availableRequestFields.join('|')]);

  React.useEffect(() => {
    if (!loadedDisplaySelectionsRef.current) return;
    setSelectedResponseFields(prev =>
      prev.filter(field => availableResponseFields.includes(field.path))
    );
  }, [availableResponseFields, setSelectedResponseFields]);

  // Helper function to extract all fields from an object, including array indices
  // Arrays with items will have their individual items exposed, not the array itself
  const extractAllFields = React.useCallback((obj: any, prefix = ''): string[] => {
    const fields: string[] = [];
    if (obj === null || obj === undefined) return fields;

    // If array at root
    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        // Empty array - include the array path itself
        fields.push(prefix || '[]');
      } else {
        // Non-empty array - include individual items, not the array
        obj.forEach((item, idx) => {
          const itemPath = `${prefix}[${idx}]`;
          if (item && typeof item === 'object') {
            fields.push(...extractAllFields(item, itemPath));
          } else {
            // Primitive value in array
            fields.push(itemPath);
          }
        });
      }
      return fields;
    }

    if (typeof obj !== 'object') return fields;

    for (const [key, value] of Object.entries(obj)) {
      const fieldPath = prefix ? `${prefix}.${key}` : key;

      if (Array.isArray(value)) {
        if (value.length === 0) {
          // Empty array - include the array field itself
          fields.push(fieldPath);
        } else {
          // Non-empty array - DON'T include the array field, only individual items
          value.forEach((item, idx) => {
            const itemPath = `${fieldPath}[${idx}]`;
            if (item && typeof item === 'object') {
              fields.push(...extractAllFields(item, itemPath));
            } else {
              // Primitive value in array
              fields.push(itemPath);
            }
          });
        }
      } else if (value && typeof value === 'object') {
        fields.push(...extractAllFields(value, fieldPath));
      } else {
        // Primitive value
        fields.push(fieldPath);
      }
    }
    return fields;
  }, []);

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
  }, [detectedPlaceholders, setPlaceholders]);

  // Atualiza campos disponíveis do request quando o body muda (com debounce)
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        // Resolve placeholders in the body text before parsing so that
        // JSON structure remains valid even when placeholders are unquoted
        const resolvedText = substitutePlaceholdersInText(body, placeholderValues);
        // Clean any remaining placeholders to keep JSON parseable
        const cleaned = resolvedText.replace(VARIABLE_REGEX, (m, _k, offset) => {
          const before = resolvedText[offset - 1];
          const after = resolvedText[offset + m.length];
          const isQuoted = before === '"' && after === '"';
          return isQuoted ? '' : 'null';
        });
        const parsed = JSON.parse(cleaned);
        if (parsed && typeof parsed === 'object') {
          const allFields = extractAllFields(parsed);

          // Filter out array fields explicitly to ensure they don't appear
          const filteredFields = allFields.filter(field => {
            try {
              // Navigate to the field value to check if it's an array
              const parts = field.split(/[\.\[\]]+/).filter(Boolean);
              let current = parsed;
              for (const part of parts) {
                if (current && typeof current === 'object') {
                  current = current[isNaN(Number(part)) ? part : Number(part)];
                } else {
                  return true; // Can't navigate, keep the field
                }
              }
              // If current is an array, exclude this field
              return !Array.isArray(current);
            } catch {
              return true; // On error, keep the field
            }
          });

          setAvailableRequestFields(filteredFields);
        } else if (body.trim() === '' || body.trim() === '{}') {
          // Only clear if truly empty
          setAvailableRequestFields([]);
        }
        // Don't clear fields for temporary JSON syntax errors during editing
      } catch {
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
  }, [body, placeholderValues, setAvailableRequestFields, extractAllFields]);

  // Auto-seleciona todos os campos disponíveis do request
  React.useEffect(() => {
    if (availableRequestFields.length > 0) {
      // Sempre selecionar todos os campos disponíveis, independente das condições anteriores
      const newSelectedFields = availableRequestFields.map(path => ({ path, alias: '' }));
      setSelectedRequestFields(newSelectedFields);
    }
  }, [availableRequestFields, setSelectedRequestFields]);

  // Fallback: auto-seleciona placeholders como campos de request quando não há JSON válido
  React.useEffect(() => {
    if (availableRequestFields.length === 0 && placeholders.length > 0) {
      setSelectedRequestFields(placeholders.map(p => ({ path: p.name, alias: '' })));
    }
    if (availableRequestFields.length === 0 && placeholders.length === 0) {
      setSelectedRequestFields([]);
    }
  }, [availableRequestFields.length, placeholders, setSelectedRequestFields]);

  // Atualiza campos disponíveis do response quando há uma resposta válida
  React.useEffect(() => {
    if (response && response.response && typeof response.response === 'object') {
      const allFields = extractAllFields(response.response);
      setAvailableResponseFields(allFields);
    } else {
      // No valid response, clear fields
      setAvailableResponseFields([]);
    }
  }, [response, setAvailableResponseFields, extractAllFields]);

  // Auto-seleciona todos os campos disponíveis do response
  React.useEffect(() => {
    if (availableResponseFields.length > 0 && selectedResponseFields.length === 0) {
      const newSelectedFields = availableResponseFields.map(path => ({ path, alias: '' }));
      setSelectedResponseFields(newSelectedFields);
    } else if (availableResponseFields.length === 0 && selectedResponseFields.length > 0) {
      // Keep existing selection (persisted) until a valid response arrives
    }
  }, [availableResponseFields, selectedResponseFields.length, setSelectedResponseFields]);

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

  // Handler para settings (placeholder)
  const handleSettingsClick = () => {};

  // Handler para seleção de collection (placeholder)
  const handleCollectionSelect = () => {};

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
      mainContent={<AppMainContent onSend={handleSend} />}
      rightSidebar={null}
    />
  );
}
