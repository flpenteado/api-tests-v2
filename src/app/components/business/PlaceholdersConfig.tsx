import React, { useState } from 'react';

// Types for placeholder metadata
export interface PlaceholderMeta {
  path: string;
  name: string;
  description?: string;
  example?: string | number;
}

interface PlaceholdersConfigProps {
  jsonPaths: string[]; // Paths available for marking as placeholders
  existingPlaceholders?: PlaceholderMeta[];
  onChange?: (placeholders: PlaceholderMeta[]) => void;
}

export const PlaceholdersConfig: React.FC<PlaceholdersConfigProps> = ({
  jsonPaths,
  existingPlaceholders = [],
  onChange,
}) => {
  const [placeholders, setPlaceholders] = useState<PlaceholderMeta[]>(existingPlaceholders);
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Validate duplicate names
  const isDuplicateName = (name: string) =>
    placeholders.some(p => p.name.trim().toLowerCase() === name.trim().toLowerCase());

  // Add placeholder
  const handleAdd = () => {
    if (!selectedPath || !name.trim()) {
      setError('Selecione um path e informe um nome.');
      return;
    }
    if (isDuplicateName(name)) {
      setError('Nome de placeholder já existe.');
      return;
    }
    const newPlaceholder: PlaceholderMeta = {
      path: selectedPath,
      name: name.trim(),
      description: description.trim() || undefined,
    };
    const updated = [...placeholders, newPlaceholder];
    setPlaceholders(updated);
    setSelectedPath('');
    setName('');
    setDescription('');
    setError(null);
    onChange?.(updated);
  };

  // Remove placeholder
  const handleRemove = (path: string) => {
    const updated = placeholders.filter(p => p.path !== path);
    setPlaceholders(updated);
    onChange?.(updated);
  };

  return (
    <div className="p-4">
      <h2 className="mb-2 text-lg font-bold">Configuração de Placeholders</h2>
      <div className="mb-4 flex items-end gap-2">
        <select
          value={selectedPath}
          onChange={e => setSelectedPath(e.target.value)}
          className="rounded border px-2 py-1"
        >
          <option value="">Selecione um path</option>
          {jsonPaths.map(path => (
            <option key={path} value={path}>
              {path}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Nome do placeholder"
          value={name}
          onChange={e => setName(e.target.value)}
          className="rounded border px-2 py-1"
        />
        <input
          type="text"
          placeholder="Descrição (opcional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="rounded border px-2 py-1"
        />
        <button onClick={handleAdd} className="rounded bg-blue-600 px-3 py-1 text-white">
          Adicionar
        </button>
      </div>
      {error && <div className="mb-2 text-red-600">{error}</div>}
      <ul className="mt-2">
        {placeholders.map(p => (
          <li key={p.path} className="mb-1 flex items-center gap-2">
            <span className="rounded bg-gray-100 px-2 py-1 font-mono">{p.path}</span>
            <span className="font-bold">{p.name}</span>
            {p.description && <span className="text-gray-600">{p.description}</span>}
            <button
              onClick={() => handleRemove(p.path)}
              className="rounded px-2 py-1 text-red-600 hover:bg-red-100"
            >
              Remover
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
