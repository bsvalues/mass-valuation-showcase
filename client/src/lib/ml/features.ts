/**
 * Feature Engineering for Automated Valuation Models (AVMs)
 * 
 * TerraForge ML Pipeline
 * TerraFusion Elite Protocol - Evidence-Based Implementation
 * 
 * Features:
 * - Feature extraction from parcel data
 * - Normalization and scaling
 * - One-hot encoding for categorical variables
 * - Missing value imputation
 * - Outlier handling (Winsorization)
 */

import type { Parcel } from '../../../../drizzle/schema';

export interface FeatureVector {
  features: number[];
  featureNames: string[];
  target?: number;
}

export interface FeatureStats {
  min: number;
  max: number;
  mean: number;
  median: number;
  std: number;
}

export interface FeatureConfig {
  numericalFeatures: string[];
  categoricalFeatures: string[];
  targetFeature: string;
}

/**
 * Default feature configuration for property valuation
 */
export const DEFAULT_FEATURE_CONFIG: FeatureConfig = {
  numericalFeatures: [
    'squareFeet',
    'yearBuilt',
    'landValue',
    'buildingValue',
  ],
  categoricalFeatures: [
    'propertyType',
    'neighborhood',
  ],
  targetFeature: 'totalValue',
};

/**
 * Extract features from parcel data
 */
export function extractFeatures(
  parcels: Parcel[],
  config: FeatureConfig = DEFAULT_FEATURE_CONFIG
): FeatureVector[] {
  const featureVectors: FeatureVector[] = [];
  const featureNames: string[] = [];

  // Build feature names list
  featureNames.push(...config.numericalFeatures);

  // Get unique values for categorical features (for one-hot encoding)
  const categoricalValues: Record<string, Set<string>> = {};
  config.categoricalFeatures.forEach(feature => {
    categoricalValues[feature] = new Set();
    parcels.forEach(parcel => {
      const value = (parcel as any)[feature];
      if (value) {
        categoricalValues[feature].add(value.toString());
      }
    });
  });

  // Add one-hot encoded feature names
  config.categoricalFeatures.forEach(feature => {
    const values = Array.from(categoricalValues[feature]).sort();
    values.forEach(value => {
      featureNames.push(`${feature}_${value}`);
    });
  });

  // Extract features for each parcel
  parcels.forEach(parcel => {
    const features: number[] = [];

    // Add numerical features
    config.numericalFeatures.forEach(feature => {
      const value = (parcel as any)[feature];
      features.push(value !== null && value !== undefined ? Number(value) : 0);
    });

    // Add one-hot encoded categorical features
    config.categoricalFeatures.forEach(feature => {
      const parcelValue = (parcel as any)[feature]?.toString() || '';
      const values = Array.from(categoricalValues[feature]).sort();
      values.forEach(value => {
        features.push(parcelValue === value ? 1 : 0);
      });
    });

    // Extract target value
    const target = (parcel as any)[config.targetFeature];

    featureVectors.push({
      features,
      featureNames,
      target: target !== null && target !== undefined ? Number(target) : undefined,
    });
  });

  return featureVectors;
}

/**
 * Calculate feature statistics
 */
export function calculateFeatureStats(vectors: FeatureVector[]): FeatureStats[] {
  if (vectors.length === 0) return [];

  const numFeatures = vectors[0].features.length;
  const stats: FeatureStats[] = [];

  for (let i = 0; i < numFeatures; i++) {
    const values = vectors.map(v => v.features[i]).filter(v => !isNaN(v));
    
    if (values.length === 0) {
      stats.push({ min: 0, max: 0, mean: 0, median: 0, std: 0 });
      continue;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);

    stats.push({ min, max, mean, median, std });
  }

  return stats;
}

/**
 * Normalize features using min-max scaling to [0, 1]
 */
export function normalizeFeatures(
  vectors: FeatureVector[],
  stats?: FeatureStats[]
): { normalized: FeatureVector[]; stats: FeatureStats[] } {
  if (vectors.length === 0) {
    return { normalized: [], stats: [] };
  }

  const featureStats = stats || calculateFeatureStats(vectors);
  const normalized: FeatureVector[] = [];

  vectors.forEach(vector => {
    const normalizedFeatures = vector.features.map((value, i) => {
      const { min, max } = featureStats[i];
      if (max === min) return 0; // Avoid division by zero
      return (value - min) / (max - min);
    });

    normalized.push({
      ...vector,
      features: normalizedFeatures,
    });
  });

  return { normalized, stats: featureStats };
}

/**
 * Denormalize a single prediction back to original scale
 */
export function denormalizePrediction(
  normalizedValue: number,
  targetStats: FeatureStats
): number {
  const { min, max } = targetStats;
  return normalizedValue * (max - min) + min;
}

/**
 * Split data into training and test sets
 */
export function trainTestSplit(
  vectors: FeatureVector[],
  testSize: number = 0.2,
  shuffle: boolean = true
): { train: FeatureVector[]; test: FeatureVector[] } {
  let data = [...vectors];

  if (shuffle) {
    // Fisher-Yates shuffle
    for (let i = data.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [data[i], data[j]] = [data[j], data[i]];
    }
  }

  const splitIndex = Math.floor(data.length * (1 - testSize));
  const train = data.slice(0, splitIndex);
  const test = data.slice(splitIndex);

  return { train, test };
}

/**
 * Handle outliers using Winsorization (clip to 1st and 99th percentiles)
 */
export function winsorizeFeatures(vectors: FeatureVector[]): FeatureVector[] {
  if (vectors.length === 0) return [];

  const numFeatures = vectors[0].features.length;
  const winsorized: FeatureVector[] = [];

  // Calculate percentiles for each feature
  const percentiles: Array<{ p1: number; p99: number }> = [];
  for (let i = 0; i < numFeatures; i++) {
    const values = vectors.map(v => v.features[i]).sort((a, b) => a - b);
    const p1Index = Math.floor(values.length * 0.01);
    const p99Index = Math.floor(values.length * 0.99);
    percentiles.push({
      p1: values[p1Index],
      p99: values[p99Index],
    });
  }

  // Clip values to percentiles
  vectors.forEach(vector => {
    const clippedFeatures = vector.features.map((value, i) => {
      const { p1, p99 } = percentiles[i];
      return Math.max(p1, Math.min(p99, value));
    });

    winsorized.push({
      ...vector,
      features: clippedFeatures,
    });
  });

  return winsorized;
}

/**
 * Impute missing values with median
 */
export function imputeMissingValues(vectors: FeatureVector[]): FeatureVector[] {
  if (vectors.length === 0) return [];

  const numFeatures = vectors[0].features.length;
  const medians: number[] = [];

  // Calculate median for each feature
  for (let i = 0; i < numFeatures; i++) {
    const values = vectors
      .map(v => v.features[i])
      .filter(v => !isNaN(v) && v !== null && v !== undefined)
      .sort((a, b) => a - b);
    
    medians.push(values.length > 0 ? values[Math.floor(values.length / 2)] : 0);
  }

  // Replace missing values with median
  const imputed: FeatureVector[] = vectors.map(vector => ({
    ...vector,
    features: vector.features.map((value, i) => 
      isNaN(value) || value === null || value === undefined ? medians[i] : value
    ),
  }));

  return imputed;
}

/**
 * Full preprocessing pipeline
 */
export function preprocessData(
  parcels: Parcel[],
  config: FeatureConfig = DEFAULT_FEATURE_CONFIG
): {
  vectors: FeatureVector[];
  stats: FeatureStats[];
  targetStats: FeatureStats;
} {
  // Extract features
  let vectors = extractFeatures(parcels, config);

  // Impute missing values
  vectors = imputeMissingValues(vectors);

  // Handle outliers
  vectors = winsorizeFeatures(vectors);

  // Normalize features
  const { normalized, stats } = normalizeFeatures(vectors);

  // Calculate target statistics (for denormalization later)
  const targetValues = vectors
    .map(v => v.target)
    .filter(t => t !== undefined && !isNaN(t)) as number[];
  
  const sortedTargets = [...targetValues].sort((a, b) => a - b);
  const targetStats: FeatureStats = {
    min: sortedTargets[0] || 0,
    max: sortedTargets[sortedTargets.length - 1] || 0,
    mean: targetValues.reduce((sum, v) => sum + v, 0) / targetValues.length || 0,
    median: sortedTargets[Math.floor(sortedTargets.length / 2)] || 0,
    std: Math.sqrt(
      targetValues.reduce((sum, v) => sum + Math.pow(v - (targetStats?.mean || 0), 2), 0) / targetValues.length
    ) || 0,
  };

  return { vectors: normalized, stats, targetStats };
}
