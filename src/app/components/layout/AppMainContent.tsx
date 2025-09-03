import React from 'react';

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
}: AppMainContentProps) {
  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* Top: Method + Endpoint + Send */}
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

      {/* Main content: Request and Response panels */}
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {/* Request Panel */}
        <div className="flex flex-1 flex-col rounded border border-[#333] bg-[#252526] p-4">
          <div className="mb-3 flex flex-shrink-0 items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="font-semibold text-white">Request</h3>
              {/* Tabs */}
              <div className="flex text-sm">
                <button className="border-b-2 border-[#00E091] px-3 py-1 font-semibold text-[#00E091]">
                  Body
                </button>
                <button className="px-3 py-1 text-[#a6a6a6] hover:text-white">Params</button>
                <button className="px-3 py-1 text-[#a6a6a6] hover:text-white">Headers</button>
                <button className="px-3 py-1 text-[#a6a6a6] hover:text-white">Auth</button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden rounded border border-[#333] bg-[#1e1e1e]">
            <JsonEditor value={body} onChange={onBodyChange} editable={true} />
          </div>
        </div>

        {/* Response Panel */}
        <div className="flex flex-1 flex-col rounded border border-[#333] bg-[#252526] p-4">
          <div className="mb-3 flex flex-shrink-0 items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="font-semibold text-white">Response</h3>

              {/* Status and Duration */}
              {response && (
                <div className="flex items-center gap-4 text-sm">
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
            </div>
          </div>

          <div className="flex-1 overflow-hidden rounded border border-[#333] bg-[#1e1e1e]">
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
    </div>
  );
}
