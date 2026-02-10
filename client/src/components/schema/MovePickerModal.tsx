import { X } from 'lucide-react';

import type { ISchemaNode } from '../../types';

interface MovePickerModalProps {
  node: ISchemaNode;
  allNodes: ISchemaNode[];
  isOpen: boolean;
  onClose: () => void;
  onMove: (nodeId: string, targetParentId: string | null) => void;
}

export default function MovePickerModal({
  node,
  allNodes,
  isOpen,
  onClose,
  onMove,
}: MovePickerModalProps) {
  if (!isOpen) return null;

  // Get all groups (valid drop targets)
  const groups = allNodes.filter((n) => n.kind === 'group');

  // Check if a group is a descendant of the dragged node
  const isDescendant = (parentId: string, childId: string): boolean => {
    const children = allNodes.filter((n) => n.parent === parentId);
    return children.some(
      (c) => c.id === childId || isDescendant(c.id, childId)
    );
  };

  // Filter out descendants and the node itself
  const validTargets = groups.filter(
    (g) => g.id !== node.id && !isDescendant(node.id, g.id)
  );

  const handleMove = (targetId: string | null) => {
    onMove(node.id, targetId);
    onClose();
  };

  // Build breadcrumb for a node
  const getBreadcrumb = (nodeId: string): string => {
    const parts: string[] = [];
    let current: ISchemaNode | undefined = allNodes.find((n) => n.id === nodeId);
    while (current) {
      parts.unshift(current.name);
      current = allNodes.find((n) => n.id === current!.parent);
    }
    return parts.join(' / ');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Move "{node.name}"
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[400px] overflow-y-auto">
          {/* Root option */}
          <div className="mb-4">
            <button
              onClick={() => handleMove(null)}
              className="w-full text-left px-3 py-2 rounded-md transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <div className="font-medium text-gray-900 dark:text-gray-100">
                Root (Top Level)
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Move to the top level namespace
              </div>
            </button>
          </div>

          {/* Groups list */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 px-3 py-2 uppercase tracking-wide mb-2">
              Groups
            </h4>
            {validTargets.length > 0 ? (
              <div className="space-y-1">
                {validTargets.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => handleMove(group.id)}
                    className="w-full text-left px-3 py-2 rounded-md transition-colors text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {group.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                      {getBreadcrumb(group.id)}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 px-3 py-2">
                No valid target groups
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
