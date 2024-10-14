import { Prop, Schema } from "@nestjs/mongoose";
import {
  PVP_BASE_ACCURACY,
  PVP_BASE_ATTACKS_PER_DAY,
  PVP_BASE_CRITICAL_HIT_CHANCE,
  PVP_BASE_DAMAGE,
  PVP_BASE_EVASION,
  PVP_BASE_HEALTH_POINTS,
  PVP_BASE_LOOT_POWER,
  PVP_BASE_PROTECTION
} from "../user.const";
import { Effects, GearName, GearType } from "../../arsenal/arsenal.interface";

function applyGearEffect(effect: Effects, equippedGear: UserGear[]) {
  return equippedGear.reduce((acc, gear) => {
    return acc + gear.effects.find((e) => e.effect === effect)?.value || 0;
  }, 0);
}

@Schema({ _id: false })
export class UserGear {
  @Prop({ required: true })
  name: GearName;

  @Prop({ required: true })
  type: GearType;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  effects: { effect: Effects; value: number }[];
}

@Schema({ _id: false })
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
      const gearEffect = applyGearEffect(Effects.HEALTH_POINTS, this.equippedGear);
      return PVP_BASE_HEALTH_POINTS + gearEffect;
    },
  })
  healthPoints?: number;

  @Prop({
    virtual: true,
    get: function () {
      const gearEffect = applyGearEffect(Effects.PROTECTION, this.equippedGear);
      return PVP_BASE_PROTECTION + gearEffect;
    },
  })
  protection?: number;

  @Prop({
    virtual: true,
    get: function () {
      const gearEffect = applyGearEffect(Effects.DAMAGE, this.equippedGear);
      return PVP_BASE_DAMAGE + gearEffect;
    },
  })
  damage?: number;

  @Prop({
    virtual: true,
    get: function () {
      const gearEffect = applyGearEffect(Effects.ACCURACY, this.equippedGear);
      return PVP_BASE_ACCURACY + gearEffect;
    },
  })
  accuracy?: number;

  @Prop({
    virtual: true,
    get: function () {
      const gearEffect = applyGearEffect(Effects.EVASION, this.equippedGear);
      return PVP_BASE_EVASION + gearEffect;
    },
  })
  evasion?: number;

  @Prop({
    virtual: true,
    get: function () {
      const gearEffect = applyGearEffect(Effects.LOOT_POWER, this.equippedGear);
      return PVP_BASE_LOOT_POWER + gearEffect;
    },
  })
  lootPower?: number;

  @Prop({
    virtual: true,
    get: function () {
      const gearEffect = applyGearEffect(Effects.CRITICAL_CHANCE, this.equippedGear);
      return PVP_BASE_CRITICAL_HIT_CHANCE + gearEffect;
    },
  })
  criticalChance?: number;

  @Prop({ type: UserGear, default: [] })
  purchasedGear: UserGear[];

  @Prop({ type: UserGear, default: [] })
  equippedGear: UserGear[];
}
