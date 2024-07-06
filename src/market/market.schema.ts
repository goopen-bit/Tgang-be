import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { DbCollections } from "../config/types";
import { Product } from "src/product/product.schema";

export class MarketProduct extends Product {
  @Prop()
  price: number;
}

@Schema({
  collection: DbCollections.MARKETS,
})
export class Market extends Document {
  @Prop()
  id: string;

  @Prop()
  name: string;

  @Prop({ type: [MarketProduct] })
  products: [MarketProduct];
}

export const MarketSchema = SchemaFactory.createForClass(Market);
