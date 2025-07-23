import { useState, useRef } from 'react';
import type { FC } from 'react';
import type { TopicNode } from '../../utils/mqttTopicTree';
import { ChevronDown, ChevronRight } from 'lucide-react'; // Add this icon lib

interface MqttTopicTreeProps {
  root: TopicNode;
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
}> = ({
  node,
  expanded,
  toggle,
  selected,
  select,
  onSelectTopic,
  level = 0,
}) => {
  const hasChildren = Object.keys(node.children).length > 0;
  const isExpanded = expanded.has(node.fullPath);

  return (
    <li>
      <div
        className="flex items-center"
        style={{ paddingLeft: `${level * 20}px`, position: 'relative' }}
      >
        {/* Indentation line */}
        {level > 0 && (
          <span
            className="absolute left-0 top-0 h-full border-l border-gray-400 dark:border-gray-700"
            style={{ left: `${(level - 1) * 20 + 10}px`, width: '1px' }}
          />
        )}
        {/* Expand/Collapse Button */}
        <button
          onClick={() => hasChildren && toggle(node.fullPath)}
          className="w-6 h-6 flex items-center justify-center focus:outline-none"
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
        {/* Node Name */}
        <span
          className={`cursor-pointer rounded px-2 py-1 transition
            ${
              selected === node.fullPath
                ? 'bg-blue-500 text-white font-bold shadow'
                : 'hover:bg-blue-100 dark:hover:bg-blue-900'
            }`}
          onClick={() => {
            select(node.fullPath);
            onSelectTopic?.(node.fullPath);
          }}
        >
          {node.name}
        </span>
        {/* Counts */}
        {typeof node.topicCount === 'number' && (
          <span className="ml-2 text-xs text-blue-400">
            ({node.topicCount} topics
            {typeof node.messageCount === 'number'
              ? `, ${node.messageCount} messages`
              : ''}
            )
          </span>
        )}
      </div>
      {hasChildren && isExpanded && (
        <ul>
          {Object.values(node.children).map((child) => (
            <TreeNode
              key={child.fullPath}
              node={child}
              expanded={expanded}
              toggle={toggle}
              selected={selected}
              select={select}
              onSelectTopic={onSelectTopic}
              level={level + 1}
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

const MqttTopicTree: FC<MqttTopicTreeProps> = ({ root, onSelectTopic }) => {
  // Use a ref to keep the initial expanded state static
  const initialExpanded = useRef<Set<string>>(new Set(getAllFullPaths(root)));
  const [expanded, setExpanded] = useState<Set<string>>(
    initialExpanded.current
  );
  const [selected, setSelected] = useState<string | null>(null);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const select = (id: string) => setSelected(id);

  return (
    <div
      className="bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 p-3 h-full shadow-inner flex flex-col"
      style={{ minHeight: '400px', height: '47vh' }}
    >
      <h3 className="text-lg font-semibold mb-2">Topic Tree</h3>
      <div className="flex-1 min-h-0 pr-1">
        <ul className="h-full max-h-full overflow-y-auto">
          <TreeNode
            node={root}
            expanded={expanded}
            toggle={toggle}
            selected={selected}
            select={select}
            onSelectTopic={onSelectTopic}
          />
        </ul>
      </div>
    </div>
  );
};

export default MqttTopicTree;
