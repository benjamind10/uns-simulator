import { useState, useRef, useEffect } from 'react';
import {
  Folder,
  FolderOpen,
  Activity,
  ChevronRight,
  ChevronDown,
  GripVertical,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { useDraggable, useDroppable } from '@dnd-kit/core';

import type { ISchemaNode } from '../../types';

export interface TreeNodeData extends ISchemaNode {
  children: TreeNodeData[];
}

interface TreeNodeProps {
  node: TreeNodeData;
  depth?: number;
  selectedId: string | null;
  expandedIds: Set<string>;
  onSelect: (node: ISchemaNode) => void;
  onDelete: (nodeId: string) => void;
  onToggleExpand: (nodeId: string) => void;
  onRename: (nodeId: string, newName: string) => void;
  dragOverId?: string | null;
  onContextMenu?: (node: ISchemaNode) => void;
}

export default function TreeNode({
  node,
  depth = 0,
  selectedId,
  expandedIds,
  onSelect,
  onDelete,
  onToggleExpand,
  onRename,
  dragOverId,
  onContextMenu,
}: TreeNodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;
  const isGroup = node.kind === 'group';
  const hasChildren = node.children.length > 0;
  const isDragOver = dragOverId === node.id;

  // Draggable — every node can be dragged
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: node.id,
    data: { node },
  });

  // Droppable — only groups accept drops
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: node.id,
    data: { node },
    disabled: !isGroup,
  });

  // Combine refs: outer div is both drag source and drop target
  const setNodeRef = (el: HTMLDivElement | null) => {
    setDragRef(el);
    if (isGroup) {
      setDropRef(el);
    }
  };

  const showDropHighlight = isGroup && (isDragOver || isOver);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(node.name);
    setIsEditing(true);
  };

  const handleEditConfirm = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== node.name) {
      onRename(node.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditValue(node.name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleEditConfirm();
    if (e.key === 'Escape') handleEditCancel();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu?.(node);
  };

  return (
    <div style={{ opacity: isDragging ? 0.4 : 1, transition: 'opacity 0.2s' }}>
      {/* Node row */}
      <div
        ref={setNodeRef}
        className={`
          group flex items-center gap-1.5 py-2 px-2 rounded-md cursor-pointer
          transition-all duration-200
          ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-400' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}
          ${showDropHighlight ? 'ring-4 ring-green-500 bg-green-50 dark:bg-green-900/30 scale-[1.03] shadow-md' : ''}
          ${isGroup && !isDragging ? 'border border-dashed border-transparent hover:border-gray-300 dark:hover:border-gray-600' : ''}
        `}
        style={{ paddingLeft: `${Math.min(depth * 20 + 8, 120)}px` }}
        onClick={() => onSelect(node)}
        onContextMenu={handleContextMenu}
      >
        {/* Drag handle */}
        <button
          type="button"
          className="opacity-30 group-hover:opacity-70 hover:!opacity-100 cursor-grab active:cursor-grabbing transition-opacity flex-shrink-0 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          aria-label="Drag to move node"
          style={{ touchAction: 'none' }}
        >
          <GripVertical className="w-4 h-4 text-gray-500 pointer-events-none" />
        </button>

        {/* Expand/collapse chevron */}
        {isGroup ? (
          <button
            type="button"
            className="flex-shrink-0 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(node.id);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}

        {/* Icon */}
        {isGroup ? (
          isExpanded && hasChildren ? (
            <FolderOpen className="w-4 h-4 text-amber-500 flex-shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-amber-500 flex-shrink-0" />
          )
        ) : (
          <Activity className="w-4 h-4 text-blue-500 flex-shrink-0" />
        )}

        {/* Name (or inline edit input) */}
        {isEditing ? (
          <div
            className="flex items-center gap-1 flex-1 min-w-0"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleEditConfirm}
              className="flex-1 min-w-0 px-1.5 py-0.5 text-sm border rounded bg-white dark:bg-gray-900 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <button
              type="button"
              onClick={handleEditConfirm}
              className="p-0.5 text-green-600 hover:text-green-700"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleEditCancel();
              }}
              className="p-0.5 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <span
            className="text-sm font-medium truncate flex-1 min-w-0"
            onDoubleClick={handleDoubleClick}
          >
            {node.name}
          </span>
        )}

        {/* Badges */}
        {!isEditing && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {node.kind === 'metric' && node.dataType && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-mono">
                {node.dataType}
              </span>
            )}
            {node.isTemporary && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-medium">
                new
              </span>
            )}
            {/* Delete button (hover-visible) */}
            <button
              type="button"
              className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(node.id);
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      {isGroup && isExpanded && hasChildren && (
        <div className="relative">
          {/* Indentation guide line */}
          <div
            className="absolute top-0 bottom-0 border-l border-gray-200 dark:border-gray-700"
            style={{ left: `${depth * 20 + 20}px` }}
          />
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onSelect={onSelect}
              onDelete={onDelete}
              onToggleExpand={onToggleExpand}
              onRename={onRename}
              dragOverId={dragOverId}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
}
