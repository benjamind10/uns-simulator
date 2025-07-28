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

  input PayloadInput {
    quality: String
    value: JSON
    timestamp: Float
  }

  # ROOT OPERATIONS
  type Query {
    simulationProfiles: [SimulationProfile!]!
    simulationProfile(id: ID!): SimulationProfile
    profileNodeBehaviors(profileId: ID!): [NodeBehavior!]!
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
  }

  type Payload {
    quality: String
    value: JSON
    timestamp: Float
  }

  type NodeSettings {
    nodeId: ID!
    frequency: Int
    failRate: Float
    payload: Payload
  }
`;
