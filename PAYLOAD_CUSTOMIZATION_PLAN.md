# Custom Node Payload Configuration — Implementation Plan

## Overview

Allow users to define and control the exact JSON payload that each node publishes during simulation, instead of relying on hardcoded defaults.

### Current State

- Payload is **hardcoded** in `SimulationEngine.publishNodeData()` — `quality` is always `'good'`, `timestamp` is always `Date.now()`, and `value` is randomly generated
- `NodeSettings.payload` **exists** in the DB/types but is mostly ignored at publish time (quality and timestamp are overwritten; value is used only as a base for random jitter)
- The UI (`SimulatorNodeSettings.tsx`) only exposes **frequency** and **failRate** — no payload editor
- The GraphQL schema has a rich behavior system (static/random/pattern/drift) that is **dead code** — never wired up to the engine or UI
- Value generation (`generateNodeValue`) only handles `Int` (hardcoded range 1-100) and `Float` (hardcoded range 0-1.0); `Bool`/`String` fall through to `0`
- `globalSettings.defaultPayload` exists in Mongoose model but is never used by the engine or exposed in the UI

### Exact JSON Currently Published to MQTT

```json
{
  "timestamp": 1738857600000,
  "quality": "good",
  "value": 42
}
```

- `quality` — always `"good"` (hardcoded in `publishNodeData`)
- `timestamp` — always `Date.now()` (hardcoded in `publishNodeData`)
- `value` — random Int [1-100] or Float [0-1.0] from `generateNodeValue`
- Any extra keys from `nodeSettings.payload` survive the spread but there's no UI to set them

---

## Dependency Graph

```
Task 1 (Types) ──┬──→ Task 2 (Engine)
                  │
                  └──→ Task 3 (UI Component) ──→ Task 4 (Integration)
                                                       │
                       Task 5 (Global Defaults) ◄──────┘
                                                       │
                       Task 6 (Preview/Validation) ◄───┘
```

**Tasks 2 and 3 can run in parallel** after Task 1 is done. Tasks 4, 5, 6 are sequential.

---

## Task 1 — Extend the Payload Type System

### Goal
Expand the `payload` structure on `NodeSettings` to support user-configurable fields across all layers (Mongoose → GraphQL → Client types).

### Files to Modify

| File | What to Change |
|------|---------------|
| `server/src/graphql/models/SimulationProfile.ts` | Update `ISimulationNodeSettings.payload` interface and `SimulationNodeSettingsSchema` Mongoose schema |
| `server/src/graphql/schemas/simulationProfile.schema.ts` | Update `Payload`, `PayloadInput` GraphQL types (currently lines 264-276) |
| `client/src/types/simulationProfile.ts` | Update `NodeSettings.payload` TypeScript interface |
| `client/src/api/simulationProfile.ts` | Update any GraphQL query/mutation fragments that reference payload fields |

### New Payload Shape

```typescript
// On ISimulationNodeSettings.payload and NodeSettings.payload
payload: {
  // Core fields
  quality: string;                // default 'good'; user can set to 'bad', 'uncertain', etc.
  timestampMode: 'auto' | 'fixed'; // 'auto' = Date.now() at publish, 'fixed' = use fixedTimestamp
  fixedTimestamp?: number;        // only used when timestampMode === 'fixed'

  // Value generation
  value: number | string | boolean; // base value or literal
  valueMode: 'static' | 'random' | 'increment'; // how value is generated each tick
  minValue?: number;              // for random mode — lower bound
  maxValue?: number;              // for random mode — upper bound
  step?: number;                  // for increment mode — how much to add each tick
  precision?: number;             // decimal places for Float dataType

  // Custom fields — user-defined extra keys in published JSON
  customFields?: Array<{
    key: string;
    value: string | number | boolean;
    type: 'string' | 'number' | 'boolean';
  }>;
}
```

### Mongoose Schema Updates

In `SimulationNodeSettingsSchema` (currently at ~line 55 in `models/SimulationProfile.ts`), update the `payload` sub-schema:

```javascript
payload: {
  quality: { type: String, default: 'good' },
  timestampMode: { type: String, enum: ['auto', 'fixed'], default: 'auto' },
  fixedTimestamp: { type: Number },
  value: { type: Schema.Types.Mixed, default: 0 },
  valueMode: { type: String, enum: ['static', 'random', 'increment'], default: 'random' },
  minValue: { type: Number },
  maxValue: { type: Number },
  step: { type: Number },
  precision: { type: Number },
  customFields: [{
    key: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
    type: { type: String, enum: ['string', 'number', 'boolean'], required: true },
    _id: false
  }]
}
```

### GraphQL Schema Updates

Replace the current `Payload` / `PayloadInput` types (lines ~264-276 in `simulationProfile.schema.ts`):

```graphql
type PayloadCustomField {
  key: String!
  value: JSON!
  type: String!
}

type Payload {
  quality: String
  timestampMode: String
  fixedTimestamp: Float
  value: JSON
  valueMode: String
  minValue: Float
  maxValue: Float
  step: Float
  precision: Int
  customFields: [PayloadCustomField!]
}

input PayloadCustomFieldInput {
  key: String!
  value: JSON!
  type: String!
}

input PayloadInput {
  quality: String
  timestampMode: String
  fixedTimestamp: Float
  value: JSON
  valueMode: String
  minValue: Float
  maxValue: Float
  step: Float
  precision: Int
  customFields: [PayloadCustomFieldInput!]
}
```

### Validation

- Run `npm test` — all existing tests should pass
- Run `npx tsc --noEmit` in both `client/` and `server/` — no type errors
- Verify the GraphQL schema loads without errors by starting the server

---

## Task 2 — Update SimulationEngine to Respect Payload Config

### Goal
Modify `publishNodeData()` and `generateNodeValue()` to honor the user's payload configuration instead of hardcoding values.

### File to Modify
`server/src/simulation/SimulationEngine.ts`

### Changes to `publishNodeData()` (currently ~line 358)

Current (hardcoded):
```typescript
const payload = {
  ...node.payload,
  timestamp: Date.now(),
  quality: 'good',
  value: this.generateNodeValue(node),
};
```

New (config-driven):
```typescript
const payloadConfig = node.payload || {};

// Build custom fields object
const customFieldsObj: Record<string, any> = {};
if (payloadConfig.customFields?.length) {
  for (const field of payloadConfig.customFields) {
    customFieldsObj[field.key] = field.value;
  }
}

const payload = {
  ...customFieldsObj,
  quality: payloadConfig.quality || 'good',
  timestamp: payloadConfig.timestampMode === 'fixed'
    ? (payloadConfig.fixedTimestamp ?? Date.now())
    : Date.now(),
  value: this.generateNodeValue(node),
};
```

### Rewrite `generateNodeValue()` (currently ~line 398)

The method must support three modes and all dataTypes:

```typescript
private generateNodeValue(node: SimulationNode): any {
  const schemaNode = this.schema.nodes.find((n) => n.id === node.id);
  const dataType = schemaNode?.dataType ?? 'Float';
  const config = node.payload || {};
  const mode = config.valueMode || 'random';

  // --- STATIC MODE ---
  if (mode === 'static') {
    return config.value ?? 0;
  }

  // --- INCREMENT MODE ---
  if (mode === 'increment') {
    const step = config.step ?? 1;
    const current = typeof node.payload?._currentValue === 'number'
      ? node.payload._currentValue
      : (typeof config.value === 'number' ? config.value : 0);
    let next = current + step;
    if (config.maxValue !== undefined && next > config.maxValue) {
      next = typeof config.value === 'number' ? config.value : (config.minValue ?? 0);
    }
    node.payload._currentValue = next; // track state between ticks
    return dataType === 'Int' ? Math.round(next) : this.applyPrecision(next, config.precision);
  }

  // --- RANDOM MODE (default) ---
  if (dataType === 'Bool' || dataType === 'Boolean') {
    return Math.random() > 0.5;
  }
  if (dataType === 'String') {
    return typeof config.value === 'string' ? config.value : '';
  }

  const min = config.minValue ?? (dataType === 'Int' ? 1 : 0);
  const max = config.maxValue ?? (dataType === 'Int' ? 100 : 1.0);
  const raw = Math.random() * (max - min) + min;

  if (dataType === 'Int') {
    return Math.round(raw);
  }
  return this.applyPrecision(raw, config.precision);
}

private applyPrecision(value: number, precision?: number): number {
  if (precision === undefined || precision < 0) return Math.round(value * 100) / 100;
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}
```

### Update `SimulationNode` Interface (currently ~line 17)

```typescript
export interface SimulationNode {
  id: string;
  path: string;
  frequency: number;
  failRate: number;
  payload: Record<string, any> & {
    _currentValue?: number; // internal state for increment mode
  };
  intervalId?: NodeJS.Timeout;
}
```

### Unit Tests to Write

Create or update test file `server/src/simulation/__tests__/SimulationEngine.test.ts`:

| Test Case | What to Assert |
|-----------|---------------|
| `static` mode + Int | Returns exact configured value |
| `static` mode + String | Returns exact string |
| `static` mode + Bool | Returns exact boolean |
| `random` mode + Int + custom range | Value is integer between minValue and maxValue |
| `random` mode + Float + precision | Value has correct decimal places |
| `random` mode + Bool | Returns true or false |
| `increment` mode + step | Value increases by step each call |
| `increment` mode + wrap | Value resets to start when exceeding maxValue |
| Custom quality | Published payload.quality matches config |
| Timestamp auto vs fixed | Correct timestamp behavior |
| Custom fields | Extra keys appear in published JSON |
| Default behavior (no config) | Backwards-compatible with current random generation |

### Validation
- `npm run test:server` — all tests pass
- Start a simulation with default settings — behavior should be identical to before (backwards compatible)

---

## Task 3 — Build the Payload Editor UI Component

### Goal
Create a reusable React component that renders a payload configuration form for a single node.

### File to Create
`client/src/components/simulator/NodePayloadEditor.tsx`

### Component Interface

```typescript
interface NodePayloadEditorProps {
  dataType?: 'Int' | 'Float' | 'Bool' | 'Boolean' | 'String';
  payload: NodeSettings['payload'];
  onChange: (payload: NodeSettings['payload']) => void;
}
```

### UI Layout

```
┌─────────────────────────────────────────┐
│ Payload Configuration                   │
├─────────────────────────────────────────┤
│ Quality:    [good    ▾] (dropdown)      │
│ Timestamp:  (●) Auto  ( ) Fixed [____]  │
├─────────────────────────────────────────┤
│ Value Mode: (●) Random ( ) Static ( ) Increment │
│                                         │
│ [If Random]                             │
│   Min: [____]  Max: [____]              │
│   Precision: [____] (Float only)        │
│                                         │
│ [If Static]                             │
│   Value: [____] (input type based on    │
│           dataType: number/text/toggle)  │
│                                         │
│ [If Increment]                          │
│   Start: [____]  Step: [____]           │
│   Max (wrap): [____]                    │
├─────────────────────────────────────────┤
│ Custom Fields                           │
│ ┌─────────┬──────────┬────────┬───┐     │
│ │ Key     │ Value    │ Type ▾ │ ✕ │     │
│ ├─────────┼──────────┼────────┼───┤     │
│ │ unit    │ celsius  │ string │ ✕ │     │
│ │ source  │ sensor-1 │ string │ ✕ │     │
│ └─────────┴──────────┴────────┴───┘     │
│ [+ Add Field]                           │
├─────────────────────────────────────────┤
│ Preview:                                │
│ { "quality": "good",                    │
│   "timestamp": 1738857600000,           │
│   "value": 42.5,                        │
│   "unit": "celsius",                    │
│   "source": "sensor-1" }               │
└─────────────────────────────────────────┘
```

### Implementation Notes
- Use Tailwind CSS classes consistent with existing components (see `SimulatorNodeSettings.tsx` and `SchemaNodeEditor.tsx` for styling patterns)
- Inputs should use the same `w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400` class pattern
- For Bool dataType in static mode, render a toggle switch instead of a text input
- For String dataType, hide the random/increment modes (only static makes sense)
- The preview section should update live as the user changes fields
- Use `JSON.stringify(previewPayload, null, 2)` with a `<pre>` block for the preview

### Validation
- `npx tsc --noEmit` in `client/` — no type errors
- Component renders correctly in isolation (can test by temporarily mounting it in SimulatorNodeSettings)

---

## Task 4 — Integrate Payload Editor into SimulatorNodeSettings

### Goal
Wire the new `NodePayloadEditor` into the existing per-node settings UI.

### File to Modify
`client/src/components/simulator/SimulatorNodeSettings.tsx`

### Changes

1. **Add expand/collapse state** — Track which nodes have their payload editor expanded:
   ```typescript
   const [expandedPayloads, setExpandedPayloads] = useState<Set<string>>(new Set());
   ```

2. **Add toggle button** below each node's frequency/failRate grid — a "Configure Payload" button that toggles the expanded state:
   ```tsx
   <button onClick={() => togglePayloadExpanded(node.id)}>
     {expandedPayloads.has(node.id) ? 'Hide' : 'Configure'} Payload ▾
   </button>
   ```

3. **Render `NodePayloadEditor`** when expanded:
   ```tsx
   {expandedPayloads.has(node.id) && (
     <NodePayloadEditor
       dataType={node.dataType}
       payload={settings[node.id]?.payload || {}}
       onChange={(newPayload) => handlePayloadChange(node.id, newPayload)}
     />
   )}
   ```

4. **Add `handlePayloadChange`** handler:
   ```typescript
   const handlePayloadChange = (nodeId: string, payload: NodeSettings['payload']) => {
     setSettings((prev) => ({
       ...prev,
       [nodeId]: { ...prev[nodeId], payload },
     }));
   };
   ```

5. **Update `handleClear`** to also reset payload to defaults

6. **Update `createDefaultSettings`** to include the new payload fields:
   ```typescript
   const createDefaultSettings = (nodeId: string): NodeSettings => ({
     nodeId,
     frequency: 0,
     failRate: 0,
     payload: {
       quality: 'good',
       timestampMode: 'auto',
       value: 0,
       valueMode: 'random',
       customFields: [],
     },
   });
   ```

### Validation
- `npm run test:client` — all tests pass
- `npx tsc --noEmit` — no type errors
- Open the Simulator page in browser, select a profile, go to Node Settings tab — each node should show frequency/failRate + a "Configure Payload" toggle that reveals the full editor

---

## Task 5 — Add Global Default Payload Settings

### Goal
Let users set a global default payload template that all nodes inherit unless overridden per-node.

### Files to Modify

| File | What to Change |
|------|---------------|
| `client/src/components/simulator/SimulatorGlobalForm.tsx` | Add a "Default Payload" section using `NodePayloadEditor` |
| `server/src/simulation/SimulationEngine.ts` | Update `initializeNodes()` to merge global defaults |

### SimulatorGlobalForm Changes

Add a collapsible "Default Payload Template" section at the bottom of the form that renders `<NodePayloadEditor>` without a `dataType` prop (since it's a global default, dataType-specific options like Bool toggle shouldn't show).

The saved value goes into `globalSettings.defaultPayload`.

### SimulationEngine Changes

In `initializeNodes()` (~line 49), when building each `SimulationNode`, merge payloads with this priority:

```
per-node nodeSettings.payload  >  globalSettings.defaultPayload  >  hardcoded defaults
```

```typescript
const globalDefaults = this.profile.globalSettings?.defaultPayload || {};
const nodePayloadConfig = nodeSettings?.payload || {};

const node: SimulationNode = {
  // ...
  payload: {
    ...globalDefaults,    // global defaults first
    ...nodePayloadConfig, // per-node overrides win
  },
};
```

### Mongoose Model Note

`globalSettings.defaultPayload` already exists in the Mongoose schema (`models/SimulationProfile.ts` ~line 78) with `quality`, `value`, `timestamp` fields. It needs to be updated to match the new expanded payload shape from Task 1 (add `valueMode`, `minValue`, `maxValue`, `timestampMode`, `customFields`, etc.).

### Validation
- Set global defaults, don't configure any per-node payload → all nodes should publish using the global template
- Set global defaults + override one node → that node uses its own config, others use global
- `npm test` — all tests pass

---

## Task 6 — Add Payload Preview & Validation

### Goal
Quality-of-life features: live preview, input validation, and test publish.

### Files to Create/Modify

| File | What |
|------|------|
| `client/src/components/simulator/PayloadPreview.tsx` | **New** — JSON preview component with syntax highlighting |
| `client/src/components/simulator/NodePayloadEditor.tsx` | Add validation warnings |
| `client/src/components/simulator/SimulatorNodeSettings.tsx` | Add "Send Test Message" button per node |
| `server/src/graphql/schemas/simulationProfile.schema.ts` | Add `testPublishNode` mutation |
| `server/src/graphql/resolvers/simulationProfile.resolver.ts` | Implement `testPublishNode` resolver |

### 6a. PayloadPreview Component

A small component that takes the current payload config + dataType and renders what the published JSON will look like:

```tsx
<PayloadPreview
  payload={settings[node.id]?.payload}
  dataType={node.dataType}
/>
```

- Renders a `<pre>` block with formatted JSON
- Uses Tailwind `bg-gray-50 dark:bg-gray-900 rounded-lg p-3 font-mono text-xs`
- Shows a sample generated value based on the configured mode/range
- Updates live as the user changes settings (already handled if it reads from props)

### 6b. Validation Warnings

Add inline validation to `NodePayloadEditor`:

| Condition | Warning Message |
|-----------|----------------|
| `minValue > maxValue` | "Min value must be less than max value" |
| `precision < 0` | "Precision must be 0 or greater" |
| `step === 0` in increment mode | "Step must be non-zero" |
| Bool node + random mode with min/max | "Min/max not applicable for Boolean — will randomly toggle true/false" |
| String node + random/increment mode | "Only static mode is supported for String nodes" |

Display as small orange/yellow text below the relevant input.

### 6c. Test Publish Button

Add a "Send Test Message" button per node in `SimulatorNodeSettings` that publishes a single payload without starting a full simulation.

**New GraphQL Mutation:**
```graphql
type Mutation {
  testPublishNode(profileId: ID!, nodeId: ID!): TestPublishResult!
}

type TestPublishResult {
  success: Boolean!
  topic: String
  payload: JSON
  error: String
}
```

**Server Resolver:**
- Loads the profile, schema, and broker from DB
- Creates a temporary MQTT connection (or reuses existing)
- Generates one payload using the configured settings for that node
- Publishes to the computed topic
- Returns the published topic + payload for display in the UI
- Disconnects the temporary MQTT connection

**Client Button:**
- Placed next to each node's header in `SimulatorNodeSettings`
- Shows a small "Test" button with a send icon
- On click, calls the mutation and shows a toast with the result
- Requires the broker to be connected (check `brokerStatuses` from Redux)

### Validation
- Preview updates in real-time as user changes config
- Validation warnings appear/disappear correctly
- Test publish sends a single message to the broker and shows confirmation
- `npm test` — all tests pass

---

## Files Touched Per Task — Summary

| Task | Server Files | Client Files |
|------|-------------|--------------|
| **1** | `models/SimulationProfile.ts`, `schemas/simulationProfile.schema.ts` | `types/simulationProfile.ts`, `api/simulationProfile.ts` |
| **2** | `simulation/SimulationEngine.ts`, new test file | — |
| **3** | — | **New:** `components/simulator/NodePayloadEditor.tsx` |
| **4** | — | `components/simulator/SimulatorNodeSettings.tsx` |
| **5** | `simulation/SimulationEngine.ts`, `models/SimulationProfile.ts` | `components/simulator/SimulatorGlobalForm.tsx` |
| **6** | `resolvers/simulationProfile.resolver.ts`, `schemas/simulationProfile.schema.ts` | **New:** `components/simulator/PayloadPreview.tsx`, updates to `NodePayloadEditor.tsx`, `SimulatorNodeSettings.tsx` |

---

## Backwards Compatibility

All changes must be backwards compatible:

- If a node has **no payload config** (old data), the engine should behave exactly as it does today: `quality: 'good'`, `timestamp: Date.now()`, random value in default ranges
- The default `valueMode` is `'random'` so existing profiles get random generation
- The default `timestampMode` is `'auto'` so existing profiles get `Date.now()`
- No database migration needed — new fields are all optional with sensible defaults in the Mongoose schema
