import type { SchemaNode } from '../../types';

interface TreeNodeProps {
  node: SchemaNode & { children: SchemaNode[] };
  onSelect: (node: SchemaNode) => void;
  onDelete: (nodeId: string) => void;
  selectedId: string | null;
}

export default function TreeNode({
  node,
  onSelect,
  onDelete,
  selectedId,
}: TreeNodeProps) {
  return (
    <div className="ml-4 mb-2">
      <div
        className={`flex items-center gap-2 p-1 rounded cursor-pointer ${
          selectedId === node.id
            ? 'bg-blue-100 dark:bg-blue-900'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        onClick={() => onSelect(node)}
      >
        <span className="font-medium">{node.name}</span>
        <span className="text-xs text-gray-500">{node.kind}</span>
        {node.isTemporary && (
          <span className="text-xs text-orange-500">(temp)</span>
        )}
        {node.isTemporary && (
          <button
            type="button"
            className="ml-2 text-red-500 hover:text-red-700 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.id);
            }}
          >
            Delete
          </button>
        )}
      </div>
      {node.children.length > 0 && (
        <div className="ml-4">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={{ ...child, children: child.children ?? [] }}
              onSelect={onSelect}
              onDelete={onDelete}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
