import { Prop, Schema } from "@nestjs/mongoose";
import { PVP_BASE_ACCURACY, PVP_BASE_ATTACKS_PER_DAY, PVP_BASE_CRITICAL_HIT_CHANCE, PVP_BASE_DAMAGE, PVP_BASE_EVASION, PVP_BASE_HEALTH_POINTS, PVP_BASE_LOOT_POWER, PVP_BASE_PROTECTION } from "../user.const";

@Schema({
  _id: false,
  toObject: {
    getters: true,
  },
  toJSON: {
    getters: true,
  },
})
export class UserPvp {
  @Prop({ required: true, default: 0 })
  victory: number;

  @Prop({ required: true, default: 0 })
  defeat: number;

  @Prop({ required: true, default: new Date(0) })
  lastAttackDate: Date;

  @Prop({ required: true, default: 0 })
  attacksToday: number;

  @Prop({ required: true, default: new Date(0) })
  lastDefendDate: Date;

  @Prop({
    virtual: true,
    get: function () {
      const parent = this.parent();
      const referredUsers = parent.referredUsers?.length || 0;
      let dailyAttacks = PVP_BASE_ATTACKS_PER_DAY;
      if (referredUsers >= 20) {
        dailyAttacks += 3;
      } else if (referredUsers >= 10) {
        dailyAttacks += 2;
      } else if (referredUsers >= 5) {
        dailyAttacks += 1;
      }

      // TODO: watched add

      return dailyAttacks;
    },
  })
  attacksAvailable?: number;

  @Prop({
    virtual: true,
    get: function () {
      return PVP_BASE_HEALTH_POINTS;
    },
  })
  healthPoints?: number;

  @Prop({
    virtual: true,
    get: function () {
      return PVP_BASE_PROTECTION;
    },
  })
  protection?: number;

  @Prop({
    virtual: true,
    get: function () {
      return PVP_BASE_DAMAGE;
    },
  })
  damage?: number;

  @Prop({
    virtual: true,
    get: function () {
      return PVP_BASE_ACCURACY;
    },
  })
  accuracy?: number;

  @Prop({
    virtual: true,
    get: function () {
      return PVP_BASE_EVASION;
    },
  })
  evasion?: number;

  @Prop({
    virtual: true,
    get: function () {
      return PVP_BASE_LOOT_POWER;
    },
  })
  lootPower?: number;

  @Prop({
    virtual: true,
    get: function () {
      return PVP_BASE_CRITICAL_HIT_CHANCE;
    },
  })
  criticalChance?: number;
}
