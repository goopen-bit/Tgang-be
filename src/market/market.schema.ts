import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { DbCollections } from "../config/types";
import { Product } from "../product/product.schema";

@Schema({ _id: false })
export class MarketProduct extends Product {
  @Prop({ required: true })
  price: number;
}

@Schema({
  collection: DbCollections.MARKETS,
})
export class Market extends Document {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: [MarketProduct] })
  products: [MarketProduct];
}

export const MarketSchema = SchemaFactory.createForClass(Market);
