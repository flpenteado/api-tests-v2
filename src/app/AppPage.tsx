import React, { useMemo, useState } from 'react';

import { ApiResponse, PlaceholderMeta, ReportRow } from '../types/modularApiTesting';
import { JsonEditor } from './components/json-editor/JsonEditor';
import { extractPlaceholders, substitutePlaceholders } from './utils/placeholders';

const DEFAULT_ENDPOINT = 'https://jsonplaceholder.typicode.com/posts';
const DEFAULT_METHOD = 'POST';
const DEFAULT_BODY = `{
  "userId": "{{user_id}}",
  "title": "{{post_title}}",
  "body": "{{post_content}}"
}`;

export default function AppPage() {
  // Estado principal
  const [endpoint, setEndpoint] = useState(DEFAULT_ENDPOINT);
  const [method, setMethod] = useState(DEFAULT_METHOD);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [placeholders, setPlaceholders] = useState<PlaceholderMeta[]>([]);
  // Estado para alternar entre editor e árvore no request/response
  const [showRequestTree, setShowRequestTree] = useState(false);
  const [showResponseTree, setShowResponseTree] = useState(false);
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string | number>>({});
  const [reportRows, setReportRows] = useState<ReportRow[]>([]);

  // Estado para campos selecionados e aliases
  const [selectedRequestFields, setSelectedRequestFields] = useState<
    { path: string; alias: string }[]
  >([]);
  const [selectedResponseFields, setSelectedResponseFields] = useState<
    { path: string; alias: string }[]
  >([]);

  // Handlers para seleção e alias de campos do request
  const handleSelectRequestField = (path: string) => {
    setSelectedRequestFields(fields =>
      fields.some(f => f.path === path)
        ? fields.filter(f => f.path !== path)
        : [...fields, { path, alias: '' }]
    );
  };
  const handleRequestAliasChange = (path: string, alias: string) => {
    setSelectedRequestFields(fields => fields.map(f => (f.path === path ? { ...f, alias } : f)));
  };

  // Handlers para seleção e alias de campos do response
  const handleSelectResponseField = (path: string) => {
    setSelectedResponseFields(fields =>
      fields.some(f => f.path === path)
        ? fields.filter(f => f.path !== path)
        : [...fields, { path, alias: '' }]
    );
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

  return (
    <div className="flex min-h-screen flex-col bg-[#181A20] p-6 text-white">
      {/* Top: Endpoint, método, botão Send */}
      <div className="mb-4 flex items-center gap-2">
        <select
          className="rounded border-none bg-[#23262F] px-3 py-2 font-bold text-white"
          value={method}
          onChange={e => setMethod(e.target.value as typeof method)}
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
        </select>
        <input
          type="text"
          className="flex-1 rounded border-none bg-[#23262F] px-3 py-2 text-white"
          value={endpoint}
          onChange={e => setEndpoint(e.target.value)}
        />
        <button
          className="ml-2 rounded bg-[#00E091] px-6 py-2 font-bold text-black hover:bg-[#00c97b]"
          onClick={handleSend}
        >
          Send
        </button>
      </div>
      {/* Main: Request/Response à esquerda, Variáveis à direita */}
      <div className="flex flex-1 gap-6">
        {/* Esquerda: Request Body e Response empilhados */}
        <div className="flex flex-[2] flex-col gap-6">
          <div className="rounded-lg bg-[#23262F] p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-bold">Request Body</span>
              <button
                className="ml-2 rounded bg-[#00E091] px-3 py-1 text-xs font-bold text-black hover:bg-[#00c97b]"
                onClick={() => setShowRequestTree(v => !v)}
              >
                {showRequestTree ? 'Editor' : 'Selecionar Campos'}
              </button>
            </div>
            <JsonEditor
              value={body}
              onChange={showRequestTree ? undefined : setBody}
              selectedFields={selectedRequestFields}
              onSelectField={handleSelectRequestField}
              onAliasChange={handleRequestAliasChange}
              editable={!showRequestTree}
            />
          </div>
          <div className="rounded-lg bg-[#23262F] p-4">
            <div className="mb-2 font-bold">Response</div>
            <div className="mb-2 flex items-center gap-4">
              {response && typeof response.status === 'number' && (
                <span className="font-bold text-green-400">Status: {response.status}</span>
              )}
              {response && typeof response.durationMs === 'number' && (
                <span className="text-gray-400">Duration: {response.durationMs}ms</span>
              )}
            </div>
            <div className="min-h-[120px] rounded bg-[#181A20] p-2">
              {response && response.response ? (
                <JsonEditor
                  value={
                    typeof response.response === 'object' ? JSON.stringify(response.response) : '{}'
                  }
                  selectedFields={selectedResponseFields}
                  onSelectField={handleSelectResponseField}
                  onAliasChange={handleResponseAliasChange}
                  editable={false}
                />
              ) : (
                <span className="text-gray-500">Nenhuma resposta ainda</span>
              )}
            </div>
          </div>
        </div>
        {/* Direita: Variáveis (valores de placeholder) em tabela */}
        <div className="h-fit flex-1 rounded-lg bg-[#23262F] p-4">
          <div className="mb-2 font-bold">Variables</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#181A20]">
                <th className="pb-1 text-left">Variable</th>
                <th className="pb-1 text-left">Value</th>
              </tr>
            </thead>
            <tbody>
              {placeholders.map(p => (
                <tr key={p.name} className="border-b border-[#181A20]">
                  <td className="py-1 pr-2 text-[#00E091]">{p.name}</td>
                  <td className="py-1">
                    <input
                      className="w-full rounded border-none bg-[#181A20] px-2 py-1 text-white"
                      value={placeholderValues[p.name] ?? ''}
                      onChange={e =>
                        setPlaceholderValues({ ...placeholderValues, [p.name]: e.target.value })
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Aliases selecionados para request */}
          {selectedRequestFields.length > 0 && (
            <div className="mt-6">
              <div className="mb-2 font-bold text-[#00E091]">Request Aliases</div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#181A20]">
                    <th className="pb-1 text-left">Campo</th>
                    <th className="pb-1 text-left">Alias</th>
                    <th className="pb-1 text-left">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRequestFields.map(f => (
                    <tr key={f.path} className="border-b border-[#181A20]">
                      <td className="py-1 pr-2">{f.path}</td>
                      <td className="py-1 pr-2">{f.alias}</td>
                      <td className="py-1">
                        {(() => {
                          // Remove apenas prefixos comuns e normaliza
                          const normalize = (str: string) => {
                            return str
                              .replace(/^(post_|user_|response_|request_)/i, '')
                              .replace(/[_{}]/g, '')
                              .toLowerCase();
                          };
                          const fieldNorm = normalize(f.path);
                          // Busca placeholder por correspondência direta, parcial ou manual
                          let placeholder = placeholders.find(p => {
                            const pNorm = normalize(p.name);
                            return (
                              fieldNorm === pNorm ||
                              pNorm.includes(fieldNorm) ||
                              fieldNorm.includes(pNorm)
                            );
                          });
                          // Mapeamento manual para casos comuns
                          if (!placeholder) {
                            if (fieldNorm === 'body') {
                              placeholder = placeholders.find(p =>
                                normalize(p.name).includes('content')
                              );
                            } else if (fieldNorm === 'title') {
                              placeholder = placeholders.find(p =>
                                normalize(p.name).includes('title')
                              );
                            } else if (fieldNorm === 'userid') {
                              placeholder = placeholders.find(p =>
                                normalize(p.name).includes('id')
                              );
                            }
                          }
                          return placeholder ? (placeholderValues[placeholder.name] ?? '') : '';
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Aliases selecionados para response */}
          {selectedResponseFields.length > 0 && (
            <div className="mt-6">
              <div className="mb-2 font-bold text-[#00E091]">Response Aliases</div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#181A20]">
                    <th className="pb-1 text-left">Campo</th>
                    <th className="pb-1 text-left">Alias</th>
                    <th className="pb-1 text-left">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedResponseFields.map(f => (
                    <tr key={f.path} className="border-b border-[#181A20]">
                      <td className="py-1 pr-2">{f.path}</td>
                      <td className="py-1 pr-2">{f.alias}</td>
                      <td className="py-1">
                        {response && response.response && typeof response.response === 'object'
                          ? (response.response[f.path] ?? '')
                          : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
