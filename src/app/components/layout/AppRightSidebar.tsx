import React from 'react';

import { PlaceholderMeta } from '../../../types/modularApiTesting';

interface AppRightSidebarProps {
  // Variables section
  placeholders: PlaceholderMeta[];
  placeholderValues: Record<string, string | number>;
  onPlaceholderValueChange: (name: string, value: string) => void;
}

export function AppRightSidebar({
  placeholders,
  placeholderValues,
  onPlaceholderValueChange,
}: AppRightSidebarProps) {
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

      {/* Display configuration moved to Request > Display tab */}
    </div>
  );
}
