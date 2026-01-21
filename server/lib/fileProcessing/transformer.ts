export interface ColumnMapping {
  [key: string]: string | undefined;
  parcelId?: string;
  address?: string;
  sqft?: string;
  yearBuilt?: string;
  landValue?: string;
  buildingValue?: string;
  salePrice?: string;
}

export function transformRecord(rawRecord: any, mapping: ColumnMapping): any {
  const transformed: any = {};
  
  // Map columns based on provided mapping
  if (mapping.parcelId && rawRecord[mapping.parcelId] !== undefined) {
    transformed.parcelId = String(rawRecord[mapping.parcelId]).trim();
  }
  
  if (mapping.address && rawRecord[mapping.address] !== undefined) {
    transformed.address = String(rawRecord[mapping.address]).trim();
  }
  
  if (mapping.sqft && rawRecord[mapping.sqft] !== undefined && rawRecord[mapping.sqft] !== null && rawRecord[mapping.sqft] !== '') {
    const value = rawRecord[mapping.sqft];
    transformed.sqft = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  }
  
  if (mapping.yearBuilt && rawRecord[mapping.yearBuilt] !== undefined && rawRecord[mapping.yearBuilt] !== null && rawRecord[mapping.yearBuilt] !== '') {
    const value = rawRecord[mapping.yearBuilt];
    transformed.yearBuilt = typeof value === 'number' ? Math.floor(value) : parseInt(String(value).replace(/[^0-9]/g, ''));
  }
  
  if (mapping.landValue && rawRecord[mapping.landValue] !== undefined && rawRecord[mapping.landValue] !== null && rawRecord[mapping.landValue] !== '') {
    const value = rawRecord[mapping.landValue];
    transformed.landValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  }
  
  if (mapping.buildingValue && rawRecord[mapping.buildingValue] !== undefined && rawRecord[mapping.buildingValue] !== null && rawRecord[mapping.buildingValue] !== '') {
    const value = rawRecord[mapping.buildingValue];
    transformed.buildingValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  }
  
  if (mapping.salePrice && rawRecord[mapping.salePrice] !== undefined && rawRecord[mapping.salePrice] !== null && rawRecord[mapping.salePrice] !== '') {
    const value = rawRecord[mapping.salePrice];
    transformed.salePrice = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  }
  
  return transformed;
}

export function autoDetectMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  
  // Common variations for each field (case-insensitive)
  const parcelIdVariations = ['parcelid', 'parcel_id', 'parcel', 'pin', 'property_id', 'propertyid', 'apn'];
  const addressVariations = ['address', 'property_address', 'location', 'street', 'street_address', 'situs', 'streetaddress'];
  const sqftVariations = ['sqft', 'square_feet', 'squarefeet', 'area', 'building_area', 'gross_area', 'gba', 'squarefeet'];
  const yearBuiltVariations = ['yearbuilt', 'year_built', 'year', 'construction_year', 'built', 'yr_built'];
  const landValueVariations = ['landvalue', 'land_value', 'land_assessed_value', 'land_assessment', 'land_val'];
  const buildingValueVariations = ['buildingvalue', 'building_value', 'improvement_value', 'building_assessment', 'bldg_value'];
  const salePriceVariations = ['saleprice', 'sale_price', 'price', 'sale_amount', 'sales_price', 'sold_price'];
  
  headers.forEach(header => {
    const normalized = header.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    
    if (!mapping.parcelId && parcelIdVariations.includes(normalized)) mapping.parcelId = header;
    if (!mapping.address && addressVariations.includes(normalized)) mapping.address = header;
    if (!mapping.sqft && sqftVariations.includes(normalized)) mapping.sqft = header;
    if (!mapping.yearBuilt && yearBuiltVariations.includes(normalized)) mapping.yearBuilt = header;
    if (!mapping.landValue && landValueVariations.includes(normalized)) mapping.landValue = header;
    if (!mapping.buildingValue && buildingValueVariations.includes(normalized)) mapping.buildingValue = header;
    if (!mapping.salePrice && salePriceVariations.includes(normalized)) mapping.salePrice = header;
  });
  
  return mapping;
}
