import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { parseCSV } from './lib/fileProcessing/csvParser';
import { parseExcel } from './lib/fileProcessing/excelParser';
import { parseJSON } from './lib/fileProcessing/jsonParser';
import { validateRecord } from './lib/fileProcessing/validator';
import { transformRecord, autoDetectMapping } from './lib/fileProcessing/transformer';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import * as XLSX from 'xlsx';

const TEST_DIR = '/tmp/terraforge-test-data';

beforeAll(() => {
  // Create test directory
  mkdirSync(TEST_DIR, { recursive: true });
  
  // Create test CSV file
  const csvContent = `parcelId,address,sqft,yearBuilt,landValue,buildingValue
P001,"123 Main St",2000,1995,50000,150000
P002,"456 Oak Ave",1500,2005,40000,120000
P003,"789 Elm Dr",2500,1980,60000,180000`;
  
  writeFileSync(join(TEST_DIR, 'test.csv'), csvContent);
  
  // Create test Excel file
  const excelData = [
    { parcelId: 'P001', address: '123 Main St', sqft: 2000, yearBuilt: 1995, landValue: 50000, buildingValue: 150000 },
    { parcelId: 'P002', address: '456 Oak Ave', sqft: 1500, yearBuilt: 2005, landValue: 40000, buildingValue: 120000 },
    { parcelId: 'P003', address: '789 Elm Dr', sqft: 2500, yearBuilt: 1980, landValue: 60000, buildingValue: 180000 },
  ];
  
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Properties');
  XLSX.writeFile(workbook, join(TEST_DIR, 'test.xlsx'));
  
  // Create test JSON file
  const jsonContent = JSON.stringify(excelData, null, 2);
  writeFileSync(join(TEST_DIR, 'test.json'), jsonContent);
});

afterAll(() => {
  // Cleanup test files
  const { rmSync } = require('fs');
  rmSync(TEST_DIR, { recursive: true, force: true });
});

describe('CSV Parser', () => {
  it('should parse CSV file correctly', async () => {
    const fileUrl = `file://${join(TEST_DIR, 'test.csv')}`;
    const records = await parseCSV(fileUrl);
    
    expect(records).toHaveLength(3);
    expect(records[0]).toHaveProperty('parcelId', 'P001');
    expect(records[0]).toHaveProperty('address', '123 Main St');
    expect(records[0]).toHaveProperty('sqft', 2000);
  });
});

describe('Excel Parser', () => {
  it('should parse Excel file correctly', async () => {
    const fileUrl = `file://${join(TEST_DIR, 'test.xlsx')}`;
    const records = await parseExcel(fileUrl);
    
    expect(records).toHaveLength(3);
    expect(records[0]).toHaveProperty('parcelId', 'P001');
    expect(records[0]).toHaveProperty('address', '123 Main St');
    expect(records[0]).toHaveProperty('sqft', 2000);
  });
});

describe('JSON Parser', () => {
  it('should parse JSON file correctly', async () => {
    const fileUrl = `file://${join(TEST_DIR, 'test.json')}`;
    const records = await parseJSON(fileUrl);
    
    expect(records).toHaveLength(3);
    expect(records[0]).toHaveProperty('parcelId', 'P001');
    expect(records[0]).toHaveProperty('address', '123 Main St');
    expect(records[0]).toHaveProperty('sqft', 2000);
  });
  
  it('should reject non-array JSON', async () => {
    const invalidJson = JSON.stringify({ data: [] });
    writeFileSync(join(TEST_DIR, 'invalid.json'), invalidJson);
    
    const fileUrl = `file://${join(TEST_DIR, 'invalid.json')}`;
    await expect(parseJSON(fileUrl)).rejects.toThrow('JSON file must contain an array of records');
  });
});

describe('Data Validator', () => {
  it('should validate correct record', () => {
    const record = {
      parcelId: 'P001',
      address: '123 Main St',
      sqft: 2000,
      yearBuilt: 1995,
      landValue: 50000,
      buildingValue: 150000,
    };
    
    const result = validateRecord(record);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.parcelId).toBe('P001');
  });
  
  it('should reject record with missing parcelId', () => {
    const record = {
      address: '123 Main St',
      sqft: 2000,
    };
    
    const result = validateRecord(record);
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.some(e => e.includes('parcelId'))).toBe(true);
  });
  
  it('should reject record with invalid year', () => {
    const record = {
      parcelId: 'P001',
      address: '123 Main St',
      yearBuilt: 1700, // Too old
    };
    
    const result = validateRecord(record);
    expect(result.success).toBe(false);
    expect(result.errors?.some(e => e.includes('Year built'))).toBe(true);
  });
  
  it('should reject record with negative values', () => {
    const record = {
      parcelId: 'P001',
      address: '123 Main St',
      landValue: -5000, // Negative value
    };
    
    const result = validateRecord(record);
    expect(result.success).toBe(false);
    expect(result.errors?.some(e => e.includes('Land value'))).toBe(true);
  });
});

describe('Data Transformer', () => {
  it('should transform record with explicit mapping', () => {
    const rawRecord = {
      'Parcel Number': 'P001',
      'Street Address': '123 Main St',
      'Square Footage': '2000',
      'Year Constructed': '1995',
    };
    
    const mapping = {
      parcelId: 'Parcel Number',
      address: 'Street Address',
      sqft: 'Square Footage',
      yearBuilt: 'Year Constructed',
    };
    
    const transformed = transformRecord(rawRecord, mapping);
    
    expect(transformed.parcelId).toBe('P001');
    expect(transformed.address).toBe('123 Main St');
    expect(transformed.sqft).toBe(2000);
    expect(transformed.yearBuilt).toBe(1995);
  });
  
  it('should handle numeric strings with currency symbols', () => {
    const rawRecord = {
      'Parcel ID': 'P001',
      'Address': '123 Main St',
      'Land Value': '$50,000.00',
      'Building Value': '$150,000',
    };
    
    const mapping = {
      parcelId: 'Parcel ID',
      address: 'Address',
      landValue: 'Land Value',
      buildingValue: 'Building Value',
    };
    
    const transformed = transformRecord(rawRecord, mapping);
    
    expect(transformed.landValue).toBe(50000);
    expect(transformed.buildingValue).toBe(150000);
  });
});

describe('Auto Column Mapping', () => {
  it('should detect standard column names', () => {
    const headers = ['parcelId', 'address', 'sqft', 'yearBuilt', 'landValue', 'buildingValue'];
    const mapping = autoDetectMapping(headers);
    
    expect(mapping.parcelId).toBe('parcelId');
    expect(mapping.address).toBe('address');
    expect(mapping.sqft).toBe('sqft');
    expect(mapping.yearBuilt).toBe('yearBuilt');
    expect(mapping.landValue).toBe('landValue');
    expect(mapping.buildingValue).toBe('buildingValue');
  });
  
  it('should detect common variations', () => {
    const headers = ['PIN', 'Property Address', 'Square Feet', 'Year Built', 'Land Assessment', 'Improvement Value'];
    const mapping = autoDetectMapping(headers);
    
    expect(mapping.parcelId).toBe('PIN');
    expect(mapping.address).toBe('Property Address');
    expect(mapping.sqft).toBe('Square Feet');
    expect(mapping.yearBuilt).toBe('Year Built');
    expect(mapping.landValue).toBe('Land Assessment');
    expect(mapping.buildingValue).toBe('Improvement Value');
  });
  
  it('should handle case-insensitive and special characters', () => {
    const headers = ['PARCEL_ID', 'Street-Address', 'GBA', 'YR_BUILT'];
    const mapping = autoDetectMapping(headers);
    
    expect(mapping.parcelId).toBe('PARCEL_ID');
    expect(mapping.address).toBe('Street-Address');
    expect(mapping.sqft).toBe('GBA');
    expect(mapping.yearBuilt).toBe('YR_BUILT');
  });
});

describe('End-to-End Data Processing', () => {
  it('should process CSV file from parsing to validation', async () => {
    const fileUrl = `file://${join(TEST_DIR, 'test.csv')}`;
    const records = await parseCSV(fileUrl);
    
    expect(records).toHaveLength(3);
    
    const headers = Object.keys(records[0]);
    const mapping = autoDetectMapping(headers);
    
    expect(mapping.parcelId).toBeDefined();
    expect(mapping.address).toBeDefined();
    
    const transformed = transformRecord(records[0], mapping);
    const validation = validateRecord(transformed);
    
    expect(validation.success).toBe(true);
    expect(validation.data?.parcelId).toBe('P001');
  });
});
