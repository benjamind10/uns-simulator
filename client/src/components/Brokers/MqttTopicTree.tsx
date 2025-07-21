import type { FC } from 'react';
import type { TopicNode } from '../../utils/mqttTopicTree';

interface MqttTopicTreeProps {
  root: TopicNode;
  onSelectTopic?: (topic: string) => void;
}

const renderTree = (
  node: TopicNode,
  onSelectTopic?: (topic: string) => void
) => (
  <ul>
    {Object.values(node.children).map((child) => (
      <li key={child.fullPath}>
        <span
          className="cursor-pointer hover:underline"
          onClick={() => onSelectTopic?.(child.fullPath)}
        >
          {child.name}
        </span>
        {Object.keys(child.children).length > 0 &&
          renderTree(child, onSelectTopic)}
      </li>
    ))}
  </ul>
);

const MqttTopicTree: FC<MqttTopicTreeProps> = ({ root, onSelectTopic }) => (
  <div>
    <h3 className="text-lg font-semibold mb-2">Topic Tree</h3>
    {renderTree(root, onSelectTopic)}
  </div>
);

export default MqttTopicTree;
