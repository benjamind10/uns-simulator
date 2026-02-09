import { gql } from 'graphql-request';

// Get all simulation profiles
export const GET_SIMULATION_PROFILES = gql`
  query GetSimulationProfiles {
    simulationProfiles {
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

// Get a single simulation profile
export const GET_SIMULATION_PROFILE = gql`
  query GetSimulationProfile($id: ID!) {
    simulationProfile(id: $id) {
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

// Get simulation logs (for polling fallback)
export const GET_SIMULATION_LOGS = gql`
  query GetSimulationLogs($profileId: ID!, $since: Float, $limit: Int) {
    simulationLogs(profileId: $profileId, since: $since, limit: $limit) {
      timestamp
      level
      message
      topic
      nodeId
    }
  }
`;

// Get simulation status only (for polling/syncing)
export const GET_SIMULATION_STATUS = gql`
  query GetSimulationStatus($profileId: ID!) {
    simulationStatus(profileId: $profileId) {
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
  }
`;

// Simulation control mutations
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

// Create simulation profile
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
