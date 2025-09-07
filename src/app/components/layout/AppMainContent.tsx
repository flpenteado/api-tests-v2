import React from 'react';

import Papa from 'papaparse';

import { useAppStore } from '@/app/state/StoreProvider';
import {
  VARIABLE_REGEX,
  substitutePlaceholders,
  substitutePlaceholdersInText,
} from '@/app/utils/placeholders';

import type { HttpMethod } from '../../../types/modularApiTesting';
import { JsonEditor } from '../json-editor/JsonEditor';

// Helper function to extract value at a specific path from an object
const getValueAtPath = (obj: any, path: string): any => {
  try {
    const parts = path.split(/[\.\[\]]+/).filter(Boolean);
    let current = obj;
    for (const part of parts) {
      if (current && typeof current === 'object') {
        current = current[isNaN(Number(part)) ? part : Number(part)];
      } else {
        return undefined;
      }
    }
    return current;
  } catch {
    return undefined;
  }
};

// Helper function to format value for subtle display
const formatValueSubtly = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') {
    return value.length > 30 ? `"${value.substring(0, 27)}..."` : `"${value}"`;
  }
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `[${value.length} items]`;
  if (typeof value === 'object') return '[object]';
  return String(value);
};

interface AppMainContentProps {
  onSend: () => void;
}

export function AppMainContent({ onSend }: AppMainContentProps) {
  const endpoint = useAppStore(s => s.endpoint);
  const setEndpoint = useAppStore(s => s.setEndpoint);
  const method = useAppStore(s => s.method);
  const setMethod = useAppStore(s => s.setMethod);
  const body = useAppStore(s => s.body);
  const setBody = useAppStore(s => s.setBody);
  const response = useAppStore(s => s.response);
  const placeholders = useAppStore(s => s.placeholders);
  const placeholderValues = useAppStore(s => s.placeholderValues);
  const setPlaceholderValue = useAppStore(s => s.setPlaceholderValue);
  const availableRequestFields = useAppStore(s => s.availableRequestFields);
  const availableResponseFields = useAppStore(s => s.availableResponseFields);
  const selectedRequestFields = useAppStore(s => s.selectedRequestFields);
  const setSelectedRequestFields = useAppStore(s => s.setSelectedRequestFields);
  const selectedResponseFields = useAppStore(s => s.selectedResponseFields);
  const setSelectedResponseFields = useAppStore(s => s.setSelectedResponseFields);
  const [activeTab, setActiveTab] = React.useState<'Request' | 'Display' | 'Execute'>('Request');
  // Resizable variables panel
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [rightWidth, setRightWidth] = React.useState<number>(350);
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
              <div className="flex h-full max-h-full gap-4 overflow-hidden p-4">
                {/* Left: Request + Response stacked */}
                <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden">
                  {/* Method + Endpoint + Send inside Request tab */}
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <select
                      className="rounded border border-[#333] bg-[#252526] px-3 py-2 font-bold text-white focus:border-[#00E091] focus:outline-none"
                      value={method}
                      onChange={e => setMethod(e.target.value as HttpMethod)}
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
                      onChange={e => setEndpoint(e.target.value)}
                      placeholder="Enter request URL..."
                    />

                    <button
                      className="rounded bg-[#00E091] px-6 py-2 font-bold text-black transition-colors hover:bg-[#00c97b]"
                      onClick={onSend}
                    >
                      Send
                    </button>
                  </div>

                  <h3 className="mb-2 flex-shrink-0 font-semibold text-white">Request</h3>
                  <div className="max-h-[300px] min-h-[160px] flex-shrink-0 overflow-auto rounded border border-[#333] bg-[#1e1e1e]">
                    <JsonEditor value={body} onChange={setBody} editable={true} />
                  </div>
                  <div className="flex min-h-0 min-h-[200px] flex-1 flex-col">
                    <h3 className="mb-2 flex-shrink-0 font-semibold text-white">Response</h3>
                    {/* Status and Duration */}
                    {response && (
                      <div className="mb-2 flex flex-shrink-0 items-center gap-4 text-sm">
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
                    <div className="min-h-[120px] flex-1 overflow-auto rounded border border-[#333] bg-[#1e1e1e]">
                      {response && response.response !== null && response.response !== undefined ? (
                        <JsonEditor
                          value={
                            typeof response.response === 'object'
                              ? JSON.stringify(response.response, null, 2)
                              : String(response.response)
                          }
                          editable={false}
                        />
                      ) : response && response.response === null ? (
                        <JsonEditor value="null" editable={false} />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[#a6a6a6]">
                          {response ? 'Empty response' : 'No response yet'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div
                  onMouseDown={handleDividerMouseDown}
                  className="w-[6px] flex-shrink-0 cursor-col-resize rounded bg-[#2a2a2a] hover:bg-[#3a3a3a]"
                  aria-label="Resize variables panel"
                  role="separator"
                />

                {/* Right: Variables column (inside same container) */}
                <div
                  style={{ width: rightWidth }}
                  className="max-w-[600px] min-w-[240px] flex-shrink-0 overflow-hidden"
                >
                  <h3 className="mb-2 font-semibold text-white">Variables</h3>
                  <div className="max-h-full overflow-auto rounded border border-[#333] bg-[#1e1e1e]">
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
                                onChange={e => setPlaceholderValue(p.name, e.target.value)}
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

                            const toggleSelect = () => {
                              setSelectedRequestFields(prev => {
                                const exists = prev.some(f => f.path === fieldPath);
                                return exists
                                  ? prev.filter(f => f.path !== fieldPath)
                                  : [...prev, { path: fieldPath, alias: '' }];
                              });
                            };

                            const changeAlias = (aliasValue: string) => {
                              setSelectedRequestFields(prev =>
                                prev.map(f =>
                                  f.path === fieldPath ? { ...f, alias: aliasValue } : f
                                )
                              );
                            };

                            return (
                              <tr
                                key={fieldPath}
                                className="border-b border-[#2d2d2d] last:border-b-0"
                              >
                                <td className="p-2">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={toggleSelect}
                                    className="h-4 w-4 rounded border-[#333] bg-[#252526] text-[#00E091] focus:ring-2 focus:ring-[#00E091]"
                                  />
                                </td>
                                <td className="p-2">
                                  <div className="flex flex-col">
                                    <span className="text-[#00E091]">{fieldPath}</span>
                                    {(() => {
                                      // Try to resolve placeholders in the body text before parsing
                                      try {
                                        const resolvedText = substitutePlaceholdersInText(
                                          body,
                                          placeholderValues
                                        );
                                        const cleaned = resolvedText.replace(
                                          VARIABLE_REGEX,
                                          (m: string, _k: string, offset: number) => {
                                            const before = resolvedText[offset - 1];
                                            const after = resolvedText[offset + m.length];
                                            const isQuoted = before === '"' && after === '"';
                                            return isQuoted ? '' : 'null';
                                          }
                                        );
                                        const parsed = JSON.parse(cleaned);
                                        const value = getValueAtPath(parsed, fieldPath);
                                        const formattedValue = formatValueSubtly(value);
                                        if (formattedValue) {
                                          return (
                                            <span className="mt-0.5 text-xs text-[#666]">
                                              {formattedValue}
                                            </span>
                                          );
                                        }
                                      } catch {
                                        // Ignore parsing errors
                                      }
                                      // Fallback: when listing placeholders directly, show their current values
                                      if (availableRequestFields.length === 0) {
                                        const hasKey = Object.prototype.hasOwnProperty.call(
                                          placeholderValues,
                                          fieldPath
                                        );
                                        const val = (placeholderValues as any)[fieldPath];
                                        const hasValue =
                                          hasKey && val !== '' && val !== undefined && val !== null;
                                        if (hasValue) {
                                          const formatted = formatValueSubtly(val);
                                          if (formatted) {
                                            return (
                                              <span className="mt-0.5 text-xs text-[#666]">
                                                {formatted}
                                              </span>
                                            );
                                          }
                                        } else {
                                          return (
                                            <span className="mt-0.5 text-xs text-[#555]">
                                              no value
                                            </span>
                                          );
                                        }
                                      }
                                      return null;
                                    })()}
                                  </div>
                                </td>
                                <td className="p-2">
                                  <input
                                    className="w-full rounded border border-[#333] bg-[#252526] px-1 py-0.5 text-xs text-white focus:border-[#00E091] focus:outline-none"
                                    value={alias}
                                    onChange={e => changeAlias(e.target.value)}
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

                            const toggleSelect = () => {
                              setSelectedResponseFields(prev => {
                                const exists = prev.some(f => f.path === fieldPath);
                                return exists
                                  ? prev.filter(f => f.path !== fieldPath)
                                  : [...prev, { path: fieldPath, alias: '' }];
                              });
                            };

                            const changeAlias = (aliasValue: string) => {
                              setSelectedResponseFields(prev =>
                                prev.map(f =>
                                  f.path === fieldPath ? { ...f, alias: aliasValue } : f
                                )
                              );
                            };

                            return (
                              <tr
                                key={fieldPath}
                                className="border-b border-[#2d2d2d] last:border-b-0"
                              >
                                <td className="p-2">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={toggleSelect}
                                    className="h-4 w-4 rounded border-[#333] bg-[#252526] text-[#00E091] focus:ring-2 focus:ring-[#00E091]"
                                  />
                                </td>
                                <td className="p-2">
                                  <div className="flex flex-col">
                                    <span className="text-[#00E091]">{fieldPath}</span>
                                    {(() => {
                                      if (
                                        response &&
                                        response.response &&
                                        typeof response.response === 'object'
                                      ) {
                                        const value = getValueAtPath(response.response, fieldPath);
                                        const formattedValue = formatValueSubtly(value);
                                        if (formattedValue) {
                                          return (
                                            <span className="mt-0.5 text-xs text-[#666]">
                                              {formattedValue}
                                            </span>
                                          );
                                        }
                                      }
                                      return null;
                                    })()}
                                  </div>
                                </td>
                                <td className="p-2">
                                  <input
                                    className="w-full rounded border border-[#333] bg-[#252526] px-1 py-0.5 text-xs text-white focus:border-[#00E091] focus:outline-none"
                                    value={alias}
                                    onChange={e => changeAlias(e.target.value)}
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
            {activeTab === 'Execute' && <BatchExecutor />}
          </div>
        </div>
      </div>
    </div>
  );
}

// -- Execute tab component -- //
function BatchExecutor() {
  // Zustand state
  const endpoint = useAppStore(s => s.endpoint);
  const method = useAppStore(s => s.method);
  const bodyTemplate = useAppStore(s => s.body);
  const placeholders = useAppStore(s => s.placeholders).map(p => p.name);
  const selectedRequestFields = useAppStore(s => s.selectedRequestFields);
  const selectedResponseFields = useAppStore(s => s.selectedResponseFields);
  const availableRequestFields = useAppStore(s => s.availableRequestFields);
  const availableResponseFields = useAppStore(s => s.availableResponseFields);

  // Table data state - this will be the source of truth
  const [tableData, setTableData] = React.useState<any[]>([]);
  const [running, setRunning] = React.useState(false);
  const [results, setResults] = React.useState<
    { row: any; status: number; response: any; durationMs: number; payload: any }[]
  >([]);
  const [progress, setProgress] = React.useState({ done: 0, total: 0 });

  // Get all columns for the table (title + placeholders)
  const tableColumns = React.useMemo(() => {
    const columns = ['[title]', ...Array.from(new Set(placeholders))];
    return columns;
  }, [placeholders]);

  const [modalData, setModalData] = React.useState<{
    isOpen: boolean;
    title: string;
    data: any;
  }>({
    isOpen: false,
    title: '',
    data: null,
  });

  const openModal = (title: string, data: any) => {
    setModalData({
      isOpen: true,
      title,
      data,
    });
  };

  const closeModal = () => {
    setModalData({
      isOpen: false,
      title: '',
      data: null,
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const downloadTemplate = () => {
    // First column should be [title] for execution titles, followed by variables
    const uniq = Array.from(new Set(placeholders));
    const headers = ['[title]', ...uniq];
    const csv = Papa.unparse([headers]);
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
        const data = res.data as any[];
        setTableData(data);
        setResults([]); // Clear previous results when uploading new CSV
      },
    });
  };

  // Add a new empty row to the table
  const addTableRow = () => {
    const newRow: any = {};
    tableColumns.forEach(col => {
      newRow[col] = '';
    });
    setTableData([...tableData, newRow]);
  };

  // Remove a row from the table
  const removeTableRow = (index: number) => {
    const newData = tableData.filter((_, i) => i !== index);
    setTableData(newData);
  };

  // Update a cell value in the table
  const updateTableCell = (rowIndex: number, columnName: string, value: string) => {
    const newData = [...tableData];
    newData[rowIndex] = { ...newData[rowIndex], [columnName]: value };
    setTableData(newData);
  };

  // Clear all table data
  const clearTableData = () => {
    setTableData([]);
    setResults([]);
  };

  const executeBatch = async () => {
    if (!tableData.length) return;
    setRunning(true);
    setResults([]);
    setProgress({ done: 0, total: tableData.length });

    const out: { row: any; status: number; response: any; durationMs: number; payload: any }[] =
      new Array(tableData.length);

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

    const runOne = async (i: number) => {
      const row = tableData[i];
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
        setProgress({ done: i + 1, total: tableData.length });
      }
    };

    // Sequential execution - process one row at a time
    for (let i = 0; i < tableData.length; i++) {
      await runOne(i);
    }
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
    return selectedRequestFields.filter(
      f => avail.includes(f.path) && !phSet.has(f.path) && !pairedPlaceholderNames.has(f.path)
    );
  }, [selectedRequestFields, availableRequestFields, placeholders, pairedPlaceholderNames]);
  const filteredResponseFields = React.useMemo(
    () => selectedResponseFields.filter(f => (availableResponseFields || []).includes(f.path)),
    [selectedResponseFields, availableResponseFields]
  );

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
        </div>
        <button
          disabled={!tableData.length || running}
          onClick={executeBatch}
          className={`rounded px-4 py-1 text-sm font-semibold ${!tableData.length || running ? 'bg-[#2a2a2a] text-[#777]' : 'bg-[#00E091] text-black hover:bg-[#00c97b]'}`}
        >
          {running ? 'Processing…' : 'Run'}
        </button>
      </div>

      {/* Editable Table */}
      <div className="rounded border border-[#333] bg-[#1e1e1e]">
        <div className="flex items-center justify-between border-b border-[#333] p-3">
          <h3 className="text-sm font-semibold text-white">Test Data</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#a6a6a6]">Rows: {tableData.length}</span>
            {tableData.length > 0 && (
              <button
                onClick={clearTableData}
                className="rounded border border-[#f33] bg-transparent px-3 py-1 text-xs font-semibold text-[#f33] hover:bg-[#f33] hover:text-white"
              >
                Clear All
              </button>
            )}
            <button
              onClick={addTableRow}
              className="rounded bg-[#00E091] px-3 py-1 text-xs font-semibold text-black hover:bg-[#00c97b]"
            >
              Add Row
            </button>
          </div>
        </div>

        {tableColumns.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[#333] bg-[#2a2a2a]">
                <tr>
                  <th className="w-8 p-2"></th>
                  {tableColumns.map(col => (
                    <th
                      key={col}
                      className="min-w-[120px] p-2 text-left font-medium text-[#a6a6a6]"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={tableColumns.length + 1}
                      className="p-8 text-center text-[#a6a6a6]"
                    >
                      No data. Add a row to get started or upload a CSV file.
                    </td>
                  </tr>
                ) : (
                  tableData.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className="border-b border-[#2d2d2d] last:border-b-0 hover:bg-[#252526]"
                    >
                      <td className="p-2">
                        <button
                          onClick={() => removeTableRow(rowIndex)}
                          className="text-[#f33] hover:text-[#ff6b6b]"
                          title="Remove row"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </td>
                      {tableColumns.map(col => (
                        <td key={col} className="p-2">
                          <input
                            type="text"
                            value={row[col] || ''}
                            onChange={e => updateTableCell(rowIndex, col, e.target.value)}
                            className="w-full rounded border border-[#333] bg-[#252526] px-2 py-1 text-sm text-white focus:border-[#00E091] focus:outline-none"
                            placeholder={
                              col === '[title]' ? 'Execution title...' : `Enter ${col}...`
                            }
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
          <div className="space-y-1">
            {results.map((r, idx) => (
              <div key={idx} className="border-b border-[#333] bg-[#2a2a2a] last:border-b-0">
                {/* Execution Header */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    {/* Status Icon */}
                    {r.status >= 200 && r.status < 300 ? (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#00E091]">
                        <svg
                          className="h-3 w-3 text-black"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f33]">
                        <svg
                          className="h-3 w-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </div>
                    )}
                    <span className="text-base font-medium text-white">
                      {r.row['[title]'] && r.row['[title]'].trim()
                        ? r.row['[title]'].trim()
                        : `Execution ${idx + 1}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-2 py-1 text-sm font-semibold ${
                        r.status >= 200 && r.status < 300
                          ? 'bg-[#00E091] text-black'
                          : 'bg-[#f33] text-white'
                      }`}
                    >
                      {r.status}
                    </span>
                    <span className="text-sm text-[#a6a6a6]">{r.durationMs}ms</span>
                  </div>
                </div>

                {/* Content - Always Visible */}
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Left: Request Data */}
                    <div className="rounded border border-[#333] bg-[#252526] p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-[#a6a6a6]">Request</h4>
                        <button
                          className="text-xs text-[#00E091] hover:text-[#00c97b]"
                          onClick={e => {
                            e.stopPropagation();
                            openModal(
                              `Request - ${
                                r.row['[title]'] && r.row['[title]'].trim()
                                  ? r.row['[title]'].trim()
                                  : `Execution ${idx + 1}`
                              }`,
                              r.payload
                            );
                          }}
                        >
                          View Raw Data
                        </button>
                      </div>
                      <div className="space-y-1">
                        {filteredRequestFields.map(f => (
                          <div
                            key={`req-${idx}-${f.path}`}
                            className="flex items-center justify-between gap-3"
                          >
                            <span className="text-sm text-[#a6a6a6]">{f.alias || f.path}:</span>
                            <span className="text-sm text-white">
                              {String(getNested(r.payload, f.path))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right: Response Data */}
                    <div className="rounded border border-[#333] bg-[#252526] p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-[#a6a6a6]">Response</h4>
                        <button
                          className="text-xs text-[#00E091] hover:text-[#00c97b]"
                          onClick={e => {
                            e.stopPropagation();
                            openModal(
                              `Response - ${
                                r.row['[title]'] && r.row['[title]'].trim()
                                  ? r.row['[title]'].trim()
                                  : `Execution ${idx + 1}`
                              }`,
                              r.response
                            );
                          }}
                        >
                          View Raw Data
                        </button>
                      </div>
                      <div className="space-y-1">
                        {r.status >= 200 && r.status < 300 ? (
                          filteredResponseFields.map(f => (
                            <div
                              key={`res-${idx}-${f.path}`}
                              className="flex items-center justify-between gap-3"
                            >
                              <span className="text-sm text-[#a6a6a6]">{f.alias || f.path}:</span>
                              <span className="text-sm text-white">
                                {String(getNested(r.response, f.path))}
                              </span>
                            </div>
                          ))
                        ) : (
                          <>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm text-[#a6a6a6]">Error:</span>
                              <span className="text-sm text-[#f33]">
                                {r.response?.error || 'Internal Server Error'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm text-[#a6a6a6]">Message:</span>
                              <span className="text-sm text-[#a6a6a6]">
                                {r.response?.message || 'An unexpected error occurred.'}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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

      {/* JSON Modal */}
      {modalData.isOpen && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="max-h-[80vh] w-[90vw] max-w-4xl rounded-lg border border-[#333] bg-[#1e1e1e]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#333] px-6 py-4">
              <h2 className="text-lg font-semibold text-white">{modalData.title}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const jsonText =
                      typeof modalData.data === 'string'
                        ? modalData.data
                        : JSON.stringify(modalData.data, null, 2);
                    copyToClipboard(jsonText);
                  }}
                  className="flex items-center gap-2 rounded bg-[#00E091] px-3 py-1 text-sm font-semibold text-black hover:bg-[#00c97b]"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy
                </button>
                <button onClick={closeModal} className="text-[#a6a6a6] hover:text-white">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            {/* Modal Content */}
            <div className="overflow-auto p-6">
              <pre className="overflow-auto rounded bg-[#151515] p-4 text-sm text-[#cfcfcf]">
                <code>
                  {typeof modalData.data === 'string'
                    ? modalData.data
                    : JSON.stringify(modalData.data, null, 2)}
                </code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
