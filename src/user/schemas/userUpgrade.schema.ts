import { Prop, Schema } from "@nestjs/mongoose";

@Schema({ _id: false })
export class UserUpgrade {
  @Prop({ required: true })
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
}
