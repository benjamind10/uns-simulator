import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Server,
  Book,
  Activity,
  Zap,
  PenTool,
  Plug,
  ChevronRight,
  Plus,
} from 'lucide-react';

import { Card, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { fetchBrokersAsync } from '../../store/brokers';
import { fetchSchemasAsync } from '../../store/schema/schemaThunk';
import { fetchSimulationProfilesAsync } from '../../store/simulationProfile/simulationProfieThunk';
import { selectProfiles } from '../../store/simulationProfile/simulationProfileSlice';
import {
  selectConnectedBrokersCount,
  selectBrokerStatuses,
} from '../../store/mqtt/mqttSlice';
import type { AppDispatch, RootState, ISimulationProfile } from '../../types';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getSimulationBadge(state: string | undefined) {
  switch (state) {
    case 'running':
      return (
        <Badge variant="success" pulse>
          Running
        </Badge>
      );
    case 'starting':
      return (
        <Badge variant="success" pulse>
          Starting
        </Badge>
      );
    case 'paused':
    case 'pausing':
      return <Badge variant="warning">Paused</Badge>;
    case 'stopping':
      return <Badge variant="warning">Stopping</Badge>;
    case 'error':
      return <Badge variant="error">Error</Badge>;
    case 'stopped':
    case 'idle':
    default:
      return <Badge variant="neutral">Idle</Badge>;
  }
}

function formatRelativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;

  if (isNaN(then)) return '';

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function getBrokerStatusLabel(
  status: string
): 'Connected' | 'Connecting' | 'Error' | 'Disconnected' {
  switch (status) {
    case 'connected':
      return 'Connected';
    case 'connecting':
      return 'Connecting';
    case 'error':
      return 'Error';
    default:
      return 'Disconnected';
  }
}

function getBrokerStatusVariant(
  status: string
): 'success' | 'warning' | 'error' | 'neutral' {
  switch (status) {
    case 'connected':
      return 'success';
    case 'connecting':
      return 'warning';
    case 'error':
      return 'error';
    default:
      return 'neutral';
  }
}

export default function HomePage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { brokers } = useSelector((state: RootState) => state.brokers);
  const { schemas } = useSelector((state: RootState) => state.schema);
  const simulators = Object.values(
    useSelector(selectProfiles)
  ) as ISimulationProfile[];
  const connectedBrokers = useSelector(selectConnectedBrokersCount);
  const brokerStatuses = useSelector(selectBrokerStatuses);
  const simulationStates = useSelector(
    (state: RootState) => state.simulationProfile.simulationStates
  );
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    dispatch(fetchBrokersAsync());
    dispatch(fetchSchemasAsync());
    dispatch(fetchSimulationProfilesAsync());
  }, [dispatch]);

  const totalNodes = useMemo(
    () => schemas.reduce((sum, s) => sum + (s.nodes?.length ?? 0), 0),
    [schemas]
  );

  const runningCount = useMemo(
    () =>
      simulators.filter((p) => {
        const state = simulationStates[p.id] ?? p.status?.state;
        return state === 'running' || state === 'starting';
      }).length,
    [simulators, simulationStates]
  );

  const recentProfiles = useMemo(
    () =>
      [...simulators]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .slice(0, 5),
    [simulators]
  );

  const greeting = getGreeting();
  const displayName = user?.username ?? 'there';

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title={`${greeting}, ${displayName}!`}
          description="Here's your workspace at a glance"
        />

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card hoverable onClick={() => navigate('/app/brokers')}>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10">
                  <Server className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Brokers
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {brokers.length}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {connectedBrokers} online
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card hoverable onClick={() => navigate('/app/schemas')}>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-500/10">
                  <Book className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Schemas
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {schemas.length}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {totalNodes} nodes
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card hoverable onClick={() => navigate('/app/simulator')}>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-500/10">
                  <PenTool className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Profiles
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {simulators.length}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
                  <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Running
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {runningCount}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardBody>
            <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
              Quick Actions
            </h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/app/simulator')}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              >
                <Plus className="h-4 w-4" />
                New Simulation
              </button>
              <button
                onClick={() => navigate('/app/schemas')}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:focus:ring-offset-gray-900"
              >
                <Plus className="h-4 w-4" />
                New Schema
              </button>
              <button
                onClick={() => navigate('/app/brokers')}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:focus:ring-offset-gray-900"
              >
                <Plus className="h-4 w-4" />
                Add Broker
              </button>
            </div>
          </CardBody>
        </Card>

        {/* Recent Profiles */}
        <Card>
          <CardBody className="p-0">
            <div className="px-5 pt-4 pb-2">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                Recent Profiles
              </h2>
            </div>
            {recentProfiles.length === 0 ? (
              <div className="px-5 pb-4 text-sm text-gray-400 dark:text-gray-500">
                No simulation profiles yet. Create one to get started.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {recentProfiles.map((profile) => {
                  const state =
                    simulationStates[profile.id] ?? profile.status?.state;
                  return (
                    <li key={profile.id}>
                      <button
                        onClick={() =>
                          navigate(`/app/simulator/${profile.id}`)
                        }
                        className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Zap className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
                          <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
                            {profile.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          {getSimulationBadge(state)}
                          <span className="text-xs text-gray-400 dark:text-gray-500 w-20 text-right">
                            {formatRelativeTime(profile.updatedAt)}
                          </span>
                          <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Broker Health */}
        <Card>
          <CardBody className="p-0">
            <div className="px-5 pt-4 pb-2">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                Broker Health
              </h2>
            </div>
            {brokers.length === 0 ? (
              <div className="px-5 pb-4 text-sm text-gray-400 dark:text-gray-500">
                No brokers configured. Add a broker to monitor its health.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {brokers.map((broker) => {
                  const status = brokerStatuses[broker.id] ?? 'disconnected';
                  return (
                    <li key={broker.id}>
                      <div className="flex items-center justify-between px-5 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Plug className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
                          <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
                            {broker.name}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {broker.url}:{broker.port}
                          </span>
                        </div>
                        <Badge variant={getBrokerStatusVariant(status)}>
                          {getBrokerStatusLabel(status)}
                        </Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
