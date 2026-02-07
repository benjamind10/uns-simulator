import { useState, useRef, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import {
  ArrowDown,
  X,
  Copy,
  Check,
  ChevronRight,
  Pause,
} from 'lucide-react';

import type { MqttMessage } from '../../types';

/* ── JSON syntax highlighter (no external deps) ── */
function formatJsonPayload(payload: string): { isJson: boolean; formatted: string } {
  try {
    const parsed = JSON.parse(payload);
    return { isJson: true, formatted: JSON.stringify(parsed, null, 2) };
  } catch {
    return { isJson: false, formatted: payload };
  }
}

/* ── HTML entity escape helper ── */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function JsonHighlight({ text }: { text: string }) {
  // Simple syntax coloring for JSON with HTML escaping
  const escaped = escapeHtml(text);
  const highlighted = escaped
    .replace(
      /("(?:[^"\\]|\\.)*")\s*:/g, // keys
      '<span class="text-blue-600 dark:text-blue-400">$1</span>:'
    )
    .replace(
      /:\s*("(?:[^"\\]|\\.)*")/g, // string values
      ': <span class="text-green-600 dark:text-green-400">$1</span>'
    )
    .replace(
      /:\s*(-?\d+\.?\d*(?:[eE][+-]?\d+)?)/g, // numbers
      ': <span class="text-orange-600 dark:text-orange-400">$1</span>'
    )
    .replace(
      /:\s*(true|false)/g, // booleans
      ': <span class="text-purple-600 dark:text-purple-400">$1</span>'
    )
    .replace(
      /:\s*(null)/g, // null
      ': <span class="text-gray-500">$1</span>'
    );

  return (
    <pre
      className="text-xs font-mono whitespace-pre-wrap break-all leading-relaxed"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}

/* ── Topic breadcrumb ── */
function TopicBreadcrumb({ topic }: { topic: string }) {
  const parts = topic.split('/');
  return (
    <span className="inline-flex items-center gap-0.5 flex-wrap">
      {parts.map((part, i) => (
        <span key={i} className="inline-flex items-center gap-0.5">
          {i > 0 && <ChevronRight className="w-2.5 h-2.5 text-gray-400" />}
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-mono">
            {part}
          </span>
        </span>
      ))}
    </span>
  );
}

/* ── Message card ── */
const MessageCard: FC<{
  msg: MqttMessage;
  expanded: boolean;
  onToggle: () => void;
}> = ({ msg, expanded, onToggle }) => {
  const [copied, setCopied] = useState(false);
  const { isJson, formatted } = formatJsonPayload(msg.payload);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className={`
        group rounded-lg border transition-colors cursor-pointer
        ${expanded
          ? 'border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/10'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }
      `}
      onClick={onToggle}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono whitespace-nowrap flex-shrink-0">
            {msg.timestamp}
          </span>
          <TopicBreadcrumb topic={msg.topic} />
        </div>
        {/* Copy button */}
        <button
          type="button"
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all flex-shrink-0"
          title="Copy payload"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Payload preview (collapsed) */}
      {!expanded && (
        <div className="px-3 pb-2">
          <div className="text-xs font-mono text-gray-600 dark:text-gray-400 truncate">
            {msg.payload.length > 120
              ? msg.payload.substring(0, 120) + '...'
              : msg.payload}
          </div>
        </div>
      )}

      {/* Payload detail (expanded) */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-700 mt-0 pt-2">
          {isJson ? (
            <div className="bg-gray-50 dark:bg-gray-800/80 rounded-md p-3 overflow-auto max-h-64">
              <JsonHighlight text={formatted} />
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800/80 rounded-md p-3 overflow-auto max-h-64">
              <pre className="text-xs font-mono whitespace-pre-wrap break-all text-gray-700 dark:text-gray-300">
                {msg.payload}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Main MqttMessageViewer ── */
interface MqttViewerProps {
  messages: MqttMessage[];
  selectedTopic: string | null;
  onClearFilter: () => void;
  paused: boolean;
}

const MqttMessageViewer: FC<MqttViewerProps> = ({
  messages,
  selectedTopic,
  onClearFilter,
  paused,
}) => {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Track scroll position to show/hide "scroll to top" button
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    setShowScrollBtn(scrollRef.current.scrollTop > 200);
  }, []);

  // Reset expanded when messages change significantly
  useEffect(() => {
    setExpandedIdx(null);
  }, [selectedTopic]);

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Messages
            {messages.length > 0 && (
              <span className="ml-1.5 text-xs font-normal text-gray-400">
                ({messages.length})
              </span>
            )}
          </h3>
          {paused && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
              <Pause className="w-3 h-3" />
              Paused
            </span>
          )}
        </div>

        {/* Active filter chip */}
        {selectedTopic && (
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
            <span className="font-mono truncate max-w-[200px]">
              {selectedTopic}
            </span>
            <button
              type="button"
              onClick={onClearFilter}
              className="p-0.5 hover:text-blue-900 dark:hover:text-blue-100 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Message list */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-auto p-2 space-y-1.5 relative"
      >
        {messages.length > 0 ? (
          messages.map((msg, idx) => (
            <MessageCard
              key={idx}
              msg={msg}
              expanded={expandedIdx === idx}
              onToggle={() =>
                setExpandedIdx((prev) => (prev === idx ? null : idx))
              }
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            {selectedTopic
              ? 'No messages for this topic yet'
              : 'Waiting for messages...'}
          </div>
        )}
      </div>

      {/* Scroll to top FAB */}
      {showScrollBtn && (
        <button
          type="button"
          onClick={scrollToTop}
          className="absolute bottom-4 right-4 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-md hover:shadow-lg transition-shadow text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          title="Scroll to latest"
        >
          <ArrowDown className="w-4 h-4 rotate-180" />
        </button>
      )}
    </div>
  );
};

export default MqttMessageViewer;
