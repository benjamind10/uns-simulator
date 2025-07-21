export interface TopicNode {
  topicCount: any;
  messageCount: any;
  name: string;
  children: Record<string, TopicNode>;
  fullPath: string;
}

export function buildTopicTree(topics: string[]): TopicNode {
  const root: TopicNode = { name: '', children: {}, fullPath: '' };
  for (const topic of topics) {
    const parts = topic.split('/');
    let node = root;
    let path = '';
    for (const part of parts) {
      path = path ? `${path}/${part}` : part;
      if (!node.children[part]) {
        node.children[part] = { name: part, children: {}, fullPath: path };
      }
      node = node.children[part];
    }
  }
  return root;
}
