import { IsEnum, IsString } from 'class-validator';
import { EDealerUpgrade, EUpgradeCategory } from '../upgrade.interface';
import { EProduct } from 'src/product/product.const';

export class BuyUpgradeDto {
  @IsEnum(EUpgradeCategory)
  category: EUpgradeCategory;

  @IsString()
  upgrade: EProduct | EDealerUpgrade;
}
