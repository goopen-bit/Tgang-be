import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false })
export class UserPvp {
  @Prop({ required: true, default: false })
  pvpEnabled: boolean;

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

  @Prop({ required: true, default: 100 })
  baseHp: number;

  @Prop({ required: true, default: 0 })
  protection: number;

  @Prop({ required: true, default: 10 })
  damage: number;

  @Prop({ required: true, default: 50 })
  accuracy: number;

  @Prop({ required: true, default: 5 })
  evasion: number;

  @Prop({ required: false, default: 0.1 })
  lootPower?: number;
}