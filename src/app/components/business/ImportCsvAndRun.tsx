import React, { useState } from 'react';

// import { CsvService } from '../../services/CsvService'; // Uncomment and adjust path as needed
// import { RequestsService } from '../../services/RequestsService'; // Uncomment and adjust path as needed

interface ImportCsvAndRunProps {
  placeholderHeaders: string[];
  endpoint: string;
  method: string;
  payloadTemplate: object;
}

interface CsvRow {
  [key: string]: string;
}

interface BatchResult {
  row: CsvRow;
  status: 'success' | 'error';
  response?: any;
  error?: string;
}

export const ImportCsvAndRun: React.FC<ImportCsvAndRunProps> = ({
  placeholderHeaders,
  endpoint,
  method,
  payloadTemplate,
}) => {
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse CSV file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const text = evt.target?.result as string;
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length < 1) {
        setError('Arquivo CSV vazio ou inválido.');
        return;
      }
      const headers = lines[0].split(',');
      const rows: CsvRow[] = lines.slice(1).map(line => {
        const values = line.split(',');
        const row: CsvRow = {};
        headers.forEach((h, i) => {
          row[h.trim()] = values[i]?.trim() ?? '';
        });
        return row;
      });
      setCsvRows(rows);
      setError(null);
    };
    reader.readAsText(file);
  };

  // Run batch execution
  const handleRunBatch = async () => {
    setLoading(true);
    setResults([]);
    setError(null);
    // For demo, simulate batch execution
    // Replace with CsvService.runBatch and RequestsService for real implementation
    const batchResults: BatchResult[] = await Promise.all(
      csvRows.map(async row => {
        try {
          // const resolvedPayload = substitutePlaceholders(payloadTemplate, row);
          // const response = await RequestsService.executeOnce(resolvedPayload, endpoint, method);
          // return { row, status: 'success', response };
          await new Promise(res => setTimeout(res, 500));
          return { row, status: 'success', response: { echo: row } };
        } catch (err: any) {
          return { row, status: 'error', error: err?.message || String(err) };
        }
      })
    );
    setResults(batchResults);
    setLoading(false);
  };

  return (
    <div className="p-4">
      <h2 className="mb-2 text-lg font-bold">Importar CSV e Executar em Massa</h2>
      <input type="file" accept=".csv" onChange={handleFileChange} className="mb-2" />
      <button
        onClick={handleRunBatch}
        className="mb-2 rounded bg-green-600 px-4 py-2 text-white"
        disabled={loading || csvRows.length === 0}
      >
        {loading ? 'Executando...' : 'Executar em Massa'}
      </button>
      {error && <div className="mb-2 text-red-600">{error}</div>}
      {results.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 font-bold">Resultados</h3>
          <table className="w-full border text-xs">
            <thead>
              <tr>
                {placeholderHeaders.map(h => (
                  <th key={h} className="border px-2 py-1">
                    {h}
                  </th>
                ))}
                <th className="border px-2 py-1">Status</th>
                <th className="border px-2 py-1">Resposta/Erro</th>
              </tr>
            </thead>
            <tbody>
              {results.map((res, idx) => (
                <tr key={idx} className={res.status === 'error' ? 'bg-red-50' : ''}>
                  {placeholderHeaders.map(h => (
                    <td key={h} className="border px-2 py-1">
                      {res.row[h]}
                    </td>
                  ))}
                  <td className="border px-2 py-1">{res.status}</td>
                  <td className="border px-2 py-1">
                    {res.status === 'success' ? (
                      <pre>{JSON.stringify(res.response, null, 2)}</pre>
                    ) : (
                      <span className="text-red-600">{res.error}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
