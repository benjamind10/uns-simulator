import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Terminal,
} from 'lucide-react';

import type { AppDispatch, RootState, SimulationLogEntry } from '../../types';
import { clearSimulationLogs } from '../../store/simulationProfile/simulationProfileSlice';
import { fetchSimulationLogsAsync } from '../../store/simulationProfile/simulationProfieThunk';
import { selectSystemMqttConnected } from '../../store/mqtt/systemMqttSlice';

type LogFilter = 'all' | 'info' | 'warn' | 'error';

const LEVEL_STYLES: Record<
  string,
  { badge: string; text: string }
> = {
  info: {
    badge:
      'bg-blue-500/20 text-blue-400 border-blue-500/30',
    text: 'text-gray-300',
  },
  warn: {
    badge:
      'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    text: 'text-yellow-200',
  },
  error: {
    badge:
      'bg-red-500/20 text-red-400 border-red-500/30',
    text: 'text-red-300',
  },
};

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour12: false }) +
    '.' +
    String(d.getMilliseconds()).padStart(3, '0');
}

const SimulationConsole: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { profileId } = useParams<{ profileId: string }>();

  const logs = useSelector(
    (state: RootState) =>
      profileId
        ? state.simulationProfile.simulationLogs[profileId] || []
        : []
  );
  const currentState = useSelector((state: RootState) =>
    profileId
      ? state.simulationProfile.simulationStates[profileId] || 'idle'
      : 'idle'
  );
  const systemMqttConnected = useSelector(selectSystemMqttConnected);

  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<LogFilter>('all');
  const [autoScroll, setAutoScroll] = useState(false); // Start with false so it stays on top

  const scrollRef = useRef<HTMLDivElement>(null);
  const prevLogCountRef = useRef(0);

  const filteredLogs = (
    filter === 'all'
      ? logs
      : logs.filter((l: SimulationLogEntry) => l.level === filter)
  ).slice().reverse(); // Show newest logs on top (slice creates a copy first)

  // Auto-scroll when new logs arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current && logs.length > prevLogCountRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    prevLogCountRef.current = logs.length;
  }, [logs.length, autoScroll]);

  // Detect manual scroll to disable auto-scroll
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 40;
    setAutoScroll(atBottom);
  }, []);

  // Poll logs via GraphQL when MQTT is disconnected
  useEffect(() => {
    if (!profileId || !expanded) return;

    const isActive =
      currentState === 'running' ||
      currentState === 'starting' ||
      currentState === 'paused' ||
      currentState === 'stopping';

    if (!isActive) return;

    // Always poll for logs (fallback mechanism and robustness against MQTT issues)
    // MQTT provides real-time updates via systemMqttThunk, but polling ensures we get logs even if MQTT fails
    const lastTs = logs.length > 0 ? logs[logs.length - 1].timestamp : undefined;
    dispatch(
      fetchSimulationLogsAsync({
        profileId,
        since: lastTs,
      })
    );

    const interval = setInterval(() => {
      const currentLogs =
        logs.length > 0 ? logs[logs.length - 1].timestamp : undefined;
      dispatch(
        fetchSimulationLogsAsync({
          profileId,
          since: currentLogs,
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [dispatch, profileId, expanded, currentState]);
  // Note: intentionally excluding `logs` and `systemMqttConnected` from deps to avoid re-triggering excessively

  const handleClear = () => {
    if (profileId) {
      dispatch(clearSimulationLogs(profileId));
    }
  };

  const logCounts = {
    all: logs.length,
    info: logs.filter((l: SimulationLogEntry) => l.level === 'info').length,
    warn: logs.filter((l: SimulationLogEntry) => l.level === 'warn').length,
    error: logs.filter((l: SimulationLogEntry) => l.level === 'error').length,
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700 flex-shrink-0 overflow-hidden transition-all duration-200">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 sm:px-4 py-2 hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-semibold text-gray-300">
            Console
          </span>
          {logs.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-700 text-gray-400 font-mono">
              {logs.length}
            </span>
          )}
          {logCounts.error > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-mono">
              {logCounts.error} err
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {expanded && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded ${
                systemMqttConnected
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}
            >
              {systemMqttConnected ? 'Live' : 'Polling'}
            </span>
          )}
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <>
          {/* Toolbar */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 border-t border-gray-700/50 bg-gray-800/30">
            <div className="flex items-center gap-1">
              {(['all', 'info', 'warn', 'error'] as LogFilter[]).map(
                (f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
                      filter === f
                        ? f === 'error'
                          ? 'bg-red-500/20 text-red-400'
                          : f === 'warn'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : f === 'info'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-gray-600 text-gray-200'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-gray-700/50'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                    {logCounts[f] > 0 && (
                      <span className="ml-1 opacity-70">
                        {logCounts[f]}
                      </span>
                    )}
                  </button>
                )
              )}
            </div>
            <button
              onClick={handleClear}
              className="p-1 text-gray-500 hover:text-gray-300 hover:bg-gray-700/50 rounded transition-colors"
              title="Clear logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Log entries */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="max-h-[200px] overflow-auto font-mono text-[11px] leading-5 border-t border-gray-700/50"
          >
            {filteredLogs.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-600 text-xs">
                {logs.length === 0
                  ? 'No logs yet. Start a simulation to see output.'
                  : `No ${filter} logs.`}
              </div>
            ) : (
              filteredLogs.map(
                (log: SimulationLogEntry, i: number) => {
                  const style =
                    LEVEL_STYLES[log.level] || LEVEL_STYLES.info;
                  return (
                    <div
                      key={`${log.timestamp}-${i}`}
                      className="flex items-start gap-2 px-3 sm:px-4 py-0.5 hover:bg-gray-800/40 border-b border-gray-800/30"
                    >
                      <span className="text-gray-600 flex-shrink-0 select-none">
                        {formatTimestamp(log.timestamp)}
                      </span>
                      <span
                        className={`px-1 py-0 rounded text-[10px] font-semibold uppercase flex-shrink-0 border ${style.badge}`}
                      >
                        {log.level}
                      </span>
                      <span className={`${style.text} break-all`}>
                        {log.message}
                      </span>
                    </div>
                  );
                }
              )
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SimulationConsole;
