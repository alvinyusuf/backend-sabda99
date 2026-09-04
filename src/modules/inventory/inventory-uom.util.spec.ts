import { BadRequestException } from '@nestjs/common';
import { convertToBaseUom, isRegisteredUom } from './inventory-uom.util';

const item = {
  uomId: 'base-gram',
  purchaseUomId: 'purchase-bungkus',
  purchaseConversionFactor: 1000,
  recipeUomId: 'recipe-sendok',
  recipeConversionFactor: 10,
};

describe('convertToBaseUom', () => {
  it('returns quantity unchanged when given the base UoM', () => {
    expect(convertToBaseUom(item, 'base-gram', 5)).toBe(5);
  });

  it('multiplies by the purchase conversion factor', () => {
    expect(convertToBaseUom(item, 'purchase-bungkus', 5)).toBe(5000);
  });

  it('multiplies by the recipe conversion factor', () => {
    expect(convertToBaseUom(item, 'recipe-sendok', 3)).toBe(30);
  });

  it('throws BadRequestException for an unregistered UoM', () => {
    expect(() => convertToBaseUom(item, 'unrelated-uom', 1)).toThrow(
      BadRequestException,
    );
  });

  it('throws when the UoM matches but no conversion factor is set', () => {
    const noFactorItem = { uomId: 'base-liter', purchaseUomId: 'purchase-drum', purchaseConversionFactor: null, recipeUomId: null, recipeConversionFactor: null };
    expect(() => convertToBaseUom(noFactorItem, 'purchase-drum', 1)).toThrow(
      BadRequestException,
    );
  });
});

describe('isRegisteredUom', () => {
  it('accepts the base, purchase, and recipe UoM', () => {
    expect(isRegisteredUom(item, 'base-gram')).toBe(true);
    expect(isRegisteredUom(item, 'purchase-bungkus')).toBe(true);
    expect(isRegisteredUom(item, 'recipe-sendok')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isRegisteredUom(item, 'unrelated-uom')).toBe(false);
  });
});
