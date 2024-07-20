// reputationLevels.ts

import { IReputationLevel } from "../user.interface";

export const reputationLevels: IReputationLevel[] = [
  {
    level: 1,
    minReputation: 0,
    maxReputation: 99,
    title: "Street Hustler",
  },
  {
    level: 2,
    minReputation: 100,
    maxReputation: 199,
    title: "Thug",
  },
  {
    level: 3,
    minReputation: 200,
    maxReputation: 299,
    title: "Gang Member",
  },
  {
    level: 4,
    minReputation: 300,
    maxReputation: 399,
    title: "Enforcer",
  },
  {
    level: 5,
    minReputation: 400,
    maxReputation: 499,
    title: "Lieutenant",
  },
  {
    level: 6,
    minReputation: 500,
    maxReputation: 599,
    title: "Underboss",
  },
  {
    level: 7,
    minReputation: 600,
    maxReputation: 699,
    title: "Capo",
  },
  {
    level: 8,
    minReputation: 700,
    maxReputation: 799,
    title: "Consigliere",
  },
  {
    level: 9,
    minReputation: 800,
    maxReputation: 899,
    title: "Boss",
  },
  {
    level: 10,
    minReputation: 900,
    maxReputation: 999,
    title: "Don",
  },
];
