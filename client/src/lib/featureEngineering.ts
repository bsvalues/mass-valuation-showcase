/**
 * Feature Engineering Library for Value Driver Analysis
 * 
 * Provides functions to calculate derived features and interaction terms
 * for enhanced property valuation modeling.
 */

export interface PropertyFeatures {
  // Raw features
  squareFeet?: number;
  yearBuilt?: number;
  landValue?: number;
  buildingValue?: number;
  totalValue?: number;
  bedrooms?: number;
  bathrooms?: number;
  acres?: number;
  lotSize?: number;
  basementSqFt?: number;
  
  // Quality and condition
  quality?: 'economy' | 'average' | 'good' | 'very_good' | 'excellent';
  condition?: 'poor' | 'fair' | 'average' | 'good' | 'excellent';
  renovationYear?: number;
  
  // Location features
  latitude?: number;
  longitude?: number;
  distanceToSchool?: number;
  distanceToPark?: number;
  distanceToTransit?: number;
  distanceToDowntown?: number;
  walkabilityScore?: number;
  neighborhoodClusterId?: number;
  
  // Property type
  propertyType?: string;
  propertySubtype?: string;
}

export interface EngineerEdFeatures extends PropertyFeatures {
  // Derived features
  propertyAge?: number;
  effectiveAge?: number;
  pricePerSqFt?: number;
  landToTotalRatio?: number;
  buildingToLandRatio?: number;
  lotSizeToSqFtRatio?: number;
  basementRatio?: number;
  
  // Encoded features
  qualityScore?: number;
  conditionScore?: number;
  propertyTypeEncoded?: number;
  
  // Interaction terms
  sqftXQuality?: number;
  ageXCondition?: number;
  locationScore?: number;
  amenityScore?: number;
  
  // Depreciation factors
  depreciationFactor?: number;
  renovationBoost?: number;
}

/**
 * Calculate property age from year built
 */
export function calculatePropertyAge(yearBuilt?: number): number | undefined {
  if (!yearBuilt) return undefined;
  const currentYear = new Date().getFullYear();
  return Math.max(0, currentYear - yearBuilt);
}

/**
 * Calculate effective age considering renovations
 * Effective age = actual age - (years since renovation × 0.5)
 */
export function calculateEffectiveAge(
  yearBuilt?: number,
  renovationYear?: number
): number | undefined {
  const actualAge = calculatePropertyAge(yearBuilt);
  if (!actualAge) return undefined;
  
  if (renovationYear && renovationYear > (yearBuilt || 0)) {
    const currentYear = new Date().getFullYear();
    const yearsSinceRenovation = currentYear - renovationYear;
    const ageReduction = yearsSinceRenovation * 0.5;
    return Math.max(0, actualAge - ageReduction);
  }
  
  return actualAge;
}

/**
 * Calculate price per square foot
 */
export function calculatePricePerSqFt(
  totalValue?: number,
  squareFeet?: number
): number | undefined {
  if (!totalValue || !squareFeet || squareFeet === 0) return undefined;
  return totalValue / squareFeet;
}

/**
 * Calculate land to total value ratio
 */
export function calculateLandToTotalRatio(
  landValue?: number,
  totalValue?: number
): number | undefined {
  if (!landValue || !totalValue || totalValue === 0) return undefined;
  return landValue / totalValue;
}

/**
 * Calculate building to land value ratio
 */
export function calculateBuildingToLandRatio(
  buildingValue?: number,
  landValue?: number
): number | undefined {
  if (!buildingValue || !landValue || landValue === 0) return undefined;
  return buildingValue / landValue;
}

/**
 * Calculate lot size to building size ratio
 */
export function calculateLotSizeToSqFtRatio(
  lotSize?: number,
  squareFeet?: number
): number | undefined {
  if (!lotSize || !squareFeet || squareFeet === 0) return undefined;
  return lotSize / squareFeet;
}

/**
 * Calculate basement ratio (basement sqft / total sqft)
 */
export function calculateBasementRatio(
  basementSqFt?: number,
  squareFeet?: number
): number | undefined {
  if (!basementSqFt || !squareFeet || squareFeet === 0) return undefined;
  return basementSqFt / squareFeet;
}

/**
 * Encode quality rating to numeric score (1-5)
 */
export function encodeQuality(quality?: string): number {
  const qualityMap: Record<string, number> = {
    'economy': 1,
    'average': 2,
    'good': 3,
    'very_good': 4,
    'excellent': 5
  };
  return qualityMap[quality || 'average'] || 2;
}

/**
 * Encode condition rating to numeric score (1-5)
 */
export function encodeCondition(condition?: string): number {
  const conditionMap: Record<string, number> = {
    'poor': 1,
    'fair': 2,
    'average': 3,
    'good': 4,
    'excellent': 5
  };
  return conditionMap[condition || 'average'] || 3;
}

/**
 * Encode property type to numeric value
 */
export function encodePropertyType(propertyType?: string): number {
  const typeMap: Record<string, number> = {
    'residential': 1,
    'commercial': 2,
    'industrial': 3,
    'agricultural': 4,
    'mixed_use': 5,
    'vacant_land': 6
  };
  return typeMap[propertyType?.toLowerCase() || 'residential'] || 1;
}

/**
 * Calculate depreciation factor based on age and condition
 * Returns a value between 0 and 1 (1 = no depreciation, 0 = fully depreciated)
 */
export function calculateDepreciationFactor(
  propertyAge?: number,
  condition?: string
): number {
  if (!propertyAge) return 1.0;
  
  const conditionScore = encodeCondition(condition);
  const baseDepreciation = Math.max(0, 1 - (propertyAge * 0.01)); // 1% per year
  const conditionAdjustment = (conditionScore - 3) * 0.05; // ±5% per condition level
  
  return Math.max(0, Math.min(1, baseDepreciation + conditionAdjustment));
}

/**
 * Calculate renovation boost factor
 * Returns multiplier (1.0 = no boost, up to 1.3 for recent major renovations)
 */
export function calculateRenovationBoost(
  yearBuilt?: number,
  renovationYear?: number
): number {
  if (!renovationYear || !yearBuilt || renovationYear <= yearBuilt) return 1.0;
  
  const currentYear = new Date().getFullYear();
  const yearsSinceRenovation = currentYear - renovationYear;
  
  // Recent renovations have more impact
  if (yearsSinceRenovation <= 5) return 1.3;
  if (yearsSinceRenovation <= 10) return 1.2;
  if (yearsSinceRenovation <= 15) return 1.1;
  
  return 1.05;
}

/**
 * Calculate location score based on distances to amenities
 * Returns a score from 0-100 (higher is better)
 */
export function calculateLocationScore(features: PropertyFeatures): number {
  const {
    distanceToSchool,
    distanceToPark,
    distanceToTransit,
    distanceToDowntown
  } = features;
  
  // If no distance data, return neutral score
  if (!distanceToSchool && !distanceToPark && !distanceToTransit && !distanceToDowntown) {
    return 50;
  }
  
  let score = 0;
  let count = 0;
  
  // Closer is better - convert distance to score (0-25 points each)
  if (distanceToSchool !== undefined) {
    score += Math.max(0, 25 - (distanceToSchool * 5));
    count++;
  }
  if (distanceToPark !== undefined) {
    score += Math.max(0, 25 - (distanceToPark * 5));
    count++;
  }
  if (distanceToTransit !== undefined) {
    score += Math.max(0, 25 - (distanceToTransit * 5));
    count++;
  }
  if (distanceToDowntown !== undefined) {
    score += Math.max(0, 25 - (distanceToDowntown * 2.5));
    count++;
  }
  
  return count > 0 ? score / count * 4 : 50; // Normalize to 0-100
}

/**
 * Calculate amenity score combining walkability and location
 */
export function calculateAmenityScore(features: PropertyFeatures): number {
  const locationScore = calculateLocationScore(features);
  const walkScore = features.walkabilityScore || 50;
  
  // Weighted average: 60% location, 40% walkability
  return (locationScore * 0.6) + (walkScore * 0.4);
}

/**
 * Calculate interaction term: square footage × quality
 */
export function calculateSqftXQuality(
  squareFeet?: number,
  quality?: string
): number | undefined {
  if (!squareFeet) return undefined;
  const qualityScore = encodeQuality(quality);
  return squareFeet * qualityScore;
}

/**
 * Calculate interaction term: age × condition
 */
export function calculateAgeXCondition(
  yearBuilt?: number,
  condition?: string
): number | undefined {
  const age = calculatePropertyAge(yearBuilt);
  if (!age) return undefined;
  const conditionScore = encodeCondition(condition);
  return age * conditionScore;
}

/**
 * Engineer all features from raw property data
 */
export function engineerFeatures(property: PropertyFeatures): EngineerEdFeatures {
  const propertyAge = calculatePropertyAge(property.yearBuilt);
  const effectiveAge = calculateEffectiveAge(property.yearBuilt, property.renovationYear);
  
  return {
    ...property,
    // Derived features
    propertyAge,
    effectiveAge,
    pricePerSqFt: calculatePricePerSqFt(property.totalValue, property.squareFeet),
    landToTotalRatio: calculateLandToTotalRatio(property.landValue, property.totalValue),
    buildingToLandRatio: calculateBuildingToLandRatio(property.buildingValue, property.landValue),
    lotSizeToSqFtRatio: calculateLotSizeToSqFtRatio(property.lotSize, property.squareFeet),
    basementRatio: calculateBasementRatio(property.basementSqFt, property.squareFeet),
    
    // Encoded features
    qualityScore: encodeQuality(property.quality),
    conditionScore: encodeCondition(property.condition),
    propertyTypeEncoded: encodePropertyType(property.propertyType),
    
    // Interaction terms
    sqftXQuality: calculateSqftXQuality(property.squareFeet, property.quality),
    ageXCondition: calculateAgeXCondition(property.yearBuilt, property.condition),
    locationScore: calculateLocationScore(property),
    amenityScore: calculateAmenityScore(property),
    
    // Depreciation factors
    depreciationFactor: calculateDepreciationFactor(propertyAge, property.condition),
    renovationBoost: calculateRenovationBoost(property.yearBuilt, property.renovationYear),
  };
}

/**
 * Get feature importance rankings (for display purposes)
 */
export function getFeatureImportanceRankings(): Array<{
  feature: string;
  displayName: string;
  category: string;
  description: string;
}> {
  return [
    { feature: 'squareFeet', displayName: 'Square Footage', category: 'Size', description: 'Total living area in square feet' },
    { feature: 'locationScore', displayName: 'Location Score', category: 'Location', description: 'Proximity to amenities and services' },
    { feature: 'qualityScore', displayName: 'Construction Quality', category: 'Quality', description: 'Overall construction quality rating' },
    { feature: 'effectiveAge', displayName: 'Effective Age', category: 'Age', description: 'Age adjusted for renovations' },
    { feature: 'conditionScore', displayName: 'Property Condition', category: 'Condition', description: 'Current maintenance condition' },
    { feature: 'landValue', displayName: 'Land Value', category: 'Value', description: 'Assessed land value' },
    { feature: 'lotSize', displayName: 'Lot Size', category: 'Size', description: 'Total lot size in square feet' },
    { feature: 'neighborhoodClusterId', displayName: 'Neighborhood', category: 'Location', description: 'Neighborhood cluster classification' },
    { feature: 'walkabilityScore', displayName: 'Walkability', category: 'Location', description: 'Walkability score (0-100)' },
    { feature: 'renovationBoost', displayName: 'Renovation Impact', category: 'Improvements', description: 'Value boost from recent renovations' },
    { feature: 'bedrooms', displayName: 'Bedrooms', category: 'Size', description: 'Number of bedrooms' },
    { feature: 'bathrooms', displayName: 'Bathrooms', category: 'Size', description: 'Number of bathrooms' },
    { feature: 'basementRatio', displayName: 'Basement Ratio', category: 'Size', description: 'Basement as % of total square footage' },
    { feature: 'pricePerSqFt', displayName: 'Price per Sq Ft', category: 'Value', description: 'Value per square foot' },
    { feature: 'amenityScore', displayName: 'Amenity Score', category: 'Location', description: 'Combined walkability and location score' },
  ];
}
