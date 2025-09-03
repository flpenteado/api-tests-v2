import React from 'react';

// import { CsvService } from '../../services/CsvService'; // Uncomment and adjust path as needed

interface DownloadCsvTemplateButtonProps {
  placeholderHeaders: string[];
  filename?: string;
}

export const DownloadCsvTemplateButton: React.FC<DownloadCsvTemplateButtonProps> = ({
  placeholderHeaders,
  filename = 'template.csv',
}) => {
  // Generate CSV content
  const generateCsv = () => {
    // If using CsvService, replace below
    // return CsvService.generateTemplate(placeholderHeaders);
    return placeholderHeaders.join(',') + '\n';
  };

  // Download CSV file
  const handleDownload = () => {
    const csvContent = generateCsv();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      className="rounded bg-blue-600 px-4 py-2 text-white"
      disabled={placeholderHeaders.length === 0}
      title={
        placeholderHeaders.length === 0 ? 'Nenhum placeholder definido' : 'Baixar template CSV'
      }
    >
      Baixar Template CSV
    </button>
  );
};
