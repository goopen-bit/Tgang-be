import { User } from "../schemas/user.schema";
import { reputationLevels } from "./reputationLevel";

export enum EAchievement {
  OG,
}

export interface Achievement {
  id: EAchievement;
  name: string;
  description: string;
  requirements: string;
  image: string;
  checkRequirement: (user: User) => boolean;
  timeLimit?: Date;
}

export const achievements: Achievement[] = [
  {
    id: EAchievement.OG,
    name: "OG Achievement",
    description: "Unlock Game Content",
    requirements: "Reached level 4 and invited at least 1 user",
    image: "/assets/social/achievement_og.png",
    checkRequirement: (user) => {
      const userLevel = reputationLevels.find(
        (level) =>
          user.reputation >= level.minReputation &&
          user.reputation <= level.maxReputation,
      );
      return userLevel.level >= 4 && user.referredUsers.length >= 1;
    },
    timeLimit: new Date("2024-10-19T23:59:59Z"),
  },
];

export type AchievementResponse = Omit<Achievement, "checkRequirement">;
