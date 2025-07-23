export interface TopicNode {
  node: unknown;
  topicCount: number;
  messageCount: number;
  name: string;
  children: Record<string, TopicNode>;
  fullPath: string;
}

export function buildTopicTree(topics: string[]): TopicNode {
  const root: TopicNode = {
    node: null,
    topicCount: 0,
    messageCount: 0,
    name: '',
    children: {},
    fullPath: '',
  };
  for (const topic of topics) {
    const parts = topic.split('/');
    let node = root;
    let path = '';
    for (const part of parts) {
      path = path ? `${path}/${part}` : part;
      if (!node.children[part]) {
        node.children[part] = {
          node: null,
          topicCount: 0,
          messageCount: 0,
          name: part,
          children: {},
          fullPath: path,
        };
      }
      node = node.children[part];
    }
  }
  return root;
}
