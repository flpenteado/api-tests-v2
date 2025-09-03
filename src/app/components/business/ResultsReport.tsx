import React from 'react';

export interface ReportRow {
  requestId: string;
  values: Record<string, string>;
  status?: string;
  error?: string;
}

interface ResultsReportProps {
  data: ReportRow[];
  aliases: string[];
  printMode?: boolean;
}

export const ResultsReport: React.FC<ResultsReportProps> = ({
  data,
  aliases,
  printMode = false,
}) => {
  return (
    <div className={printMode ? 'bg-white p-8' : 'p-4'}>
      <h2 className="mb-2 text-lg font-bold">Relatório de Resultados</h2>
      <table className="mb-4 w-full border text-xs">
        <thead>
          <tr>
            <th className="border px-2 py-1">ID</th>
            {aliases.map(alias => (
              <th key={alias} className="border px-2 py-1">
                {alias}
              </th>
            ))}
            <th className="border px-2 py-1">Status</th>
            <th className="border px-2 py-1">Erro</th>
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.requestId} className={row.error ? 'bg-red-50' : ''}>
              <td className="border px-2 py-1 font-mono">{row.requestId}</td>
              {aliases.map(alias => (
                <td key={alias} className="border px-2 py-1">
                  {row.values[alias]}
                </td>
              ))}
              <td className="border px-2 py-1">{row.status || '-'}</td>
              <td className="border px-2 py-1 text-red-600">{row.error || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {printMode && (
        <div className="mt-4 text-center">
          <button
            onClick={() => window.print()}
            className="rounded bg-gray-800 px-4 py-2 text-white"
          >
            Imprimir / Exportar PDF
          </button>
        </div>
      )}
    </div>
  );
};
