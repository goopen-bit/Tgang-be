/**
 * List of Node.js environments.
 */
export enum NodeEnvironments {
  TEST = 'test',
  TEST_E2E = 'test-e2e',
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
}

/**
 * List of MongoDB's collections used in application.
 */
export enum DbCollections {
  USERS = 'users',
  BATTLE_RESULTS = 'battle-results',
}

export interface AuthTokenData {
  id: number;
  username: string;
  isPremium: boolean;
}
