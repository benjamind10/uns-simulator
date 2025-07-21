import { parseSchemaFile } from '../../utils/parseSchemaFile';
import { toast } from 'react-hot-toast';
import type { SchemaNode } from '../../types';

interface Props {
  onImport(nodes: SchemaNode[]): void;
}

export default function FileUpload({ onImport }: Props) {
  const handleFiles = async (files: FileList | null) => {
    if (!files?.[0]) return;
    const file = files[0];
    try {
      const nodes = await parseSchemaFile(file, []);
      onImport(nodes);
      toast.success(`${nodes.length} nodes imported`);
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        toast.error(err.message || 'Invalid schema file');
      } else {
        toast.error('Invalid schema file');
      }
    }
  };

  return (
    <label className="cursor-pointer">
      <input
        type="file"
        accept=".uns.json,application/json"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <span className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700">
        Import .uns.json
      </span>
    </label>
  );
}
