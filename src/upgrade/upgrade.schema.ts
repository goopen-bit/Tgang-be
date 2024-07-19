import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
class Requirement {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  level: number;
}

@Schema()
export class Upgrade extends Document {
  @Prop({ required: true, unique: true })
  id: number;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  level: number;

  @Prop({ required: true })
  maxLevel: number;

  @Prop({ required: true })
  levelPrices: number[];

  @Prop({ required: true })
  value: number[];

  @Prop({ required: true })
  image: string;

  @Prop({ required: true })
  locked: boolean;

  @Prop({ required: true })
  group: string;

  @Prop({ type: Requirement, required: false })
  requirement: Requirement | null;
}

export const RequirementSchema = SchemaFactory.createForClass(Requirement);
export const UpgradeSchema = SchemaFactory.createForClass(Upgrade);
