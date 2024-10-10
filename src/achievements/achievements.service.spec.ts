import { Test, TestingModule } from "@nestjs/testing";
import { AchievementsService } from "./achievements.service";
import { MongooseModule, getModelToken } from "@nestjs/mongoose";
import { User, UserSchema } from "../user/schemas/user.schema";
import { Model } from "mongoose";
import { EAchievement, Achievement } from "../user/data/achievements";
import { addDays, subDays } from "date-fns";
import { appConfigImports } from "../config/app";
import { faker } from "@faker-js/faker";
import { UserService } from "../user/user.service";

const createMockUser = (overrides = {}): Partial<User> => {
  return {
    id: faker.number.int(),
    username: "testuser",
    isPremium: false,
    cashAmount: 1000,
    reputation: 1,
    products: [],
    ...overrides,
  };
};

describe("AchievementsService", () => {
  let service: AchievementsService;
  let userModel: Model<User>;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ...appConfigImports,
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
      ],
      providers: [UserService, AchievementsService],
    }).compile();

    userService = module.get<UserService>(UserService);
    service = module.get<AchievementsService>(AchievementsService);
    userModel = module.get<Model<User>>(getModelToken(User.name));
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("unlockAchievement", () => {
    let user: User;
    let mockAchievements: Achievement[];

    beforeEach(async () => {
      user = await userModel.create(createMockUser());
      mockAchievements = [
        {
          id: EAchievement.OG,
          name: "OG Achievement",
          requirements: "Reached level 4 and invited at least 1 user",
          description: "unlock exclusive rewardr",
          checkRequirement: jest.fn().mockReturnValue(true),
          timeLimit: new Date("2024-10-31T23:59:59Z"),
          image: "mock.png",
        },
      ];
      (service as any)._achievements = mockAchievements;
    });

    afterEach(async () => {
      await userModel.deleteOne({ id: user.id });
      jest.restoreAllMocks();
    });

    it("should unlock OG achievement for a user", async () => {
      const achievementId = EAchievement.OG;
      user.reputation = 20001;
      user.referredUsers = [{ id: 123, username: "referredUser", reward: 100 }];
      await user.save();

      mockAchievements[0].timeLimit = addDays(new Date(), 1);

      const result = await service.unlockAchievement(user.id, achievementId);
      expect(result.achievements[achievementId]).toBe(true);
    });

    it("should not unlock an achievement if requirements are not met", async () => {
      const achievementId = EAchievement.OG;
      mockAchievements[0].checkRequirement = jest.fn().mockReturnValue(false);
      mockAchievements[0].timeLimit = addDays(new Date(), 1);

      await expect(
        service.unlockAchievement(user.id, achievementId),
      ).rejects.toThrow("Requirements not reached");
    });

    it("should not unlock an achievement that is already unlocked", async () => {
      const achievementId = EAchievement.OG;
      user.achievements = { [achievementId]: true };
      await user.save();

      mockAchievements[0].timeLimit = addDays(new Date(), 1);

      const saveSpy = jest.spyOn(userModel.prototype, "save");
      const result = await service.unlockAchievement(user.id, achievementId);

      expect(result.achievements[achievementId]).toBe(true);
      expect(saveSpy).not.toHaveBeenCalled();
    });

    it("should throw an error for non-existent achievement", async () => {
      const nonExistentAchievementId = 999 as EAchievement;
      await expect(
        service.unlockAchievement(user.id, nonExistentAchievementId),
      ).rejects.toThrow("Achievement not found");
    });

    it("should throw an error if the achievement time limit has passed", async () => {
      const achievementId = EAchievement.OG;
      mockAchievements[0].timeLimit = subDays(new Date(), 1);

      await expect(
        service.unlockAchievement(user.id, achievementId),
      ).rejects.toThrow("Achievement time limit has passed");
    });

    it("should unlock achievement if within time limit", async () => {
      const achievementId = EAchievement.OG;
      mockAchievements[0].timeLimit = addDays(new Date(), 1);

      const result = await service.unlockAchievement(user.id, achievementId);
      expect(result.achievements[achievementId]).toBe(true);
    });
  });

  describe("getAllAchievements", () => {
    it("should return all achievements", () => {
      const achievements = service.getAllAchievements();

      expect(Array.isArray(achievements)).toBe(true);
      expect(achievements.length).toBeGreaterThan(0);

      achievements.forEach((achievement) => {
        expect(achievement).toHaveProperty("id");
        expect(achievement).toHaveProperty("name");
        expect(achievement).toHaveProperty("description");
        expect(achievement).not.toHaveProperty("checkRequirement");
      });

      const ogAchievement = achievements.find((a) => a.id === EAchievement.OG);
      expect(ogAchievement).toBeDefined();
      expect(ogAchievement.name).toBe("OG Achievement");
      expect(ogAchievement.description).toBe("Unlock Game Content");
      expect(ogAchievement.requirements).toBe(
        "Reached level 4 and invited at least 1 user",
      );
    });
  });
});
