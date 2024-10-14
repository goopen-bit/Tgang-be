import { Effects, Gear, GearName, GearType } from "../arsenal.interface";

export const gear: Record<GearName, Gear> = {
  [GearName.BAT]: {
    name: GearName.BAT,
    type: GearType.WEAPON,
    price: 1000,
    effects: [{ effect: Effects.DAMAGE, value: 5 }],
  },
  [GearName.KNIFE]: {
    name: GearName.KNIFE,
    type: GearType.WEAPON,
    price: 2000,
    effects: [
      { effect: Effects.DAMAGE, value: 10 },
      { effect: Effects.CRITICAL_CHANCE, value: 2 },
    ],
  },
  [GearName.PISTOL]: {
    name: GearName.PISTOL,
    type: GearType.WEAPON,
    price: 5000,
    effects: [
      { effect: Effects.DAMAGE, value: 20 },
      { effect: Effects.ACCURACY, value: 5 },
    ],
  },
  [GearName.KEVLAR]: {
    name: GearName.KEVLAR,
    type: GearType.ARMOR,
    price: 1000,
    effects: [{ effect: Effects.PROTECTION, value: 5 }],
  },
  [GearName.RIOT_GEAR]: {
    name: GearName.RIOT_GEAR,
    type: GearType.ARMOR,
    price: 2000,
    effects: [
      { effect: Effects.PROTECTION, value: 10 },
      { effect: Effects.EVASION, value: 2 },
    ],
  },
  [GearName.EXOSKELETON]: {
    name: GearName.EXOSKELETON,
    type: GearType.ARMOR,
    price: 5000,
    effects: [
      { effect: Effects.HEALTH_POINTS, value: 20 },
      { effect: Effects.PROTECTION, value: 20 }
    ],
  }
};
