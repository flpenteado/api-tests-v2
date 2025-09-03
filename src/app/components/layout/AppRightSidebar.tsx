import React from 'react';

import { PlaceholderMeta } from '../../../types/modularApiTesting';

interface AppRightSidebarProps {
  // Variables section
  placeholders: PlaceholderMeta[];
  placeholderValues: Record<string, string | number>;
  onPlaceholderValueChange: (name: string, value: string) => void;

  // Request aliases section
  selectedRequestFields: { path: string; alias: string }[];
  onSelectRequestField: (path: string) => void;
  onRequestAliasChange: (path: string, alias: string) => void;

  // Response aliases section
  selectedResponseFields: { path: string; alias: string }[];
  onSelectResponseField: (path: string) => void;
  onResponseAliasChange: (path: string, alias: string) => void;

  // Available fields for selection
  availableRequestFields?: string[];
  availableResponseFields?: string[];

  // For displaying values in alias tables
  response?: any;
}

export function AppRightSidebar({
  placeholders,
  placeholderValues,
  onPlaceholderValueChange,
  selectedRequestFields,
  onSelectRequestField,
  onRequestAliasChange,
  selectedResponseFields,
  onSelectResponseField,
  onResponseAliasChange,
  availableRequestFields = [],
  availableResponseFields = [],
  response,
}: AppRightSidebarProps) {
  // Helper function to get placeholder value for alias display
  const getAliasValue = (fieldPath: string) => {
    const normalize = (str: string) => {
      return str
        .replace(/^(post_|user_|response_|request_)/i, '')
        .replace(/[_{}]/g, '')
        .toLowerCase();
    };

    const fieldNorm = normalize(fieldPath);

    // Find matching placeholder
    let placeholder = placeholders.find(p => {
      const pNorm = normalize(p.name);
      return fieldNorm === pNorm || pNorm.includes(fieldNorm) || fieldNorm.includes(pNorm);
    });

    // Manual mapping for common cases
    if (!placeholder) {
      if (fieldNorm === 'body') {
        placeholder = placeholders.find(p => normalize(p.name).includes('content'));
      } else if (fieldNorm === 'title') {
        placeholder = placeholders.find(p => normalize(p.name).includes('title'));
      } else if (fieldNorm === 'userid') {
        placeholder = placeholders.find(p => normalize(p.name).includes('id'));
      }
    }

    return placeholder ? (placeholderValues[placeholder.name] ?? '') : '';
  };

  // Helper function to get nested value from object using path
  const getNestedValue = (obj: any, path: string): any => {
    if (!obj || !path) return '';

    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined) {
        return '';
      }
      current = current[key];
    }

    return current !== null && current !== undefined ? String(current) : '';
  };

  // Check if a request field is selected
  const isRequestFieldSelected = (fieldPath: string) => {
    return selectedRequestFields.some(f => f.path === fieldPath);
  };

  // Check if a response field is selected
  const isResponseFieldSelected = (fieldPath: string) => {
    return selectedResponseFields.some(f => f.path === fieldPath);
  };

  // Get alias for a field
  const getFieldAlias = (fieldPath: string, fieldType: 'request' | 'response') => {
    const fields = fieldType === 'request' ? selectedRequestFields : selectedResponseFields;
    return fields.find(f => f.path === fieldPath)?.alias || '';
  };

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      {/* Variables Table */}
      <div className="flex-shrink-0">
        <h3 className="mb-3 text-sm font-semibold text-[#00E091]">Variables</h3>
        <div className="rounded border border-[#333] bg-[#1e1e1e]">
          <table className="w-full text-xs">
            <thead className="border-b border-[#333]">
              <tr>
                <th className="p-2 text-left font-medium text-[#a6a6a6]">VARIABLE</th>
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

      {/* Request Aliases Table */}
      {availableRequestFields.length > 0 && (
        <div className="flex-shrink-0">
          <h3 className="mb-3 text-sm font-semibold text-[#00E091]">Request Aliases</h3>
          <div className="rounded border border-[#333] bg-[#1e1e1e]">
            <table className="w-full text-xs">
              <thead className="border-b border-[#333]">
                <tr>
                  <th className="w-8 p-2 text-left font-medium text-[#a6a6a6]"></th>
                  <th className="p-2 text-left font-medium text-[#a6a6a6]">CAMPO</th>
                  <th className="p-2 text-left font-medium text-[#a6a6a6]">ALIAS</th>
                </tr>
              </thead>
              <tbody>
                {availableRequestFields.map(fieldPath => {
                  const isSelected = isRequestFieldSelected(fieldPath);
                  const alias = getFieldAlias(fieldPath, 'request');

                  return (
                    <tr key={fieldPath} className="border-b border-[#2d2d2d] last:border-b-0">
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

      {/* Response Aliases Table */}
      {availableResponseFields.length > 0 && (
        <div className="flex-shrink-0">
          <h3 className="mb-3 text-sm font-semibold text-[#00E091]">Response Aliases</h3>
          <div className="rounded border border-[#333] bg-[#1e1e1e]">
            <table className="w-full text-xs">
              <thead className="border-b border-[#333]">
                <tr>
                  <th className="w-8 p-2 text-left font-medium text-[#a6a6a6]"></th>
                  <th className="p-2 text-left font-medium text-[#a6a6a6]">CAMPO</th>
                  <th className="p-2 text-left font-medium text-[#a6a6a6]">ALIAS</th>
                </tr>
              </thead>
              <tbody>
                {availableResponseFields.map(fieldPath => {
                  const isSelected = isResponseFieldSelected(fieldPath);
                  const alias = getFieldAlias(fieldPath, 'response');

                  return (
                    <tr key={fieldPath} className="border-b border-[#2d2d2d] last:border-b-0">
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
  );
}
