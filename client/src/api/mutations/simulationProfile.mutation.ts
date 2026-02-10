import { gql } from 'graphql-request';

// Create a simulation profile
export const CREATE_SIMULATION_PROFILE = gql`
  mutation CreateSimulationProfile($input: SimulationProfileInput!) {
    createSimulationProfile(input: $input) {
      id
      name
      description
      schemaId
      brokerId
      globalSettings {
        defaultUpdateFrequency
        timeScale
        publishRoot
        startDelay
        simulationLength
        defaultPayload
      }
      nodeSettings {
        nodeId
        frequency
        failRate
        payload {
          quality
          timestampMode
          fixedTimestamp
          value
          valueMode
          minValue
          maxValue
          step
          precision
          customFields {
            key
            value
            type
          }
        }
      }
      defaultScenario
      userId
      status {
        state
        isRunning
        isPaused
        startTime
        lastActivity
        nodeCount
        mqttConnected
        reconnectAttempts
        error
      }
      createdAt
      updatedAt
    }
  }
`;

// Update a simulation profile
export const UPDATE_SIMULATION_PROFILE = gql`
  mutation UpdateSimulationProfile($id: ID!, $input: UpdateSimulationProfileInput!) {
    updateSimulationProfile(id: $id, input: $input) {
      id
      name
      description
      schemaId
      brokerId
      globalSettings {
        defaultUpdateFrequency
        timeScale
        publishRoot
        startDelay
        simulationLength
        defaultPayload
      }
      nodeSettings {
        nodeId
        frequency
        failRate
        payload {
          quality
          timestampMode
          fixedTimestamp
          value
          valueMode
          minValue
          maxValue
          step
          precision
          customFields {
            key
            value
            type
          }
        }
      }
      defaultScenario
      userId
      status {
        state
        isRunning
        isPaused
        startTime
        lastActivity
        nodeCount
        mqttConnected
        reconnectAttempts
        error
      }
      createdAt
      updatedAt
    }
  }
`;

// Delete a simulation profile
export const DELETE_SIMULATION_PROFILE = gql`
  mutation DeleteSimulationProfile($id: ID!) {
    deleteSimulationProfile(id: $id)
  }
`;

// Upsert node settings for a profile
export const UPSERT_NODE_SETTINGS = gql`
  mutation UpsertNodeSettings(
    $profileId: ID!
    $nodeId: ID!
    $settings: NodeSettingsInput!
  ) {
    upsertNodeSettings(
      profileId: $profileId
      nodeId: $nodeId
      settings: $settings
    ) {
      nodeId
      frequency
      failRate
      payload {
        quality
        timestampMode
        fixedTimestamp
        value
        valueMode
        minValue
        maxValue
        step
        precision
        customFields {
          key
          value
          type
        }
      }
    }
  }
`;

// Delete node settings for a profile
export const DELETE_NODE_SETTINGS = gql`
  mutation DeleteNodeSettings($profileId: ID!, $nodeId: ID!) {
    deleteNodeSettings(profileId: $profileId, nodeId: $nodeId)
  }
`;

// Cleanup node settings with default-only payloads
export const CLEANUP_DEFAULT_NODE_SETTINGS = gql`
  mutation CleanupDefaultNodeSettings($profileId: ID!) {
    cleanupDefaultNodeSettings(profileId: $profileId)
  }
`;

// Simulation Control Mutations
export const START_SIMULATION = gql`
  mutation StartSimulation($profileId: ID!) {
    startSimulation(profileId: $profileId)
  }
`;

export const STOP_SIMULATION = gql`
  mutation StopSimulation($profileId: ID!) {
    stopSimulation(profileId: $profileId)
  }
`;

export const PAUSE_SIMULATION = gql`
  mutation PauseSimulation($profileId: ID!) {
    pauseSimulation(profileId: $profileId)
  }
`;

export const RESUME_SIMULATION = gql`
  mutation ResumeSimulation($profileId: ID!) {
    resumeSimulation(profileId: $profileId)
  }
`;

export const TEST_PUBLISH_NODE = gql`
  mutation TestPublishNode($profileId: ID!, $nodeId: ID!) {
    testPublishNode(profileId: $profileId, nodeId: $nodeId) {
      success
      topic
      payload
      error
    }
  }
`;
