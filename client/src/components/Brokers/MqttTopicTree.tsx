import { useState, useRef } from 'react';
import type { FC } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  FileText,
} from 'lucide-react';

import type { TopicNode } from '../../utils/mqttTopicTree';
import type { MqttMessage } from '../../types';

interface MqttTopicTreeProps {
  root: TopicNode;
  messages: MqttMessage[];
  onSelectTopic?: (topic: string) => void;
}

const TreeNode: FC<{
  node: TopicNode;
  expanded: Set<string>;
  toggle: (id: string) => void;
  selected: string | null;
  select: (id: string) => void;
  onSelectTopic?: (topic: string) => void;
  level?: number;
  messages: MqttMessage[];
}> = ({
  node,
  expanded,
  toggle,
  selected,
  select,
  onSelectTopic,
  level = 0,
  messages,
}) => {
  const hasChildren = Object.keys(node.children).length > 0;
  const isExpanded = expanded.has(node.fullPath);

  let prettyValue: string | undefined = undefined;
  if (!hasChildren) {
    const msg = messages.find((m) => m.topic === node.fullPath);
    if (msg) {
      try {
        const parsed = JSON.parse(msg.payload);
        prettyValue = JSON.stringify(parsed, null, 1);
      } catch {
        prettyValue = msg.payload;
      }
    }
  }

  return (
    <li>
      <div
        className={`group flex items-center relative transition-all duration-100 ${
          selected === node.fullPath ? 'bg-blue-100/60 dark:bg-blue-900/30' : ''
        }`}
        style={{
          paddingLeft: `${level * 18}px`,
          minHeight: 24,
          fontSize: 14,
          fontFamily: 'Segoe UI, Arial, sans-serif',
        }}
      >
        {/* Indentation line */}
        {level > 0 && (
          <span
            className="absolute border-l border-gray-300 dark:border-gray-700"
            style={{
              left: `${(level - 1) * 18 + 9}px`,
              top: 0,
              bottom: 0,
              width: '1px',
              height: '100%',
            }}
          />
        )}
        {/* Expand/Collapse Button and Folder/File Icon */}
        <button
          onClick={() => hasChildren && toggle(node.fullPath)}
          className="w-6 h-6 flex items-center justify-center focus:outline-none mr-1"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
          tabIndex={-1}
          style={{ minWidth: 24 }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )
          ) : (
            <span className="inline-block w-4" />
          )}
        </button>
        {hasChildren ? (
          isExpanded ? (
            <FolderOpen size={16} className="text-yellow-500 mr-1" />
          ) : (
            <Folder size={16} className="text-yellow-500 mr-1" />
          )
        ) : (
          <FileText size={15} className="text-gray-400 mr-1" />
        )}
        {/* Node Name */}
        <span
          className={`cursor-pointer px-1 py-0.5 font-normal transition-colors duration-100 ${
            selected === node.fullPath
              ? 'text-blue-700 dark:text-blue-300 font-semibold'
              : 'hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-800 dark:text-gray-100'
          }`}
          style={{
            borderRadius: 2,
            fontSize: 14,
            fontFamily: 'Segoe UI, Arial, sans-serif',
          }}
          onClick={() => {
            select(node.fullPath);
            onSelectTopic?.(node.fullPath);
          }}
        >
          {node.name}
        </span>
        {/* Value for leaf nodes as single-line JSON with horizontal scroll */}
        {prettyValue !== undefined && (
          <span
            className="ml-2 text-xs font-mono text-gray-700 dark:text-gray-200 whitespace-nowrap max-w-[320px] overflow-x-auto block bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-0.5 shadow-sm"
            style={{
              fontSize: 13,
              lineHeight: 1.3,
              marginLeft: 8,
              marginRight: 2,
            }}
          >
            {'= '}
            {typeof prettyValue === 'string'
              ? prettyValue.replace(/\s+/g, ' ')
              : prettyValue}
          </span>
        )}
        {/* Counts */}
        {/* {typeof node.topicCount === 'number' && (
          <span className="ml-2 text-xs text-gray-400">
            ({node.topicCount} topics
            {typeof node.messageCount === 'number'
              ? `, ${node.messageCount} messages`
              : ''}
            )
          </span>
        )} */}
      </div>
      {hasChildren && isExpanded && (
        <ul>
          {Object.values(node.children)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((child) => (
              <TreeNode
                key={child.fullPath}
                node={child}
                expanded={expanded}
                toggle={toggle}
                selected={selected}
                select={select}
                onSelectTopic={onSelectTopic}
                level={level + 1}
                messages={messages}
              />
            ))}
        </ul>
      )}
    </li>
  );
};

// Helper to recursively collect all fullPath values in the tree
function getAllFullPaths(node: TopicNode): string[] {
  let paths = [node.fullPath];
  for (const child of Object.values(node.children)) {
    paths = paths.concat(getAllFullPaths(child));
  }
  return paths;
}

const MqttTopicTree: FC<MqttTopicTreeProps> = ({
  root,
  messages,
  onSelectTopic,
}) => {
  // Memoize expanded and selected state so the tree doesn't reset on parent re-render
  const expandedRef = useRef<Set<string>>(new Set(getAllFullPaths(root)));
  const selectedRef = useRef<string | null>(null);
  const [, forceUpdate] = useState(0); // for rerender on state change

  const toggle = (id: string) => {
    const next = new Set(expandedRef.current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    expandedRef.current = next;
    forceUpdate((n) => n + 1);
  };

  const select = (id: string) => {
    selectedRef.current = id;
    forceUpdate((n) => n + 1);
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 p-2 h-full flex flex-col"
      style={{
        minHeight: '400px',
        height: '47vh',
        minWidth: '420px',
        width: '100%',
      }}
    >
      <h3
        className="text-base font-semibold mb-2 tracking-tight text-gray-700 dark:text-gray-200"
        style={{ fontFamily: 'Segoe UI, Arial, sans-serif' }}
      >
        Topic Tree
      </h3>
      <div className="flex-1 min-h-0 pr-1">
        <ul className="h-full max-h-full overflow-y-auto pr-2">
          <TreeNode
            node={root}
            expanded={expandedRef.current}
            toggle={toggle}
            selected={selectedRef.current}
            select={select}
            onSelectTopic={onSelectTopic}
            messages={messages}
          />
        </ul>
      </div>
    </div>
  );
};

export default MqttTopicTree;
