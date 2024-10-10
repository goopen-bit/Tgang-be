import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { User } from "../user/schemas/user.schema";
import { InjectMixpanel } from "../analytics/injectMixpanel.decorator";
import { Mixpanel } from "mixpanel";
import {
  achievements as importedAchievements,
  EAchievement,
  Achievement,
  AchievementResponse,
} from "../user/data/achievements";
import { UserService } from "../user/user.service";

@Injectable()
export class AchievementsService {
  private _achievements: Achievement[] = importedAchievements;

  constructor(
    private userService: UserService,
    @InjectMixpanel() private readonly mixpanel: Mixpanel,
  ) {}

  get achievements(): Achievement[] {
    return this._achievements;
  }

  getAllAchievements(): AchievementResponse[] {
    return this.achievements.map(
      ({ id, name, description, requirements, image, timeLimit }) => ({
        id,
        name,
        description,
        requirements,
        image,
        timeLimit,
      }),
    );
  }

  async unlockAchievement(
    userId: number,
    achievementId: EAchievement,
  ): Promise<User> {
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const achievement = this.achievements.find((a) => a.id === achievementId);
    if (!achievement) {
      throw new NotFoundException("Achievement not found");
    }

    const now = new Date();
    if (achievement.timeLimit && now > achievement.timeLimit) {
      throw new HttpException(
        "Achievement time limit has passed",
        HttpStatus.BAD_REQUEST,
      );
    }
    console.log(user);
    if (achievement.checkRequirement(user)) {
      if (user.achievements[achievementId]) return user;
      user.achievements[achievementId] = true;
      await user.save();

      this.mixpanel.track("Achievement Unlocked", {
        distinct_id: user.id.toString(),
        achievement: achievement.name,
      });
      return user;
    }
    throw new NotFoundException("Requirements not reached");
  }
}
