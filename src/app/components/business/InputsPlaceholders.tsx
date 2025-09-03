import React, { useState } from 'react';

import { PlaceholderMeta } from './PlaceholdersConfig';

// import { RequestsService } from '../../services/RequestsService'; // Uncomment and adjust path as needed
// import { substitutePlaceholders } from '../../utils/placeholders/jsonUtils'; // Uncomment and adjust path as needed

interface InputsPlaceholdersProps {
  placeholders: PlaceholderMeta[];
  payloadTemplate: object; // JSON with placeholders
  endpoint: string;
  method: string;
  onExecuted?: (result: any) => void;
}

export const InputsPlaceholders: React.FC<InputsPlaceholdersProps> = ({
  placeholders,
  payloadTemplate,
  endpoint,
  method,
  onExecuted,
}) => {
  const [values, setValues] = useState<Record<string, string | number>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle input change
  const handleChange = (name: string, value: string) => {
    setValues(v => ({ ...v, [name]: value }));
  };

  // Execute request with substituted payload
  const handleRun = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // Substitute placeholders in payload
      // const resolvedPayload = substitutePlaceholders(payloadTemplate, values);
      // const response = await RequestsService.executeOnce(resolvedPayload, endpoint, method);
      // setResult(response);
      // onExecuted?.(response);
      // For demo, just echo values
      setTimeout(() => {
        setResult({ success: true, sent: values });
        setLoading(false);
      }, 1000);
    } catch (err: any) {
      setError(err?.message || String(err));
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="mb-2 text-lg font-bold">Preencher Placeholders</h2>
      <form
        onSubmit={e => {
          e.preventDefault();
          handleRun();
        }}
        className="mb-4 flex flex-col gap-2"
      >
        {placeholders.map(ph => (
          <div key={ph.name} className="flex items-center gap-2">
            <label className="w-40 font-mono">{ph.name}</label>
            <input
              type="text"
              value={values[ph.name] ?? ''}
              onChange={e => handleChange(ph.name, e.target.value)}
              placeholder={ph.description || ph.path}
              className="flex-1 rounded border px-2 py-1"
              required
            />
          </div>
        ))}
        <button
          type="submit"
          className="mt-2 rounded bg-green-600 px-4 py-2 text-white"
          disabled={loading}
        >
          {loading ? 'Executando...' : 'Executar Request'}
        </button>
      </form>
      {error && <div className="mb-2 text-red-600">{error}</div>}
      {result && (
        <div className="mt-2 rounded bg-gray-100 p-2">
          <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
