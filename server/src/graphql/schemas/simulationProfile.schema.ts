// src/graphql/typeDefs/simulationProfile.schema.ts
import { gql } from 'apollo-server-express';

export const simulationProfileTypeDefs = gql`
  """
  ------------------------------------------------------------------
   ENUMS
  ------------------------------------------------------------------
  """
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

  """
  ------------------------------------------------------------------
   BEHAVIOUR INTERFACES & IMPLEMENTATIONS
   (Discriminator-style — each mode has its own input)
  ------------------------------------------------------------------
  """
  interface NodeBehaviorBase {
    id: ID! # Mongo _id of behaviour doc
    profileId: ID!
    nodeId: ID!
    enabled: Boolean!
    mode: SimulationMode!
    updateFrequency: Int! # updates / minute (0 ⇒ use default)
    failureProbability: Float!
  }

  type StaticBehavior implements NodeBehaviorBase {
    id: ID!
    profileId: ID!
    nodeId: ID!
    enabled: Boolean!
    mode: SimulationMode!
    updateFrequency: Int!
    failureProbability: Float!
    value: JSON # Mixed scalar
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

  # (Add DriftBehavior, ReplayBehavior, FormulaBehavior types in same style)

  """
  ------------------------------------------------------------------
   UNION to return any behaviour concrete type
  ------------------------------------------------------------------
  """
  union NodeBehavior = StaticBehavior | RandomBehavior | PatternBehavior
  # | DriftBehavior | ReplayBehavior | FormulaBehavior

  """
  ------------------------------------------------------------------
   MAIN PROFILE
  ------------------------------------------------------------------
  """
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
    nodeBehaviors: [NodeBehavior!]! # resolver populates from collection
  }

  type GlobalSettings {
    defaultUpdateFrequency: Int!
    timeScale: Float!
    publishRoot: String
    startDelay: Int
    simulationLength: Int
  }

  """
  ------------------------------------------------------------------
   RUN RECORD
  ------------------------------------------------------------------
  """
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

  """
  ------------------------------------------------------------------
   INPUTS
  ------------------------------------------------------------------
  """
  input GlobalSettingsInput {
    defaultUpdateFrequency: Int
    timeScale: Float
    publishRoot: String
    startDelay: Int
    simulationLength: Int
  }

  input SimulationProfileInput {
    name: String!
    description: String
    schemaId: ID!
    brokerId: ID
    globalSettings: GlobalSettingsInput
    defaultScenario: String
  }

  # For brevity only Static + Random shown – replicate others as needed
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

  input UpsertBehaviorsInput {
    profileId: ID!
    staticBehaviors: [StaticBehaviorInput!]
    randomBehaviors: [RandomBehaviorInput!]
    # patternBehaviors, driftBehaviors, ...
  }

  """
  ------------------------------------------------------------------
   ROOT OPERATIONS
  ------------------------------------------------------------------
  """
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
  }
`;
