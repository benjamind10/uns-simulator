import { UploadCloud } from 'lucide-react';
import { useRef } from 'react';
import { toast } from 'react-hot-toast';

import type { ISchemaNode } from '../../types';

interface FileUploadProps {
  onImport: (nodes: ISchemaNode[]) => void;
}

export default function FileUpload({ onImport }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    file
      .text()
      .then((json) => {
        try {
          const parsed = JSON.parse(json);
          onImport(parsed);
          toast.success('Schema imported successfully');
        } catch (err) {
          console.error('JSON parse error:', err);
          toast.error('Failed to import: Invalid JSON file');
        }
      })
      .catch((err) => {
        console.error('File read error:', err);
        toast.error('Failed to read file');
      });
    e.target.value = ''; // allow re‑selecting same file later
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".uns.json"
        className="hidden"
        onChange={handleChange}
      />
      {/* Visible control */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
      >
        <UploadCloud className="w-4 h-4" />
        Import&nbsp;.uns.json
      </button>
    </>
  );
}
