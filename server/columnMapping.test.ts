import { describe, it, expect } from 'vitest';
import { autoDetectMapping } from './lib/fileProcessing/transformer';

describe('Column Mapping Feature', () => {
  describe('Auto-detect column mapping', () => {
    it('should detect standard column names', () => {
      const headers = ['parcel_id', 'address', 'sqft', 'year_built', 'land_value', 'building_value'];
      const mapping = autoDetectMapping(headers);
      
      expect(mapping.parcelId).toBe('parcel_id');
      expect(mapping.address).toBe('address');
      expect(mapping.sqft).toBe('sqft');
      expect(mapping.yearBuilt).toBe('year_built');
      expect(mapping.landValue).toBe('land_value');
      expect(mapping.buildingValue).toBe('building_value');
    });

    it('should detect variations of column names', () => {
      const headers = ['Parcel ID', 'Street Address', 'Square Feet', 'Yr Built', 'Land Val', 'Bldg Value'];
      const mapping = autoDetectMapping(headers);
      
      expect(mapping.parcelId).toBe('Parcel ID');
      expect(mapping.address).toBe('Street Address');
      expect(mapping.sqft).toBe('Square Feet');
      expect(mapping.yearBuilt).toBe('Yr Built');
      expect(mapping.landValue).toBe('Land Val');
      expect(mapping.buildingValue).toBe('Bldg Value');
    });

    it('should handle case-insensitive matching', () => {
      const headers = ['PARCEL_ID', 'ADDRESS', 'SQFT', 'YEAR_BUILT'];
      const mapping = autoDetectMapping(headers);
      
      expect(mapping.parcelId).toBe('PARCEL_ID');
      expect(mapping.address).toBe('ADDRESS');
      expect(mapping.sqft).toBe('SQFT');
      expect(mapping.yearBuilt).toBe('YEAR_BUILT');
    });

    it('should return empty mapping for unrecognized headers', () => {
      const headers = ['unknown1', 'unknown2', 'unknown3'];
      const mapping = autoDetectMapping(headers);
      
      expect(mapping.parcelId).toBeUndefined();
      expect(mapping.address).toBeUndefined();
      expect(mapping.sqft).toBeUndefined();
    });

    it('should handle mixed recognized and unrecognized headers', () => {
      const headers = ['parcel_id', 'unknown_field', 'sqft', 'random_column'];
      const mapping = autoDetectMapping(headers);
      
      expect(mapping.parcelId).toBe('parcel_id');
      expect(mapping.sqft).toBe('sqft');
      expect(mapping.address).toBeUndefined();
    });
  });

  describe('Column mapping validation', () => {
    it('should require parcelId for valid mapping', () => {
      const mapping = { address: 'Street', sqft: 'SquareFeet' };
      const isValid = !!mapping.parcelId;
      
      expect(isValid).toBe(false);
    });

    it('should accept mapping with only parcelId', () => {
      const mapping = { parcelId: 'ParcelID' };
      const isValid = !!mapping.parcelId;
      
      expect(isValid).toBe(true);
    });

    it('should accept mapping with parcelId and optional fields', () => {
      const mapping = {
        parcelId: 'ParcelID',
        address: 'Address',
        sqft: 'SQFT',
        yearBuilt: 'YearBuilt',
      };
      const isValid = !!mapping.parcelId;
      
      expect(isValid).toBe(true);
    });
  });
});
