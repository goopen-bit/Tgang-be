import { UserProduct } from "./schemas/userProduct.schema";
import { UserPvp } from "./schemas/userPvp.schema";

export interface IReputationLevel {
  level: number;
  minReputation: number;
  maxReputation: number;
  title: string;
}

export interface BotUser {
  id: number;
  username: string;
  cashAmount: number;
  reputation: number;
  products: UserProduct[];
  userLevel: IReputationLevel
  pvp: UserPvp;
  isBot: true,
}
