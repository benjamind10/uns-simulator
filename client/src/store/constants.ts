// Action type constants for simulation profile thunks
export const SIMULATION_PROFILE_ACTIONS = {
  FETCH_ALL: 'simulationProfile/fetchAll',
  FETCH_ONE: 'simulationProfile/fetchOne',
  CREATE: 'simulationProfile/create',
  UPDATE: 'simulationProfile/update',
  DELETE: 'simulationProfile/delete',
  UPSERT_NODE_SETTINGS: 'simulationProfile/upsertNodeSettings',
  DELETE_NODE_SETTINGS: 'simulationProfile/deleteNodeSettings',
} as const;

// Action type constants for schema thunks
export const SCHEMA_ACTIONS = {
  FETCH_ALL: 'schema/fetchAll',
  CREATE: 'schema/create',
  UPDATE: 'schema/update',
  DELETE: 'schema/delete',
  SAVE_NODES: 'schema/saveNodes',
  FETCH_NODES: 'schema/fetchNodes',
} as const;

// Action type constants for MQTT thunks
export const MQTT_ACTIONS = {
  CONNECT_TO_BROKER: 'mqtt/connectToBroker',
  DISCONNECT_FROM_BROKER: 'mqtt/disconnectFromBroker',
  CONNECT_TO_MULTIPLE_BROKERS: 'mqtt/connectToMultipleBrokers',
} as const;

// Action type constants for broker thunks
export const BROKER_ACTIONS = {
  FETCH_ALL: 'brokers/fetchBrokers',
  CREATE: 'brokers/createBroker',
  UPDATE: 'brokers/updateBroker',
  DELETE: 'brokers/deleteBroker',
} as const;

// Action type constants for auth thunks
export const AUTH_ACTIONS = {
  LOGIN: 'auth/login',
  LOGOUT: 'auth/logout',
} as const;

// Error messages
export const SIMULATION_PROFILE_ERRORS = {
  FETCH_ALL_FAILED: 'Failed to fetch simulation profiles',
  FETCH_ONE_FAILED: 'Failed to fetch simulation profile',
  CREATE_FAILED: 'Failed to create simulation profile',
  UPDATE_FAILED: 'Failed to update simulation profile',
  DELETE_FAILED: 'Failed to delete simulation profile',
  UPSERT_NODE_SETTINGS_FAILED: 'Failed to upsert node settings',
  DELETE_NODE_SETTINGS_FAILED: 'Failed to delete node settings',
} as const;

export const SCHEMA_ERRORS = {
  FETCH_ALL_FAILED: 'Failed to fetch schemas',
  CREATE_FAILED: 'Failed to create schema',
  UPDATE_FAILED: 'Failed to update schema',
  DELETE_FAILED: 'Failed to delete schema',
  SAVE_NODES_FAILED: 'Failed to save nodes',
  FETCH_NODES_FAILED: 'Failed to fetch nodes',
} as const;

export const MQTT_ERRORS = {
  CONNECTION_FAILED: 'Failed to connect to broker',
  DISCONNECTION_FAILED: 'Failed to disconnect from broker',
  MULTIPLE_CONNECTION_FAILED: 'Failed to connect to multiple brokers',
} as const;

export const BROKER_ERRORS = {
  FETCH_ALL_FAILED: 'Failed to fetch brokers',
  CREATE_FAILED: 'Failed to create broker',
  UPDATE_FAILED: 'Failed to update broker',
  DELETE_FAILED: 'Failed to delete broker',
} as const;

export const AUTH_ERRORS = {
  LOGIN_FAILED: 'Failed to login',
  LOGOUT_FAILED: 'Failed to logout',
} as const;

// Loading states
export const LOADING_STATES = {
  IDLE: 'idle',
  PENDING: 'pending',
  FULFILLED: 'fulfilled',
  REJECTED: 'rejected',
} as const;
