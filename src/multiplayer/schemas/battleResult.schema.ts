import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { EProduct } from "../../market/market.const";
import { DbCollections } from "../../config/types";

@Schema({ _id: false })
export class BattleLoot {
  @Prop({ required: true })
  name: EProduct;

  @Prop({ required: true })
  quantity: number;
}

@Schema({
  collection: DbCollections.BATTLE_RESULTS,
  timestamps: { createdAt: true, updatedAt: false },
})
export class BattleResult extends Document {
  @Prop({ required: true })
  battleId: string;

  @Prop({ required: true })
  attackerId: number;

  @Prop({ required: true })
  attackerUsername: string;

  @Prop({ required: true })
  defenderId: number;

  @Prop({ required: true })
  defenderUsername: string;

  @Prop({ required: true })
  winner: "attacker" | "defender";

  @Prop({ required: true })
  rounds: number;

  @Prop()
  cashLoot: number;

  @Prop({ type: [BattleLoot] })
  productLoot: BattleLoot[];
}

export const BattleResultSchema = SchemaFactory.createForClass(BattleResult);
