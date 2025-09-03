import React from 'react';

import Papa from 'papaparse';

import {
  VARIABLE_REGEX,
  substitutePlaceholders,
  substitutePlaceholdersInText,
} from '@/app/utils/placeholders';

import { ApiResponse } from '../../../types/modularApiTesting';
import { JsonEditor } from '../json-editor/JsonEditor';

interface AppMainContentProps {
  // Request section
  endpoint: string;
  method: string;
  body: string;
  onEndpointChange: (value: string) => void;
  onMethodChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onSend: () => void;

  // Response section
  response: ApiResponse | null;

  // Display config (aliases)
  availableRequestFields: string[];
  availableResponseFields: string[];
  selectedRequestFields: { path: string; alias: string }[];
  selectedResponseFields: { path: string; alias: string }[];
  onSelectRequestField: (path: string) => void;
  onRequestAliasChange: (path: string, alias: string) => void;
  onSelectResponseField: (path: string) => void;
  onResponseAliasChange: (path: string, alias: string) => void;

  // Variables (placeholders)
  placeholders: { name: string; path: string }[];
  placeholderValues: Record<string, string | number>;
  onPlaceholderValueChange: (name: string, value: string) => void;
}

export function AppMainContent({
  endpoint,
  method,
  body,
  onEndpointChange,
  onMethodChange,
  onBodyChange,
  onSend,
  response,
  availableRequestFields,
  availableResponseFields,
  selectedRequestFields,
  selectedResponseFields,
  onSelectRequestField,
  onRequestAliasChange,
  onSelectResponseField,
  onResponseAliasChange,
  placeholders,
  placeholderValues,
  onPlaceholderValueChange,
}: AppMainContentProps) {
  const [activeTab, setActiveTab] = React.useState<
    'Request' | 'Display' | 'Execute'
  >((typeof window !== 'undefined' && (localStorage.getItem('activeTab') as any)) || 'Request');
  React.useEffect(() => {
    try {
      localStorage.setItem('activeTab', activeTab);
    } catch {}
  }, [activeTab]);
  // Resizable variables panel
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [rightWidth, setRightWidth] = React.useState<number>(() => {
    if (typeof window === 'undefined') return 350;
    const saved = localStorage.getItem('variablesPanelWidth');
    return saved ? Math.max(240, Math.min(600, Number(saved) || 350)) : 350;
  });
  const dragRef = React.useRef<{ startX: number; startWidth: number } | null>(null);

  const handleDividerMouseDown = (e: React.MouseEvent) => {
    dragRef.current = { startX: e.clientX, startWidth: rightWidth };
    // Prevent text selection while dragging
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  };

  React.useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current || !containerRef.current) return;
      const { startX, startWidth } = dragRef.current;
      const dx = e.clientX - startX; // moving right increases dx
      // When dragging the divider, right width shrinks as dx increases
      const newWidth = Math.max(240, Math.min(600, startWidth - dx));
      setRightWidth(newWidth);
      try {
        localStorage.setItem('variablesPanelWidth', String(newWidth));
      } catch {}
    };
    const onUp = () => {
      dragRef.current = null;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [rightWidth]);
  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* Main content: Request and Response panels */}
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {/* Unified Panel: Request + Response in same container */}
        <div className="flex flex-1 flex-col rounded border border-[#333] bg-[#252526] p-4">
          <div className="mb-3 flex flex-shrink-0 items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Tabs */}
              <div className="flex text-sm">
                {(['Request', 'Display', 'Execute'] as const).map(tab => (
                  <button
                    key={tab}
                    className={
                      'px-3 py-1 ' +
                      (activeTab === tab
                        ? 'border-b-2 border-[#00E091] font-semibold text-[#00E091]'
                        : 'text-[#a6a6a6] hover:text-white')
                    }
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div
            ref={containerRef}
            className="min-h-0 flex-1 overflow-auto rounded border border-[#333] bg-[#1e1e1e]"
          >
            {activeTab === 'Request' && (
              <div className="flex h-full gap-4 p-4">
                {/* Left: Request + Response stacked */}
                <div className="flex min-h-0 flex-1 flex-col gap-4">
                  {/* Method + Endpoint + Send inside Request tab */}
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <select
                      className="rounded border border-[#333] bg-[#252526] px-3 py-2 font-bold text-white focus:border-[#00E091] focus:outline-none"
                      value={method}
                      onChange={e => onMethodChange(e.target.value)}
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                      <option value="PATCH">PATCH</option>
                    </select>

                    <input
                      type="text"
                      className="flex-1 rounded border border-[#333] bg-[#252526] px-3 py-2 text-white focus:border-[#00E091] focus:outline-none"
                      value={endpoint}
                      onChange={e => onEndpointChange(e.target.value)}
                      placeholder="Enter request URL..."
                    />

                    <button
                      className="rounded bg-[#00E091] px-6 py-2 font-bold text-black transition-colors hover:bg-[#00c97b]"
                      onClick={onSend}
                    >
                      Send
                    </button>
                  </div>

                  <h3 className="mb-2 font-semibold text-white">Request</h3>
                  <div className="min-h-[160px] flex-1 overflow-hidden rounded border border-[#333] bg-[#1e1e1e]">
                    <JsonEditor value={body} onChange={onBodyChange} editable={true} />
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col">
                    <h3 className="mb-2 font-semibold text-white">Response</h3>
                    {/* Status and Duration */}
                    {response && (
                      <div className="mb-2 flex items-center gap-4 text-sm">
                        {typeof response.status === 'number' && (
                          <span
                            className={`font-semibold ${
                              response.status >= 200 && response.status < 300
                                ? 'text-green-400'
                                : 'text-red-400'
                            }`}
                          >
                            Status: {response.status}
                          </span>
                        )}
                        {typeof response.durationMs === 'number' && (
                          <span className="text-[#a6a6a6]">Time: {response.durationMs}ms</span>
                        )}
                      </div>
                    )}
                    <div className="min-h-[120px] flex-1 overflow-hidden rounded border border-[#333] bg-[#1e1e1e]">
                      {response && response.response ? (
                        <JsonEditor
                          value={
                            typeof response.response === 'object'
                              ? JSON.stringify(response.response, null, 2)
                              : JSON.stringify(response.response)
                          }
                          editable={false}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[#a6a6a6]">
                          No response yet
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div
                  onMouseDown={handleDividerMouseDown}
                  className="w-[6px] cursor-col-resize rounded bg-[#2a2a2a] hover:bg-[#3a3a3a]"
                  aria-label="Resize variables panel"
                  role="separator"
                />

                {/* Right: Variables column (inside same container) */}
                <div style={{ width: rightWidth }} className="flex-shrink-0">
                  <h3 className="mb-2 font-semibold text-white">Variables</h3>
                  <div className="rounded border border-[#333] bg-[#1e1e1e]">
                    <table className="w-full text-xs">
                      <thead className="border-b border-[#333]">
                        <tr>
                          <th className="p-2 text-left font-medium text-[#a6a6a6]">NAME</th>
                          <th className="p-2 text-left font-medium text-[#a6a6a6]">VALUE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {placeholders.map(p => (
                          <tr key={p.name} className="border-b border-[#2d2d2d] last:border-b-0">
                            <td className="p-2 font-medium text-[#00E091]">{p.name}</td>
                            <td className="p-2">
                              <input
                                className="w-full rounded border border-[#333] bg-[#252526] px-1 py-0.5 text-xs text-white focus:border-[#00E091] focus:outline-none"
                                value={placeholderValues[p.name] ?? ''}
                                onChange={e => onPlaceholderValueChange(p.name, e.target.value)}
                                placeholder="Enter value..."
                              />
                            </td>
                          </tr>
                        ))}
                        {placeholders.length === 0 && (
                          <tr>
                            <td colSpan={2} className="p-4 text-center text-xs text-[#a6a6a6]">
                              No variables found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'Display' && (
              <div className="flex h-full flex-col gap-6 p-4">
                {/* Debug info - remove later */}
                <div className="text-xs text-yellow-400">
                  Debug - Selected:{' '}
                  {selectedRequestFields.map(f => `${f.path}(${f.alias})`).join(', ')}
                </div>
                {/* Show Request aliases from parsed fields or fallback to placeholders */}
                {((availableRequestFields && availableRequestFields.length > 0) ||
                  placeholders.length > 0) && (
                  <div className="flex-shrink-0">
                    <h3 className="mb-3 text-sm font-semibold text-[#00E091]">Request Aliases</h3>
                    <div className="rounded border border-[#333] bg-[#1e1e1e]">
                      <table className="w-full text-xs">
                        <thead className="border-b border-[#333]">
                          <tr>
                            <th className="w-8 p-2 text-left font-medium text-[#a6a6a6]"></th>
                            <th className="p-2 text-left font-medium text-[#a6a6a6]">FIELD</th>
                            <th className="p-2 text-left font-medium text-[#a6a6a6]">ALIAS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(availableRequestFields.length > 0
                            ? availableRequestFields
                            : placeholders.map(p => p.name)
                          ).map(fieldPath => {
                            const isSelected = selectedRequestFields.some(
                              f => f.path === fieldPath
                            );
                            const alias =
                              selectedRequestFields.find(f => f.path === fieldPath)?.alias || '';

                            return (
                              <tr
                                key={fieldPath}
                                className="border-b border-[#2d2d2d] last:border-b-0"
                              >
                                <td className="p-2">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => onSelectRequestField(fieldPath)}
                                    className="h-4 w-4 rounded border-[#333] bg-[#252526] text-[#00E091] focus:ring-2 focus:ring-[#00E091]"
                                  />
                                </td>
                                <td className="p-2 text-[#00E091]">{fieldPath}</td>
                                <td className="p-2">
                                  <input
                                    className="w-full rounded border border-[#333] bg-[#252526] px-1 py-0.5 text-xs text-white focus:border-[#00E091] focus:outline-none"
                                    value={alias}
                                    onChange={e => onRequestAliasChange(fieldPath, e.target.value)}
                                    placeholder="alias..."
                                    disabled={!isSelected}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {availableResponseFields.length > 0 && (
                  <div className="flex-shrink-0">
                    <h3 className="mb-3 text-sm font-semibold text-[#00E091]">Response Aliases</h3>
                    <div className="rounded border border-[#333] bg-[#1e1e1e]">
                      <table className="w-full text-xs">
                        <thead className="border-b border-[#333]">
                          <tr>
                            <th className="w-8 p-2 text-left font-medium text-[#a6a6a6]"></th>
                            <th className="p-2 text-left font-medium text-[#a6a6a6]">FIELD</th>
                            <th className="p-2 text-left font-medium text-[#a6a6a6]">ALIAS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {availableResponseFields.map(fieldPath => {
                            const isSelected = selectedResponseFields.some(
                              f => f.path === fieldPath
                            );
                            const alias =
                              selectedResponseFields.find(f => f.path === fieldPath)?.alias || '';

                            return (
                              <tr
                                key={fieldPath}
                                className="border-b border-[#2d2d2d] last:border-b-0"
                              >
                                <td className="p-2">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => onSelectResponseField(fieldPath)}
                                    className="h-4 w-4 rounded border-[#333] bg-[#252526] text-[#00E091] focus:ring-2 focus:ring-[#00E091]"
                                  />
                                </td>
                                <td className="p-2 text-[#00E091]">{fieldPath}</td>
                                <td className="p-2">
                                  <input
                                    className="w-full rounded border border-[#333] bg-[#252526] px-1 py-0.5 text-xs text-white focus:border-[#00E091] focus:outline-none"
                                    value={alias}
                                    onChange={e => onResponseAliasChange(fieldPath, e.target.value)}
                                    placeholder="alias..."
                                    disabled={!isSelected}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'Execute' && (
              <BatchExecutor
                endpoint={endpoint}
                method={method}
                bodyTemplate={body}
                placeholders={placeholders.map(p => p.name)}
                selectedRequestFields={selectedRequestFields}
                selectedResponseFields={selectedResponseFields}
                availableRequestFields={availableRequestFields}
                availableResponseFields={availableResponseFields}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// -- Execute tab component -- //
function BatchExecutor({
  endpoint,
  method,
  bodyTemplate,
  placeholders,
  selectedRequestFields,
  selectedResponseFields,
  availableRequestFields,
  availableResponseFields,
}: {
  endpoint: string;
  method: string;
  bodyTemplate: string;
  placeholders: string[];
  selectedRequestFields: { path: string; alias: string }[];
  selectedResponseFields: { path: string; alias: string }[];
  availableRequestFields: string[];
  availableResponseFields: string[];
}) {
  const [csvPreview, setCsvPreview] = React.useState<any[]>([]);
  const [running, setRunning] = React.useState(false);
  const [results, setResults] = React.useState<
    { row: any; status: number; response: any; durationMs: number; payload: any }[]
  >([]);
  const [progress, setProgress] = React.useState({ done: 0, total: 0 });
  const [concurrency, setConcurrency] = React.useState<number>(() => {
    if (typeof window === 'undefined') return 3;
    const saved = localStorage.getItem('batchConcurrency');
    const n = saved ? Number(saved) : 3;
    return Math.max(1, Math.min(10, n || 3));
  });
  React.useEffect(() => {
    try {
      localStorage.setItem('batchConcurrency', String(concurrency));
    } catch {}
  }, [concurrency]);

  const downloadTemplate = () => {
    // Only variables should compose the template headers
    const uniq = Array.from(new Set(placeholders));
    const csv = Papa.unparse([uniq]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const onUpload = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: res => {
        setCsvPreview(res.data as any[]);
        setResults([]); // Clear previous results when uploading new CSV
        console.log('CSV uploaded:', res.data);
      },
    });
  };

  const executeBatch = async () => {
    if (!csvPreview.length) return;
    setRunning(true);
    setResults([]);
    setProgress({ done: 0, total: csvPreview.length });

    const out: { row: any; status: number; response: any; durationMs: number; payload: any }[] =
      new Array(csvPreview.length);

    // helper to build body with values (supports dotted keys by JSON parsing values)
    const buildBody = (row: any) => {
      // Try to coerce JSON-like values in row
      const rowCoerced: any = { ...row };
      for (const k of Object.keys(rowCoerced)) {
        const v = rowCoerced[k];
        if (typeof v === 'string') {
          const trimmed = v.trim();
          if (
            (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
            (trimmed.startsWith('[') && trimmed.endsWith(']'))
          ) {
            try {
              rowCoerced[k] = JSON.parse(trimmed);
            } catch {}
          } else if (/^\d+(?:\.\d+)?$/.test(trimmed)) {
            rowCoerced[k] = Number(trimmed);
          } else if (trimmed === 'true' || trimmed === 'false') {
            rowCoerced[k] = trimmed === 'true';
          }
        }
      }

      let parsedBody: any;
      try {
        parsedBody = JSON.parse(bodyTemplate);
      } catch {
        parsedBody = bodyTemplate;
      }
      if (typeof parsedBody === 'string') {
        // Map CSV columns (labels/paths) to placeholder names used in template
        const valueMap: Record<string, any> = {};
        // Normalize helper (lowercase, remove non-alphanum)
        const norm = (s: string) =>
          String(s)
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');
        // Collect all placeholders from template text
        const ph = Array.from(
          (bodyTemplate.match(/\{\{([\w.-]+)\}\}/g) || []).map(m => m.slice(2, -2))
        );
        for (const name of ph) {
          // Try exact match in row
          if (name in rowCoerced) {
            valueMap[name] = rowCoerced[name];
            continue;
          }
          // Try match against selected request labels/paths
          const found = selectedRequestFields.find(f => {
            return norm(f.alias || f.path) === norm(name) || norm(f.path) === norm(name);
          });
          if (found) {
            const key = found.alias || found.path;
            if (key in rowCoerced) {
              valueMap[name] = rowCoerced[key];
              continue;
            }
          }
          // Fallback: try normalized key lookup
          const rowKey = Object.keys(rowCoerced).find(k => norm(k) === norm(name));
          if (rowKey) valueMap[name] = rowCoerced[rowKey];
        }
        const replaced = substitutePlaceholdersInText(parsedBody, valueMap);
        const cleaned = replaced.replace(
          VARIABLE_REGEX as unknown as RegExp,
          (m: string, _k: string, offset: number) => {
            const before = replaced[offset - 1];
            const after = replaced[offset + m.length];
            const isQuoted = before === '"' && after === '"';
            return isQuoted ? '' : 'null';
          }
        );
        try {
          return JSON.parse(cleaned);
        } catch {
          try {
            return JSON.parse(replaced);
          } catch {
            return cleaned;
          }
        }
      }
      return substitutePlaceholders(parsedBody, rowCoerced);
    };

    // concurrency pool
    let index = 0;
    let done = 0;
    const runOne = async (i: number) => {
      const row = csvPreview[i];
      try {
        const bodyWithValues = buildBody(row);
        const start = performance.now();
        const res = await fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint, method, body: bodyWithValues }),
        });
        const durationMs = Math.round(performance.now() - start);
        const json = await res.json();
        out[i] = {
          row,
          status: json.status,
          response: json.response,
          durationMs,
          payload: bodyWithValues,
        };
      } catch (e) {
        out[i] = { row, status: 0, response: { error: String(e) }, durationMs: 0, payload: null };
      } finally {
        done += 1;
        setProgress({ done, total: csvPreview.length });
      }
    };

    const workers: Promise<void>[] = [];
    const limit = Math.max(1, Math.min(10, concurrency));
    for (let w = 0; w < limit && w < csvPreview.length; w++) {
      workers.push(
        (async function loop() {
          while (true) {
            const i = index++;
            if (i >= csvPreview.length) break;
            await runOne(i);
          }
        })()
      );
    }
    await Promise.all(workers);
    setResults(out);
    setRunning(false);
  };

  // Parse key: {{placeholder}} pairs from the body template to avoid duplicate display
  const pairedPlaceholderNames = React.useMemo(() => {
    try {
      const pairRegex = /"([\w.-]+)"\s*:\s*\{\{([\w.-]+)\}\}/g;
      const set = new Set<string>();
      let m: RegExpExecArray | null;
      while ((m = pairRegex.exec(bodyTemplate)) !== null) {
        // m[2] is the placeholder name tied to a real key (m[1])
        set.add(m[2]);
      }
      return set;
    } catch {
      return new Set<string>();
    }
  }, [bodyTemplate]);

  const filteredRequestFields = React.useMemo(() => {
    const avail = availableRequestFields || [];
    const phSet = new Set(placeholders);
    // Keep only selected that are available, not placeholder names, and not placeholder tied to a real key
    const filtered = selectedRequestFields.filter(
      f => avail.includes(f.path) && !phSet.has(f.path) && !pairedPlaceholderNames.has(f.path)
    );
    console.log('filteredRequestFields debug:', {
      selectedRequestFields,
      availableRequestFields,
      filtered,
    });
    return filtered;
  }, [
    selectedRequestFields,
    availableRequestFields?.join('|'),
    pairedPlaceholderNames,
    placeholders.join('|'),
  ]);
  const filteredResponseFields = React.useMemo(
    () => selectedResponseFields.filter(f => (availableResponseFields || []).includes(f.path)),
    [selectedResponseFields, availableResponseFields?.join('|')]
  );

  const allColumns = React.useMemo(() => {
    // Combine selected request aliases and response aliases for table headers
    const req = filteredRequestFields.map(f => ({
      type: 'req',
      path: f.path,
      alias: f.alias || f.path,
      key: f.alias || f.path,
    }));
    const res = filteredResponseFields.map(f => ({
      type: 'res',
      path: f.path,
      alias: f.alias || f.path,
    }));
    return [...req, ...res];
  }, [filteredRequestFields, filteredResponseFields]);

  const getNested = (obj: any, path: string) => {
    if (!obj || !path) return '';
    // Support bracket indices, e.g., list[0].name -> list.0.name
    const normalized = path.replace(/\[(\d+)\]/g, '.$1');
    const parts = normalized.split('.');
    let cur: any = obj;
    for (const k of parts) {
      if (cur === null || cur === undefined) return '';
      const key: any = /^\d+$/.test(k) ? Number(k) : k;
      cur = cur[key];
    }
    return cur ?? '';
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={downloadTemplate}
            className="rounded border border-[#333] bg-[#2b2b2b] px-3 py-1 text-sm text-white hover:bg-[#343434]"
          >
            Download CSV template
          </button>
          <label className="cursor-pointer rounded border border-[#333] bg-[#2b2b2b] px-3 py-1 text-sm text-white hover:bg-[#343434]">
            Upload CSV
            <input
              type="file"
              accept=".csv"
              className="hidden"
              value=""
              onChange={e => e.target.files && onUpload(e.target.files[0])}
            />
          </label>
          <div className="ml-2 flex items-center gap-2 text-xs text-[#a6a6a6]">
            <span>Concurrency</span>
            <input
              type="number"
              min={1}
              max={10}
              value={concurrency}
              onChange={e => setConcurrency(Number(e.target.value) || 1)}
              className="w-14 rounded border border-[#333] bg-[#252526] px-1 py-0.5 text-xs text-white focus:border-[#00E091] focus:outline-none"
            />
          </div>
        </div>
        <button
          disabled={!csvPreview.length || running}
          onClick={executeBatch}
          className={`rounded px-4 py-1 text-sm font-semibold ${!csvPreview.length || running ? 'bg-[#2a2a2a] text-[#777]' : 'bg-[#00E091] text-black hover:bg-[#00c97b]'}`}
        >
          {running ? 'Processing…' : 'Run'}
        </button>
      </div>

      {/* Preview */}
      {csvPreview.length > 0 && (
        <div className="rounded border border-[#333]">
          <div className="p-2 text-xs text-[#a6a6a6]">Rows loaded: {csvPreview.length}</div>
        </div>
      )}

      {/* Progress bar */}
      {running && (
        <div className="h-2 w-full rounded bg-[#2a2a2a]">
          <div
            className="h-2 rounded bg-[#00E091] transition-all"
            style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
          />
        </div>
      )}

      {/* Results: each row shows Request on left half and Response on right half */}
      {results.length > 0 && (
        <div className="flex-1 overflow-auto rounded border border-[#333] p-3">
          <div className="overflow-auto rounded border border-[#333]">
            <table className="w-full text-xs">
              <thead className="border-b border-[#333] bg-[#1e1e1e]">
                <tr>
                  <th className="w-1/2 p-2 text-left text-white">Request</th>
                  <th className="w-1/2 p-2 text-left text-white">Response</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, idx) => (
                  <>
                    {/* Execution header row */}
                    <tr key={`hdr-${idx}`}>
                      <td colSpan={2} className="px-2 py-1 text-xs text-[#c8c8c8]">
                        <div className="flex items-center justify-between rounded border border-[#333] bg-[#222] px-2 py-1">
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-[#111] px-2 py-0.5 text-[#a6a6a6]">
                              Execution {idx + 1}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px]">
                            {typeof r.status === 'number' && (
                              <span
                                className={`rounded px-2 py-0.5 font-semibold ${r.status >= 200 && r.status < 300 ? 'bg-[#0f3] text-black' : 'bg-[#f33] text-white'}`}
                              >
                                {r.status}
                              </span>
                            )}
                            {typeof r.durationMs === 'number' && (
                              <span className="text-[#a6a6a6]">{r.durationMs}ms</span>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr key={`pair-${idx}`} className="border-b border-[#2d2d2d] align-top">
                      {/* Left: Request mini-table */}
                      <td className="w-1/2 p-2">
                        <div className="overflow-auto rounded border border-[#333] bg-[#171717] p-2">
                          {(() => {
                            const cols = 'grid-cols-2';
                            return (
                              <div className={`grid ${cols} gap-2`}>
                                {filteredRequestFields.map(f => (
                                  <div
                                    key={`req-${idx}-${f.path}`}
                                    className="flex items-center justify-between gap-3 rounded bg-transparent px-2 py-1"
                                  >
                                    <span className="text-[#a6a6a6]">{f.alias || f.path}:</span>
                                    <span className="text-[#00E091]">
                                      {String(getNested(r.payload, f.path))}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </td>
                      {/* Right: Response mini-table */}
                      <td className="w-1/2 p-2">
                        <div className="overflow-auto rounded border border-[#333] bg-[#171717] p-2">
                          {(() => {
                            const cols = 'grid-cols-2';
                            return (
                              <div className={`grid ${cols} gap-2`}>
                                {filteredResponseFields.map(f => (
                                  <div
                                    key={`res-${idx}-${f.path}`}
                                    className="flex items-center justify-between gap-3 rounded bg-transparent px-2 py-1"
                                  >
                                    <span className="text-[#a6a6a6]">{f.alias || f.path}:</span>
                                    <span className="text-[#00E091]">
                                      {String(getNested(r.response, f.path))}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </td>
                    </tr>
                    <tr key={`payload-${idx}`} className="border-b border-[#2d2d2d]">
                      <td colSpan={2} className="p-2">
                        <details>
                          <summary className="cursor-pointer text-xs text-[#a6a6a6] hover:text-white">
                            View payload
                          </summary>
                          <pre className="mt-2 max-h-56 overflow-auto rounded bg-[#151515] p-3 text-[11px] leading-4 text-[#cfcfcf]">
                            {typeof r.payload === 'string'
                              ? r.payload
                              : JSON.stringify(r.payload, null, 2)}
                          </pre>
                        </details>
                      </td>
                    </tr>
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Exports for each side */}
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              onClick={() => {
                const rows = results.map(r => {
                  const row: any = {};
                  filteredRequestFields.forEach(f => {
                    row[f.alias || f.path] = getNested(r.payload, f.path);
                  });
                  return row;
                });
                const csv = Papa.unparse(rows);
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'report-request.csv';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="rounded border border-[#333] bg-[#2b2b2b] px-3 py-1 text-xs text-white hover:bg-[#343434]"
            >
              Export Request CSV
            </button>
            <button
              onClick={() => {
                const rows = results.map(r => {
                  const row: any = {};
                  filteredResponseFields.forEach(f => {
                    row[f.alias || f.path] = getNested(r.response, f.path);
                  });
                  return row;
                });
                const csv = Papa.unparse(rows);
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'report-response.csv';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="rounded border border-[#333] bg-[#2b2b2b] px-3 py-1 text-xs text-white hover:bg-[#343434]"
            >
              Export Response CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
