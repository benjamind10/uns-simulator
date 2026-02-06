import { useState, useRef, useEffect, useMemo } from 'react';
import type { FC } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  FileText,
  ChevronsUpDown,
  ChevronsDownUp,
  Search,
} from 'lucide-react';

import type { TopicNode } from '../../utils/mqttTopicTree';
import type { MqttMessage } from '../../types';

/* ── Helper: collect all fullPath values in the tree ── */
function getAllFullPaths(node: TopicNode): string[] {
  let paths = [node.fullPath];
  for (const child of Object.values(node.children)) {
    paths = paths.concat(getAllFullPaths(child));
  }
  return paths;
}

/* ── Helper: count messages for a topic subtree ── */
function countMessagesForNode(
  node: TopicNode,
  messageCounts: Map<string, number>
): number {
  let count = messageCounts.get(node.fullPath) ?? 0;
  for (const child of Object.values(node.children)) {
    count += countMessagesForNode(child, messageCounts);
  }
  return count;
}

/* ── Helper: check if a node or its descendants match a filter ── */
function matchesFilter(node: TopicNode, filter: string): boolean {
  if (node.name.toLowerCase().includes(filter)) return true;
  if (node.fullPath.toLowerCase().includes(filter)) return true;
  return Object.values(node.children).some((child) =>
    matchesFilter(child, filter)
  );
}

/* ── TreeNode component ── */
const TreeNodeRow: FC<{
  node: TopicNode;
  expanded: Set<string>;
  toggle: (id: string) => void;
  selectedTopic: string | null;
  onSelectTopic: (topic: string) => void;
  level: number;
  messageCounts: Map<string, number>;
  filter: string;
}> = ({
  node,
  expanded,
  toggle,
  selectedTopic,
  onSelectTopic,
  level,
  messageCounts,
  filter,
}) => {
  const hasChildren = Object.keys(node.children).length > 0;
  const isExpanded = expanded.has(node.fullPath);
  const isSelected = selectedTopic === node.fullPath;
  const msgCount = countMessagesForNode(node, messageCounts);

  // Filter: hide nodes that don't match when filter is active
  if (filter && !matchesFilter(node, filter)) return null;

  return (
    <div>
      {/* Node row */}
      <div
        className={`
          group flex items-center gap-1.5 py-1 px-2 rounded-md cursor-pointer
          transition-colors duration-100
          ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-400/50' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}
        `}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={() => onSelectTopic(node.fullPath)}
      >
        {/* Expand/collapse chevron */}
        {hasChildren ? (
          <button
            type="button"
            className="flex-shrink-0 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              toggle(node.fullPath);
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
        {hasChildren ? (
          isExpanded ? (
            <FolderOpen className="w-4 h-4 text-amber-500 flex-shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-amber-500 flex-shrink-0" />
          )
        ) : (
          <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
        )}

        {/* Name */}
        <span
          className={`text-sm truncate flex-1 min-w-0 ${
            isSelected
              ? 'font-semibold text-blue-700 dark:text-blue-300'
              : 'font-medium'
          }`}
        >
          {node.name}
        </span>

        {/* Message count badge */}
        {msgCount > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-mono flex-shrink-0">
            {msgCount}
          </span>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="relative">
          {/* Indentation guide line */}
          <div
            className="absolute top-0 bottom-0 border-l border-gray-200 dark:border-gray-700"
            style={{ left: `${level * 20 + 20}px` }}
          />
          {Object.values(node.children)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((child) => (
              <TreeNodeRow
                key={child.fullPath}
                node={child}
                expanded={expanded}
                toggle={toggle}
                selectedTopic={selectedTopic}
                onSelectTopic={onSelectTopic}
                level={level + 1}
                messageCounts={messageCounts}
                filter={filter}
              />
            ))}
        </div>
      )}
    </div>
  );
};

/* ── Main MqttTopicTree component ── */
interface MqttTopicTreeProps {
  root: TopicNode;
  messages: MqttMessage[];
  selectedTopic: string | null;
  onSelectTopic: (topic: string) => void;
}

const MqttTopicTree: FC<MqttTopicTreeProps> = ({
  root,
  messages,
  selectedTopic,
  onSelectTopic,
}) => {
  const expandedRef = useRef<Set<string>>(new Set());
  const [, forceUpdate] = useState(0);
  const [filter, setFilter] = useState('');
  const prevPathsRef = useRef<Set<string>>(new Set());

  // Build message count map
  const messageCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const msg of messages) {
      counts.set(msg.topic, (counts.get(msg.topic) ?? 0) + 1);
    }
    return counts;
  }, [messages]);

  // Auto-expand new topics as they arrive
  useEffect(() => {
    const currentPaths = new Set(getAllFullPaths(root));
    for (const path of currentPaths) {
      if (!prevPathsRef.current.has(path)) {
        expandedRef.current.add(path);
      }
    }
    prevPathsRef.current = currentPaths;
    forceUpdate((n) => n + 1);
  }, [root]);

  const toggle = (id: string) => {
    const next = new Set(expandedRef.current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    expandedRef.current = next;
    forceUpdate((n) => n + 1);
  };

  const expandAll = () => {
    expandedRef.current = new Set(getAllFullPaths(root));
    forceUpdate((n) => n + 1);
  };

  const collapseAll = () => {
    expandedRef.current = new Set();
    forceUpdate((n) => n + 1);
  };

  const hasTopics = Object.keys(root.children).length > 0;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Tree header */}
      <div className="px-3 py-2.5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Topic Tree
          </h3>
          {hasTopics && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={expandAll}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
                title="Expand all"
              >
                <ChevronsUpDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
                title="Collapse all"
              >
                <ChevronsDownUp className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
        {/* Search/filter */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Filter topics..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      {/* Tree body */}
      <div className="flex-1 min-h-0 overflow-auto p-2">
        {hasTopics ? (
          Object.values(root.children)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((child) => (
              <TreeNodeRow
                key={child.fullPath}
                node={child}
                expanded={expandedRef.current}
                toggle={toggle}
                selectedTopic={selectedTopic}
                onSelectTopic={onSelectTopic}
                level={0}
                messageCounts={messageCounts}
                filter={filter.toLowerCase().trim()}
              />
            ))
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Waiting for messages...
          </div>
        )}
      </div>
    </div>
  );
};

export default MqttTopicTree;
