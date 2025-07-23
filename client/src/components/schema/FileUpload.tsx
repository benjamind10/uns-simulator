// FileUpload.tsx (drop‑in replacement)
import { UploadCloud } from 'lucide-react'; // or any icon lib you prefer
import { useRef } from 'react';
import type { ISchemaNode } from '../../types';

interface FileUploadProps {
  onImport: (nodes: ISchemaNode[]) => void;
}

export default function FileUpload({ onImport }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((json) => {
      try {
        onImport(JSON.parse(json));
      } catch {
        /* JSON parse error */
      }
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
