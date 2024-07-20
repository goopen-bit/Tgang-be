import { IsEnum, IsString } from 'class-validator';
import { EDealerUpgrade, EShippingUpgrade, EUpgradeCategory } from '../upgrade.interface';
import { EProduct } from '../../product/product.const';

export class BuyUpgradeDto {
  @IsEnum(EUpgradeCategory)
  category: EUpgradeCategory;

  @IsString()
  upgrade: EProduct | EDealerUpgrade | EShippingUpgrade;
}
