'use client';

import React, { useEffect, useMemo, useState } from 'react';

import { JsonEditor } from '@/app/components/json-editor/JsonEditor';
import { HttpMethod, RequestsService } from '@/app/services/RequestsService';
import { extractPlaceholders, substitutePlaceholders } from '@/app/utils/placeholders';

const DEFAULT_ENDPOINT = 'https://jsonplaceholder.typicode.com/posts';
const DEFAULT_METHOD: HttpMethod = 'POST';
const DEFAULT_BODY = `{
  "userId": "{{user_id}}",
  "title": "{{post_title}}",
  "body": "{{post_content}}"
}`;

export function APIRequestPlayground() {
  const [endpoint, setEndpoint] = useState(DEFAULT_ENDPOINT);
  const [method, setMethod] = useState<HttpMethod>(DEFAULT_METHOD);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [response, setResponse] = useState<any>(null);
  const [status, setStatus] = useState<string>('idle');
  const [duration, setDuration] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
  const [debouncedBody, setDebouncedBody] = useState(body);

  // Debounce body changes para evitar atualizações muito frequentes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedBody(body);
    }, 300);

    return () => clearTimeout(timer);
  }, [body]);

  // Detecta placeholders no JSON body (usando debounced value)
  const placeholders = useMemo(() => {
    try {
      const parsed = JSON.parse(debouncedBody);
      return extractPlaceholders(parsed);
    } catch {
      // Durante edição, tenta extrair placeholders do texto mesmo com JSON inválido
      const matches = debouncedBody.match(/\{\{([\w.-]+)\}\}/g);
      if (matches) {
        return matches.map(match => match.slice(2, -2)); // Remove {{ }}
      }
      return [];
    }
  }, [debouncedBody]);

  // Atualiza placeholderValues quando novos placeholders são detectados
  useEffect(() => {
    setPlaceholderValues(prevValues => {
      const newValues = { ...prevValues };
      let hasChanges = false;

      // Adiciona novos placeholders
      placeholders.forEach(placeholder => {
        if (!(placeholder in newValues)) {
          newValues[placeholder] = '';
          hasChanges = true;
        }
      });

      // Remove placeholders que não existem mais
      Object.keys(newValues).forEach(key => {
        if (!placeholders.includes(key)) {
          delete newValues[key];
          hasChanges = true;
        }
      });

      return hasChanges ? newValues : prevValues;
    });
  }, [placeholders]);

  const handleSend = async () => {
    setStatus('loading');
    setError(null);
    setResponse(null);
    setDuration(null);

    try {
      let payload: any = undefined;
      if (method !== 'GET' && method !== 'DELETE') {
        // Primeiro tenta fazer parse do JSON com placeholders
        let parsedBody;
        try {
          parsedBody = JSON.parse(body);
        } catch (parseError) {
          // Se falhar, tenta substituir placeholders no texto antes do parse
          const bodyWithPlaceholders = body.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            const value = placeholderValues[key];
            if (value === undefined || value === '') {
              throw new Error(`Variable "${key}" is not defined or is empty`);
            }
            // Se o valor é um número, retorna sem aspas, senão com aspas
            const isNumber = !isNaN(Number(value)) && isFinite(Number(value));
            return isNumber ? value : `"${value}"`;
          });

          try {
            parsedBody = JSON.parse(bodyWithPlaceholders);
          } catch (secondParseError) {
            throw new Error(
              'Invalid JSON format after variable substitution. Please check your syntax and variable values.'
            );
          }
        }

        // Substitui placeholders no payload
        payload = substitutePlaceholders(parsedBody, placeholderValues);
      }

      const result = await RequestsService.executeOnce(payload, endpoint, method);
      setResponse(result.response);
      setStatus('success');
      setDuration(result.duration);
    } catch (err: any) {
      setError(err?.message || String(err));
      setStatus('error');
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#181818',
        color: '#fff',
        fontFamily: 'Inter, sans-serif',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'row',
        padding: '16px',
        gap: '16px',
      }}
    >
      {/* Main Request Panel */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 16,
          background: 'rgba(24,24,24,0.98)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
          padding: 24,
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {/* Request Section - 50% */}
        <div
          style={{
            height: '50%',
            display: 'flex',
            flexDirection: 'column',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 16,
              flexShrink: 0,
            }}
          >
            <select
              value={method}
              onChange={e => setMethod(e.target.value as HttpMethod)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                background: '#222',
                color: '#fff',
                border: '1px solid #444',
                fontWeight: 600,
              }}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
            <input
              value={endpoint}
              onChange={e => setEndpoint(e.target.value)}
              placeholder="Endpoint URL"
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                background: '#222',
                color: '#fff',
                border: '1px solid #444',
                fontSize: 16,
              }}
            />
            <button
              onClick={handleSend}
              disabled={status === 'loading'}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                background: '#16a085',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                fontSize: 15,
                cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}
            >
              Send
            </button>
          </div>

          {method !== 'GET' && method !== 'DELETE' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ fontWeight: 600, marginBottom: 8, flexShrink: 0 }}>Request Body</div>
              <div
                style={{
                  flex: 1,
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: '1px solid #444',
                  background: '#222',
                  minHeight: 200,
                }}
              >
                <JsonEditor value={body} onChange={setBody} />
              </div>
            </div>
          )}
        </div>

        {/* Response Section - 50% */}
        <div
          style={{
            height: '50%',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 8, flexShrink: 0 }}>Response</div>

          {status === 'loading' && (
            <div
              style={{
                color: '#f39c12',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                fontSize: 16,
              }}
            >
              Loading...
            </div>
          )}

          {status === 'error' && (
            <div
              style={{
                color: '#e74c3c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                fontSize: 16,
                textAlign: 'center',
              }}
            >
              Error: {error}
            </div>
          )}

          {status === 'idle' && (
            <div
              style={{
                color: '#666',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                fontSize: 16,
              }}
            >
              Click &quot;Send&quot; to make a request
            </div>
          )}

          {status === 'success' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ marginBottom: 12, flexShrink: 0 }}>
                <span style={{ marginRight: 16 }}>
                  <strong>Status:</strong> 200
                </span>
                {duration !== null && (
                  <span>
                    <strong>Duration:</strong> {duration}ms
                  </span>
                )}
              </div>
              <div
                style={{
                  flex: 1,
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: '1px solid #333',
                  background: '#222',
                  minHeight: 0,
                }}
              >
                <JsonEditor value={JSON.stringify(response, null, 2)} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Variables Panel */}
      {placeholders.length > 0 && (
        <div
          style={{
            width: 300,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 16,
            background: 'rgba(24,24,24,0.98)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
            padding: 16,
            overflow: 'auto',
            minHeight: 400,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 12,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#16a085',
              }}
            ></span>
            Variables
          </div>
          {/* Table Header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0',
              marginBottom: 4,
              fontSize: 11,
              fontWeight: 500,
              color: '#999',
              borderBottom: '1px solid #333',
              paddingBottom: 6,
              textAlign: 'left',
            }}
          >
            <div style={{ padding: '0 12px' }}>Variable</div>
            <div style={{ padding: '0 12px' }}>Value</div>
          </div>

          {/* Table Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {placeholders.map((placeholder, index) => (
              <div
                key={placeholder}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0',
                  background: 'transparent',
                  borderBottom: index < placeholders.length - 1 ? '1px solid #2a2a2a' : 'none',
                  minHeight: 36,
                }}
              >
                <div
                  style={{
                    background: 'transparent',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: 11,
                    color: '#ccc',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    borderRight: '1px solid #2a2a2a',
                  }}
                >
                  {placeholder}
                </div>
                <div
                  style={{
                    background: 'transparent',
                    padding: '4px 0px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <input
                    type="text"
                    value={placeholderValues[placeholder] || ''}
                    onChange={e =>
                      setPlaceholderValues(prev => ({
                        ...prev,
                        [placeholder]: e.target.value,
                      }))
                    }
                    placeholder="Enter value..."
                    style={{
                      width: '100%',
                      padding: '6px 12px',
                      border: 'none',
                      background: 'transparent',
                      color: '#fff',
                      fontSize: 11,
                      outline: 'none',
                    }}
                    onFocus={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    }}
                    onBlur={e => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
