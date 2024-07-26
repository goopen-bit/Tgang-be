// reputationLevels.ts

import { IReputationLevel } from "../user.interface";

export const reputationLevels: IReputationLevel[] = [
  {
    level: 1,
    minReputation: 0,
    maxReputation: 9999,
    title: "Street Hustler",
  },
  {
    level: 2,
    minReputation: 10000,
    maxReputation: 19999,
    title: "Thug",
  },
  {
    level: 3,
    minReputation: 20000,
    maxReputation: 29999,
    title: "Gang Member",
  },
  {
    level: 4,
    minReputation: 30000,
    maxReputation: 39999,
    title: "Enforcer",
  },
  {
    level: 5,
    minReputation: 40000,
    maxReputation: 49999,
    title: "Lieutenant",
  },
  {
    level: 6,
    minReputation: 50000,
    maxReputation: 59999,
    title: "Underboss",
  },
  {
    level: 7,
    minReputation: 60000,
    maxReputation: 69999,
    title: "Capo",
  },
  {
    level: 8,
    minReputation: 70000,
    maxReputation: 79999,
    title: "Consigliere",
  },
  {
    level: 9,
    minReputation: 80000,
    maxReputation: 89999,
    title: "Boss",
  },
  {
    level: 10,
    minReputation: 90000,
    maxReputation: Number.MAX_VALUE,
    title: "Don",
  },
];
