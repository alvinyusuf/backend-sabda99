import { BadRequestException } from '@nestjs/common';

export interface UomConvertibleItem {
  uomId: string;
  purchaseUomId?: string | null;
  purchaseConversionFactor?: number | null;
  recipeUomId?: string | null;
  recipeConversionFactor?: number | null;
}

/**
 * Converts a quantity given in one of an item's three registered UoMs
 * (Base/Purchase/Recipe) into the item's Base UoM.
 * 1 unit of `givenUomId` = `conversionFactor` units of the Base UoM.
 */
export function convertToBaseUom(
  item: UomConvertibleItem,
  givenUomId: string,
  quantity: number,
): number {
  if (givenUomId === item.uomId) {
    return quantity;
  }
  if (givenUomId === item.purchaseUomId && item.purchaseConversionFactor) {
    return quantity * item.purchaseConversionFactor;
  }
  if (givenUomId === item.recipeUomId && item.recipeConversionFactor) {
    return quantity * item.recipeConversionFactor;
  }
  throw new BadRequestException(
    `UoM ${givenUomId} tidak terdaftar untuk item ini (harus salah satu dari UoM Dasar/Beli/Resep item)`,
  );
}

export function isRegisteredUom(
  item: UomConvertibleItem,
  uomId: string,
): boolean {
  return (
    uomId === item.uomId ||
    uomId === item.purchaseUomId ||
    uomId === item.recipeUomId
  );
}
