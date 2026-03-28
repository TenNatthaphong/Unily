import React from 'react';
import { Upload, Loader2 } from 'lucide-react';

interface Props {
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isImporting: boolean;
  className?: string;
}

export function ImportCsvBtn({ onImport, isImporting, className = '' }: Props) {
  return (
    <label className={`btn btn-import ${className}`} style={{ margin: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
      {isImporting ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
      นำเข้า CSV
      <input type="file" hidden accept=".csv" onChange={onImport} disabled={isImporting} />
    </label>
  );
}
