import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { UserService } from "../user/user.service";
import { BuyLabDto } from "./dto/buy-lab.dto";
import { labs } from "./data/labs";
import { EProduct } from "../market/market.const";
import { User } from "../user/schemas/user.schema";
import { Mixpanel } from "mixpanel";
import { InjectMixpanel } from "../analytics/injectMixpanel.decorator";
import { InjectRedis } from "@goopen/nestjs-ioredis-provider";
import Redis from "ioredis";

@Injectable()
export class LabService {
  constructor(
    private userService: UserService,

    @InjectRedis() private readonly redis: Redis,

    @InjectMixpanel() private readonly mixpanel: Mixpanel,
  ) {}

  async buyLabPlot(userId: number) {
    const lockKey = `buyLabPlot:${userId}`;

    const lock = await this.redis.set(lockKey, 'locked', 'EX', 5, 'NX');
    if (!lock) {
      throw new HttpException('Please try again later', HttpStatus.TOO_MANY_REQUESTS);
    }

    try {
      const user = await this.userService.findOne(userId);
      if (user.cashAmount < user.labPlotPrice) {
        throw new HttpException("Not enough money", HttpStatus.BAD_REQUEST);
      }

      const newPlotId = user.labPlots.length + 1;
      if (user.labPlots.some(plot => plot.plotId === newPlotId)) {
        throw new HttpException("Plot ID already exists", HttpStatus.CONFLICT);
      }

      user.cashAmount -= user.labPlotPrice;
      user.labPlots.push({ plotId: newPlotId });

      await user.save();
      this.mixpanel.people.increment(user.id.toString(), "lab_plots", 1);
      return user;
    } finally {
      await this.redis.del(lockKey);
    }
  }

  getLabs() {
    return labs;
  }

  getLab(labProduct: EProduct) {
    return labs[labProduct];
  }

  checkLabRequirements(user: User, labProduct: EProduct) {
    const lab = this.getLab(labProduct);
    const userProduct = user.products.find(
      (product) => product.name === labProduct,
    );
    if (!userProduct || userProduct.level < lab.levelRequirement) {
      throw new HttpException(
        "Product level is too low",
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async buyLab(userId: number, params: BuyLabDto) {
    const user = await this.userService.findOne(userId);
    this.checkLabRequirements(user, params.labProduct);

    const labPlot = user.labPlots.find((plot) => plot.plotId === params.plotId);
    if (labPlot.lab) {
      throw new HttpException("Plot is not empty", HttpStatus.BAD_REQUEST);
    }

    const lab = this.getLab(params.labProduct);
    if (user.cashAmount < lab.labPrice) {
      throw new HttpException("Not enough money", HttpStatus.BAD_REQUEST);
    }

    user.cashAmount -= lab.labPrice;
    labPlot.lab = {
      product: params.labProduct,
      title: lab.title,
      image: lab.image,
      capacityLevel: 1,
      productionLevel: 1,
      collectTime: new Date(),
    };
    await user.save();

    this.mixpanel.track("Upgrade Bought", {
      distinct_id: user.id,
      type: "Lab",
      value: params.labProduct,
    });
    return user;
  }

  private getLabPlotForUpgrade(user: User, plotId: number) {
    const labPlot = user.labPlots.find((plot) => plot.plotId === plotId);
    if (!labPlot.lab) {
      throw new HttpException("Plot is empty", HttpStatus.BAD_REQUEST);
    }
    return labPlot;
  }

  async upgradeLabCapacity(userId: number, plotId: number) {
    const user = await this.userService.findOne(userId);
    const labPlot = this.getLabPlotForUpgrade(user, plotId);

    if (labPlot.lab.nextCapacityUpgrade > new Date()) {
      throw new HttpException("Upgrade not available yet", HttpStatus.BAD_REQUEST);
    }

    if (user.cashAmount < labPlot.lab.upgradeCapacityPrice) {
      throw new HttpException("Not enough money", HttpStatus.BAD_REQUEST);
    }

    user.cashAmount -= labPlot.lab.upgradeCapacityPrice;
    labPlot.lab.capacityLevel++;
    labPlot.lab.lastCapacityUpgrade = new Date();
    await user.save();
    this.mixpanel.track("Boost Upgrade", {
      distinct_id: user.id,
      type: "Lab Capacity",
      value: labPlot.lab.product,
      level: labPlot.lab.capacityLevel,
    });
    return user;
  }

  async upgradeLabProduction(userId: number, plotId: number) {
    const user = await this.userService.findOne(userId);
    const labPlot = this.getLabPlotForUpgrade(user, plotId);

    if (labPlot.lab.nextProductionUpgrade > new Date()) {
      throw new HttpException("Upgrade not available yet", HttpStatus.BAD_REQUEST);
    }

    if (user.cashAmount < labPlot.lab.upgradeProductionPrice) {
      throw new HttpException("Not enough money", HttpStatus.BAD_REQUEST);
    }

    user.cashAmount -= labPlot.lab.upgradeProductionPrice;
    labPlot.lab.productionLevel++;
    labPlot.lab.lastProductionUpgrade = new Date();
    this.mixpanel.track("Boost Upgrade", {
      distinct_id: user.id,
      type: "Lab Production",
      value: labPlot.lab.product,
      level: labPlot.lab.productionLevel,
    });
    await user.save();
    return user;
  }

  async collectLabProduction(userId: number, plotId: number) {
    const user = await this.userService.findOne(userId);
    const labPlot = this.getLabPlotForUpgrade(user, plotId);

    const userProduct = user.products.find(
      (product) => product.name === labPlot.lab.product,
    );
    const production = labPlot.lab.produced;
    userProduct.quantity += production;

    labPlot.lab.collectTime = new Date();
    await user.save();

    this.mixpanel.track("Lab Production Collected", {
      distinct_id: user.id,
      product: labPlot.lab.product,
      plot: plotId,
      production,
    });
    return user;
  }
}
