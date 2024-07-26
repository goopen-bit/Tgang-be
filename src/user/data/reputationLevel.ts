import { IReputationLevel } from "../user.interface";

export const reputationLevels: IReputationLevel[] = [
  {
    level: 1,
    minReputation: 0,
    maxReputation: 1000,
    title: "Street Hustler",
  },
  {
    level: 2,
    minReputation: 1001,
    maxReputation: 5000,
    title: "Thug",
  },
  {
    level: 3,
    minReputation: 5001,
    maxReputation: 20000,
    title: "Gang Member",
  },
  {
    level: 4,
    minReputation: 20001,
    maxReputation: 50000,
    title: "Enforcer",
  },
  {
    level: 5,
    minReputation: 50001,
    maxReputation: 1000000,
    title: "Lieutenant",
  },
  {
    level: 6,
    minReputation: 1000001,
    maxReputation: 2000000,
    title: "Underboss",
  },
  {
    level: 7,
    minReputation: 2000001,
    maxReputation: 5000000,
    title: "Capo",
  },
  {
    level: 8,
    minReputation: 5000001,
    maxReputation: 10000000,
    title: "Consigliere",
  },
  {
    level: 9,
    minReputation: 10000001,
    maxReputation: 50000000,
    title: "Boss",
  },
  {
    level: 10,
    minReputation: 50000000,
    maxReputation: Number.MAX_VALUE,
    title: "Don",
  },
];
