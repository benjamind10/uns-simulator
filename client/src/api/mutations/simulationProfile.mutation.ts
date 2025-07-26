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
          value
          timestamp
        }
      }
      defaultScenario
      userId
      createdAt
      updatedAt
    }
  }
`;

// Update a simulation profile
export const UPDATE_SIMULATION_PROFILE = gql`
  mutation UpdateSimulationProfile($id: ID!, $input: SimulationProfileInput!) {
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
          value
          timestamp
        }
      }
      defaultScenario
      userId
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
      frequency
      failRate
      payload {
        quality
        value
        timestamp
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
          value
          timestamp
        }
      }
      defaultScenario
      userId
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
          value
          timestamp
        }
      }
      defaultScenario
      userId
      createdAt
      updatedAt
    }
  }
`;
