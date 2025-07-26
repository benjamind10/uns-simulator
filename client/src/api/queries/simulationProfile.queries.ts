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
