// src/graphql/typeDefs/simulationProfile.schema.ts
import { gql } from 'apollo-server-express';

export const simulationProfileTypeDefs = gql`
  # ENUMS
  enum SimulationMode {
    static
    random
    pattern
    drift
    replay
    formula
  }

  enum PatternType {
    sine
    square
    triangle
    sawtooth
    custom
  }

  enum SimRunStatus {
    scheduled
    running
    paused
    completed
    failed
  }

  enum SimulationState {
    idle
    starting
    running
    paused
    stopping
    stopped
    error
  }

  # BEHAVIOR INTERFACE
  interface NodeBehaviorBase {
    id: ID!
    profileId: ID!
    nodeId: ID!
    enabled: Boolean!
    mode: SimulationMode!
    updateFrequency: Int! # updates/minute (0 = use default)
    failureProbability: Float!
  }

  # BEHAVIOR TYPES
  type StaticBehavior implements NodeBehaviorBase {
    id: ID!
    profileId: ID!
    nodeId: ID!
    enabled: Boolean!
    mode: SimulationMode!
    updateFrequency: Int!
    failureProbability: Float!
    value: JSON!
  }

  type RandomBehavior implements NodeBehaviorBase {
    id: ID!
    profileId: ID!
    nodeId: ID!
    enabled: Boolean!
    mode: SimulationMode!
    updateFrequency: Int!
    failureProbability: Float!
    minValue: Float!
    maxValue: Float!
    distribution: String!
    mean: Float
    stdDev: Float
    seed: Int
  }

  type PatternBehavior implements NodeBehaviorBase {
    id: ID!
    profileId: ID!
    nodeId: ID!
    enabled: Boolean!
    mode: SimulationMode!
    updateFrequency: Int!
    failureProbability: Float!
    patternType: PatternType!
    minValue: Float!
    maxValue: Float!
    period: Int!
    phaseShift: Float
    customPoints: [JSON!]
  }

  # Add more behaviors as needed (Drift, Replay, Formula...)

  # UNION for all behaviors
  union NodeBehavior = StaticBehavior | RandomBehavior | PatternBehavior
  # | DriftBehavior | ReplayBehavior | FormulaBehavior

  # SIMULATION STATUS TYPE
  type SimulationStatus {
    state: SimulationState!
    isRunning: Boolean!
    isPaused: Boolean!
    startTime: String
    lastActivity: String
    nodeCount: Int
    mqttConnected: Boolean
    reconnectAttempts: Int
    error: String
  }

  # MAIN PROFILE
  type SimulationProfile {
    id: ID!
    name: String!
    description: String
    schemaId: ID!
    brokerId: ID
    globalSettings: GlobalSettings!
    defaultScenario: String
    createdAt: String!
    updatedAt: String!
    nodeBehaviors: [NodeBehavior!]!
    nodeSettings: [NodeSettings!]!
    userId: ID!
    status: SimulationStatus!
  }

  type GlobalSettings {
    defaultUpdateFrequency: Int!
    timeScale: Float!
    publishRoot: String
    startDelay: Int
    simulationLength: Int
    defaultPayload: JSON
  }

  # RUN RECORD
  type SimulationRun {
    id: ID!
    profileId: ID!
    status: SimRunStatus!
    startTime: String!
    endTime: String
    activeScenario: String
    progress: Int!
    messages: [RunMessage!]!
    createdAt: String!
    updatedAt: String!
  }

  type RunMessage {
    timestamp: String!
    level: String!
    message: String!
  }

  # INPUTS
  input GlobalSettingsInput {
    defaultUpdateFrequency: Int
    timeScale: Float
    publishRoot: String
    startDelay: Int
    simulationLength: Int
    defaultPayload: JSON
  }

  input SimulationProfileInput {
    name: String!
    description: String
    schemaId: ID!
    brokerId: ID
    globalSettings: GlobalSettingsInput
    defaultScenario: String
  }

  input StaticBehaviorInput {
    nodeId: ID!
    enabled: Boolean = true
    updateFrequency: Int = 0
    failureProbability: Float = 0
    value: JSON!
  }

  input RandomBehaviorInput {
    nodeId: ID!
    enabled: Boolean = true
    updateFrequency: Int = 0
    failureProbability: Float = 0
    minValue: Float!
    maxValue: Float!
    distribution: String!
    mean: Float
    stdDev: Float
    seed: Int
  }

  input PatternBehaviorInput {
    nodeId: ID!
    enabled: Boolean = true
    updateFrequency: Int = 0
    failureProbability: Float = 0
    patternType: PatternType!
    minValue: Float!
    maxValue: Float!
    period: Int!
    phaseShift: Float
    customPoints: [JSON!]
  }

  input UpsertBehaviorsInput {
    profileId: ID!
    staticBehaviors: [StaticBehaviorInput!]
    randomBehaviors: [RandomBehaviorInput!]
    patternBehaviors: [PatternBehaviorInput!]
    # driftBehaviors, replayBehaviors, formulaBehaviors...
  }

  input NodeSettingsInput {
    frequency: Int
    failRate: Float
    payload: PayloadInput
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

  # ROOT OPERATIONS
  type Query {
    simulationProfiles: [SimulationProfile!]!
    simulationProfile(id: ID!): SimulationProfile
    simulationStatus(profileId: ID!): SimulationStatus!
  }

  type Mutation {
    createSimulationProfile(input: SimulationProfileInput!): SimulationProfile!
    updateSimulationProfile(
      id: ID!
      input: SimulationProfileInput!
    ): SimulationProfile!
    deleteSimulationProfile(id: ID!): Boolean!

    upsertNodeBehaviors(input: UpsertBehaviorsInput!): Boolean!
    deleteNodeBehavior(profileId: ID!, nodeId: ID!): Boolean!

    upsertNodeSettings(
      profileId: ID!
      nodeId: ID!
      settings: NodeSettingsInput!
    ): NodeSettings!
    deleteNodeSettings(profileId: ID!, nodeId: ID!): Boolean!

    startSimulation(profileId: ID!): Boolean!
    stopSimulation(profileId: ID!): Boolean!
    pauseSimulation(profileId: ID!): Boolean!
    resumeSimulation(profileId: ID!): Boolean!
    testPublishNode(profileId: ID!, nodeId: ID!): TestPublishResult!
  }

  type TestPublishResult {
    success: Boolean!
    topic: String
    payload: JSON
    error: String
  }

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

  type NodeSettings {
    nodeId: ID!
    frequency: Int
    failRate: Float
    payload: Payload
  }
`;
