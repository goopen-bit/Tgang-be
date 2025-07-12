import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { EProduct } from "../../market/market.const";
import { DbCollections } from "../../config/types";

@Schema({ _id: false })
export class Token {
  @Prop({ required: true })
  name: EProduct | string;

  @Prop({ required: true })
  reserve: number;
}

@Schema({
  collection: DbCollections.POOLS,
})
export class Pool extends Document {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true, type: Token })
  cash: Token;

  @Prop({ required: true, type: Token })
  product: Token;

  @Prop({ required: true })
  feePercent: number;
}

export const PoolSchema = SchemaFactory.createForClass(Pool);
