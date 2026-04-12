'use client';

import React, { useState } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { validateBulkImport } from '@/lib/utils/validators';

interface BulkImportProps {
  onImport: (csvData: string, template: string) => Promise<void>;
  onCancel: () => void;
}

export default function BulkImport({ onImport, onCancel }: BulkImportProps) {
  const [csvInput, setCsvInput] = useState('');
  const [template, setTemplate] = useState('elegant');
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    setError(null);

    const validation = validateBulkImport({
      csvData: csvInput,
      defaultTemplate: template,
    });
    if (!validation.success) {
      setError(validation.errors.join(', '));
      return;
    }

    setIsImporting(true);
    try {
      await onImport(csvInput, template);
      setCsvInput('');
    } catch {
      setError('Import failed. Please check your CSV format.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
        <p className="text-blue-300 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            CSV Format: name,phone,email,event_type,date,description
            <br />
            Example: John,+1234567890,john@email.com,birthday,2024-12-25,Birthday Party
          </span>
        </p>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-3">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      <textarea
        placeholder="Paste your CSV data here..."
        className="w-full bg-slate-700 rounded-lg p-3 border border-slate-600 h-32 text-xs font-mono text-white placeholder-slate-400"
        value={csvInput}
        onChange={(e) => setCsvInput(e.target.value)}
      />

      <select
        className="w-full bg-slate-700 rounded-lg p-3 border border-slate-600 text-white"
        value={template}
        onChange={(e) => setTemplate(e.target.value)}
      >
        <option value="elegant">Elegant Floral Design</option>
        <option value="fun">Fun & Colorful</option>
        <option value="corporate">Corporate Professional</option>
        <option value="romantic">Romantic & Intimate</option>
        <option value="dark">Dark & Mysterious</option>
      </select>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleImport}
          disabled={isImporting || !csvInput.trim()}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2"
        >
          <Upload className="w-4 h-4" />
          {isImporting ? 'Importing...' : 'Import CSV Data'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 bg-slate-600 hover:bg-slate-700 text-white rounded-lg"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
