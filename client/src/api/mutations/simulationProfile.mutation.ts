import { gql } from 'graphql-request';

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
      }
      defaultScenario
      userId
      createdAt
      updatedAt
    }
  }
`;

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
      }
      defaultScenario
      userId
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_SIMULATION_PROFILE = gql`
  mutation DeleteSimulationProfile($id: ID!) {
    deleteSimulationProfile(id: $id)
  }
`;
