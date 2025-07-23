import type { User } from 'lucide-react';
import type { BrokerConnection, IBroker } from './broker';
import type { MqttMessage } from './mqtt';
import type { ISchema, ISchemaNode } from './schema';
import type { AppDispatch } from '../store/store';
import type { RootState } from './store';
import type { ISimulationProfile } from './simulationProfile';

==== BASE ====
export interface ISchemaNode {
  id: string;
  name: string;
  kind: 'group' | 'metric';
  parent: string | null;
  path: string;
  order: number;
  dataType?: 'Int' | 'Float' | 'Bool' | 'String';
  unit?: string;
  engineering?: Record<string, unknown>;
  isTemporary?: boolean;
}

export interface SchemaNode {
  id: string;
  name: string;
  kind: 'group' | 'metric';
  parent: string | null;
  path: string;
  order: number;
  dataType?: 'Int' | 'Float' | 'Bool' | 'String';
  unit?: string;
  engineering?: Record<string, unknown>;
  children?: SchemaNode[];
  isTemporary?: boolean; // Optional, for UI use
}
==== BASE ====
