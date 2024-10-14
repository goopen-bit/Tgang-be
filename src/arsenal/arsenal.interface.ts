export enum Effects {
  HEALTH_POINTS = 'healthPoints',
  PROTECTION = 'protection',
  DAMAGE = 'damage',
  ACCURACY = 'accuracy',
  EVASION = 'evasion',
  LOOT_POWER = 'lootPower',
  CRITICAL_CHANCE = 'criticalChance',
}

export enum GearType {
  WEAPON = 'weapon',
  ARMOR = 'armor',
}

export enum GearName {
  BAT = 'Bat',
  KNIFE = 'Knife',
  PISTOL = 'Pistol',
  KEVLAR = 'Kevlar',
  RIOT_GEAR = 'Riot Gear',
  EXOSKELETON = 'Exoskeleton',
}

export interface Gear {
  name: GearName;
  type: GearType;
  price: number;
  effects: { effect: Effects; value: number }[];
}
