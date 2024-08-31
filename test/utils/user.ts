import { faker } from "@faker-js/faker";
import { AuthTokenData } from "../../src/config/types";

export function mockTokenData(user?: Partial<AuthTokenData>): AuthTokenData {
  return {
    id: faker.number.int(),
    username: faker.internet.userName(),
    isPremium: true,
    ...user,
  };
}
