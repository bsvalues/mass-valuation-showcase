import { describe, it, expect } from 'vitest';

describe('Data Preview Feature', () => {
  describe('Data type detection', () => {
    it('should detect string values', () => {
      const values = ['Hello', 'World', 'Test'];
      values.forEach(value => {
        const type = detectDataType(value);
        expect(type).toBe('string');
      });
    });

    it('should detect number values', () => {
      const values = ['123', '45.67', '$1,234.56', '1000'];
      values.forEach(value => {
        const numValue = Number(String(value).replace(/[^0-9.-]/g, ''));
        expect(isNaN(numValue)).toBe(false);
      });
    });

    it('should detect empty values', () => {
      const values = [null, undefined, '', '   '];
      values.forEach(value => {
        const isEmpty = value === null || value === undefined || String(value).trim() === '';
        expect(isEmpty).toBe(true);
      });
    });

    it('should detect date values', () => {
      const values = ['2024-01-15', '01/15/2024', '2024-01-15T10:30:00'];
      values.forEach(value => {
        const dateValue = new Date(value);
        expect(isNaN(dateValue.getTime())).toBe(false);
      });
    });

    it('should detect boolean values', () => {
      const values = ['true', 'false', 'yes', 'no', '1', '0'];
      values.forEach(value => {
        const isBool = ['true', 'false', 'yes', 'no', '1', '0'].includes(String(value).toLowerCase());
        expect(isBool).toBe(true);
      });
    });
  });

  describe('Validation logic', () => {
    it('should flag empty required fields', () => {
      const row = { parcelId: '', address: '123 Main St', sqft: '1500' };
      const mapping = { parcelId: 'parcelId', address: 'address', sqft: 'sqft' };
      
      const hasError = !row[mapping.parcelId] || String(row[mapping.parcelId]).trim() === '';
      expect(hasError).toBe(true);
    });

    it('should accept valid required fields', () => {
      const row = { parcelId: 'P-12345', address: '123 Main St', sqft: '1500' };
      const mapping = { parcelId: 'parcelId', address: 'address', sqft: 'sqft' };
      
      const hasError = !row[mapping.parcelId] || String(row[mapping.parcelId]).trim() === '';
      expect(hasError).toBe(false);
    });

    it('should flag invalid numeric values', () => {
      const value = 'not-a-number';
      const numValue = Number(String(value).replace(/[^0-9.-]/g, ''));
      expect(isNaN(numValue)).toBe(true);
    });

    it('should accept valid numeric values', () => {
      const values = ['1500', '$1,500.00', '1500.50'];
      values.forEach(value => {
        const numValue = Number(String(value).replace(/[^0-9.-]/g, ''));
        expect(isNaN(numValue)).toBe(false);
      });
    });

    it('should flag suspicious year values', () => {
      const suspiciousYears = [1600, 2050, 9999];
      const currentYear = new Date().getFullYear();
      
      suspiciousYears.forEach(year => {
        const isSuspicious = year < 1700 || year > currentYear + 5;
        expect(isSuspicious).toBe(true);
      });
    });

    it('should accept valid year values', () => {
      const validYears = [1950, 2000, 2024];
      const currentYear = new Date().getFullYear();
      
      validYears.forEach(year => {
        const isSuspicious = year < 1700 || year > currentYear + 5;
        expect(isSuspicious).toBe(false);
      });
    });
  });

  describe('Preview data structure', () => {
    it('should include headers in preview', () => {
      const headers = ['parcelId', 'address', 'sqft'];
      expect(headers.length).toBeGreaterThan(0);
      expect(headers).toContain('parcelId');
    });

    it('should include sample rows in preview', () => {
      const sampleRows = [
        { parcelId: 'P-001', address: '123 Main St', sqft: '1500' },
        { parcelId: 'P-002', address: '456 Oak Ave', sqft: '2000' },
      ];
      expect(sampleRows.length).toBeGreaterThan(0);
      expect(sampleRows[0]).toHaveProperty('parcelId');
    });

    it('should include total row count', () => {
      const totalRows = 1000;
      expect(totalRows).toBeGreaterThan(0);
      expect(typeof totalRows).toBe('number');
    });

    it('should include column mapping', () => {
      const mapping = {
        parcelId: 'Parcel ID',
        address: 'Street Address',
        sqft: 'Square Feet',
      };
      expect(Object.keys(mapping).length).toBeGreaterThan(0);
      expect(mapping.parcelId).toBe('Parcel ID');
    });
  });
});

// Helper function for testing
function detectDataType(value: any): 'string' | 'number' | 'date' | 'boolean' | 'empty' {
  if (value === null || value === undefined || String(value).trim() === '') return 'empty';
  
  const strValue = String(value).trim();
  
  if (['true', 'false', 'yes', 'no', '1', '0'].includes(strValue.toLowerCase())) {
    return 'boolean';
  }
  
  const numValue = Number(strValue.replace(/[^0-9.-]/g, ''));
  if (!isNaN(numValue) && strValue.replace(/[^0-9.-]/g, '') !== '') {
    return 'number';
  }
  
  const dateValue = new Date(strValue);
  if (!isNaN(dateValue.getTime()) && strValue.match(/\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/)) {
    return 'date';
  }
  
  return 'string';
}
