import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

/**
 * GIS Spatial Analysis Router
 * 
 * Provides advanced GIS functionality for mass appraisal:
 * - Buffer zone analysis
 * - Proximity calculations
 * - Spatial statistics
 * - Location factor adjustments
 * - Accessibility scoring
 */

// Helper: Calculate Haversine distance in miles
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Helper: Generate buffer zone polygon points (circle approximation)
function generateBufferZone(lat: number, lon: number, radiusMiles: number, points: number = 32): Array<[number, number]> {
  const R = 3959; // Earth radius in miles
  const coordinates: Array<[number, number]> = [];
  
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    
    // Calculate point on circle
    const dx = radiusMiles * Math.cos(angle);
    const dy = radiusMiles * Math.sin(angle);
    
    // Convert to lat/lon
    const newLat = lat + (dy / R) * (180 / Math.PI);
    const newLon = lon + (dx / R) * (180 / Math.PI) / Math.cos(lat * Math.PI / 180);
    
    coordinates.push([newLon, newLat]);
  }
  
  return coordinates;
}

// Helper: Calculate location factor based on proximity to amenities
function calculateLocationFactor(distances: {
  school?: number;
  park?: number;
  commercial?: number;
  highway?: number;
  transit?: number;
}): number {
  let factor = 1.0;
  
  // School proximity (optimal: 0.3-0.8 miles)
  if (distances.school !== undefined) {
    if (distances.school < 0.3) factor *= 0.95; // Too close (noise)
    else if (distances.school <= 0.8) factor *= 1.08; // Optimal
    else if (distances.school <= 1.5) factor *= 1.02; // Good
    else factor *= 0.98; // Far
  }
  
  // Park proximity (optimal: < 0.5 miles)
  if (distances.park !== undefined) {
    if (distances.park <= 0.5) factor *= 1.05;
    else if (distances.park <= 1.0) factor *= 1.02;
  }
  
  // Commercial proximity (optimal: 0.5-2.0 miles)
  if (distances.commercial !== undefined) {
    if (distances.commercial < 0.5) factor *= 0.95; // Too close (noise, traffic)
    else if (distances.commercial <= 2.0) factor *= 1.06; // Optimal
    else factor *= 0.99; // Far
  }
  
  // Highway proximity (negative if too close)
  if (distances.highway !== undefined) {
    if (distances.highway < 0.25) factor *= 0.85; // Too close (noise, pollution)
    else if (distances.highway <= 0.5) factor *= 0.92;
    else if (distances.highway <= 2.0) factor *= 1.03; // Good access
  }
  
  // Transit proximity (optimal: < 0.5 miles)
  if (distances.transit !== undefined) {
    if (distances.transit <= 0.5) factor *= 1.07;
    else if (distances.transit <= 1.0) factor *= 1.03;
  }
  
  return factor;
}

// Helper: Calculate accessibility score (0-100)
function calculateAccessibilityScore(distances: {
  school?: number;
  park?: number;
  commercial?: number;
  highway?: number;
  transit?: number;
  hospital?: number;
}): number {
  let score = 50; // Base score
  
  // School access (max +15 points)
  if (distances.school !== undefined) {
    if (distances.school <= 0.5) score += 15;
    else if (distances.school <= 1.0) score += 10;
    else if (distances.school <= 2.0) score += 5;
  }
  
  // Park access (max +10 points)
  if (distances.park !== undefined) {
    if (distances.park <= 0.3) score += 10;
    else if (distances.park <= 0.7) score += 7;
    else if (distances.park <= 1.5) score += 3;
  }
  
  // Commercial access (max +10 points)
  if (distances.commercial !== undefined) {
    if (distances.commercial <= 1.0) score += 10;
    else if (distances.commercial <= 2.0) score += 7;
    else if (distances.commercial <= 3.0) score += 3;
  }
  
  // Highway access (max +10 points, penalty if too close)
  if (distances.highway !== undefined) {
    if (distances.highway < 0.2) score -= 10; // Too close
    else if (distances.highway <= 0.5) score -= 5;
    else if (distances.highway <= 2.0) score += 10; // Good access
    else if (distances.highway <= 5.0) score += 5;
  }
  
  // Transit access (max +10 points)
  if (distances.transit !== undefined) {
    if (distances.transit <= 0.3) score += 10;
    else if (distances.transit <= 0.7) score += 7;
    else if (distances.transit <= 1.5) score += 3;
  }
  
  // Hospital access (max +5 points)
  if (distances.hospital !== undefined) {
    if (distances.hospital <= 2.0) score += 5;
    else if (distances.hospital <= 5.0) score += 3;
  }
  
  // Clamp to 0-100
  return Math.max(0, Math.min(100, score));
}

export const gisRouter = router({
  /**
   * Generate buffer zone polygon around a point
   * Returns GeoJSON polygon for map visualization
   */
  generateBufferZone: protectedProcedure
    .input(z.object({
      latitude: z.number(),
      longitude: z.number(),
      radiusMiles: z.number().min(0.01).max(50),
      points: z.number().min(8).max(64).default(32),
    }))
    .query(({ input }) => {
      const coordinates = generateBufferZone(
        input.latitude,
        input.longitude,
        input.radiusMiles,
        input.points
      );
      
      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Polygon' as const,
          coordinates: [coordinates],
        },
        properties: {
          radiusMiles: input.radiusMiles,
          center: [input.longitude, input.latitude],
        },
      };
    }),

  /**
   * Calculate proximity to multiple amenity types
   * Returns distances and location factor adjustment
   */
  calculateProximityFactors: protectedProcedure
    .input(z.object({
      latitude: z.number(),
      longitude: z.number(),
      amenities: z.array(z.object({
        type: z.enum(['school', 'park', 'commercial', 'highway', 'transit', 'hospital']),
        latitude: z.number(),
        longitude: z.number(),
        name: z.string().optional(),
      })),
    }))
    .query(({ input }) => {
      // Calculate distance to nearest amenity of each type
      const distances: Record<string, number> = {};
      const nearestAmenities: Record<string, any> = {};
      
      for (const amenity of input.amenities) {
        const distance = calculateDistance(
          input.latitude,
          input.longitude,
          amenity.latitude,
          amenity.longitude
        );
        
        if (!distances[amenity.type] || distance < distances[amenity.type]) {
          distances[amenity.type] = distance;
          nearestAmenities[amenity.type] = {
            ...amenity,
            distance,
          };
        }
      }
      
      // Calculate location factor and accessibility score
      const locationFactor = calculateLocationFactor(distances);
      const accessibilityScore = calculateAccessibilityScore(distances);
      
      return {
        distances,
        nearestAmenities,
        locationFactor,
        accessibilityScore,
        adjustmentPercent: ((locationFactor - 1.0) * 100).toFixed(2),
      };
    }),

  /**
   * Perform spatial statistics on properties within area
   * Returns Moran's I, hot spots, and clustering metrics
   */
  calculateSpatialStatistics: protectedProcedure
    .input(z.object({
      properties: z.array(z.object({
        id: z.number(),
        latitude: z.number(),
        longitude: z.number(),
        value: z.number(),
      })),
      distanceThreshold: z.number().default(1.0), // miles
    }))
    .query(({ input }) => {
      const { properties, distanceThreshold } = input;
      const n = properties.length;
      
      if (n < 3) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Need at least 3 properties for spatial statistics',
        });
      }
      
      // Calculate mean value
      const meanValue = properties.reduce((sum, p) => sum + p.value, 0) / n;
      
      // Build spatial weights matrix (distance-based)
      const weights: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
      let totalWeight = 0;
      
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (i !== j) {
            const distance = calculateDistance(
              properties[i].latitude,
              properties[i].longitude,
              properties[j].latitude,
              properties[j].longitude
            );
            
            if (distance <= distanceThreshold) {
              weights[i][j] = 1 / distance; // Inverse distance weighting
              totalWeight += weights[i][j];
            }
          }
        }
      }
      
      // Normalize weights
      if (totalWeight > 0) {
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            weights[i][j] /= totalWeight;
          }
        }
      }
      
      // Calculate Moran's I (spatial autocorrelation)
      let numerator = 0;
      let denominator = 0;
      
      for (let i = 0; i < n; i++) {
        const deviationI = properties[i].value - meanValue;
        denominator += deviationI * deviationI;
        
        for (let j = 0; j < n; j++) {
          const deviationJ = properties[j].value - meanValue;
          numerator += weights[i][j] * deviationI * deviationJ;
        }
      }
      
      const moransI = (n / totalWeight) * (numerator / denominator);
      
      // Calculate local Moran's I for each property (hot spot analysis)
      const localMorans = properties.map((prop, i) => {
        const deviationI = prop.value - meanValue;
        let localSum = 0;
        
        for (let j = 0; j < n; j++) {
          const deviationJ = properties[j].value - meanValue;
          localSum += weights[i][j] * deviationJ;
        }
        
        const localI = deviationI * localSum;
        
        return {
          id: prop.id,
          localMoransI: localI,
          isHotSpot: localI > 0 && deviationI > 0, // High value, high neighbors
          isColdSpot: localI > 0 && deviationI < 0, // Low value, low neighbors
          isOutlier: localI < 0, // Different from neighbors
        };
      });
      
      // Interpretation
      let interpretation = '';
      if (moransI > 0.3) interpretation = 'Strong positive spatial autocorrelation (clustered values)';
      else if (moransI > 0.1) interpretation = 'Moderate positive spatial autocorrelation';
      else if (moransI > -0.1) interpretation = 'Random spatial distribution';
      else if (moransI > -0.3) interpretation = 'Moderate negative spatial autocorrelation';
      else interpretation = 'Strong negative spatial autocorrelation (dispersed values)';
      
      return {
        moransI,
        interpretation,
        meanValue,
        propertyCount: n,
        distanceThreshold,
        localMorans,
        hotSpots: localMorans.filter(m => m.isHotSpot),
        coldSpots: localMorans.filter(m => m.isColdSpot),
        outliers: localMorans.filter(m => m.isOutlier),
      };
    }),

  /**
   * Calculate market area boundaries using Voronoi/Thiessen polygons
   * Useful for delineating comparable sales areas
   */
  calculateMarketAreas: protectedProcedure
    .input(z.object({
      properties: z.array(z.object({
        id: z.number(),
        latitude: z.number(),
        longitude: z.number(),
        value: z.number(),
      })),
      bounds: z.object({
        minLat: z.number(),
        maxLat: z.number(),
        minLon: z.number(),
        maxLon: z.number(),
      }),
    }))
    .query(({ input }) => {
      // Simplified Voronoi: assign grid points to nearest property
      const gridSize = 20;
      const { minLat, maxLat, minLon, maxLon } = input.bounds;
      const latStep = (maxLat - minLat) / gridSize;
      const lonStep = (maxLon - minLon) / gridSize;
      
      const marketAreas: Record<number, Array<[number, number]>> = {};
      
      for (let i = 0; i <= gridSize; i++) {
        for (let j = 0; j <= gridSize; j++) {
          const lat = minLat + i * latStep;
          const lon = minLon + j * lonStep;
          
          // Find nearest property
          let nearestId = input.properties[0].id;
          let minDistance = Infinity;
          
          for (const prop of input.properties) {
            const distance = calculateDistance(lat, lon, prop.latitude, prop.longitude);
            if (distance < minDistance) {
              minDistance = distance;
              nearestId = prop.id;
            }
          }
          
          if (!marketAreas[nearestId]) {
            marketAreas[nearestId] = [];
          }
          marketAreas[nearestId].push([lon, lat]);
        }
      }
      
      return {
        marketAreas,
        propertyCount: input.properties.length,
        gridSize,
      };
    }),

  /**
   * Perform overlay analysis (intersection of multiple layers)
   * Example: Find properties in flood zone AND high-value zone
   */
  performOverlayAnalysis: protectedProcedure
    .input(z.object({
      properties: z.array(z.object({
        id: z.number(),
        latitude: z.number(),
        longitude: z.number(),
        value: z.number(),
      })),
      layers: z.array(z.object({
        name: z.string(),
        type: z.enum(['circle', 'polygon']),
        // For circle: center + radius
        centerLat: z.number().optional(),
        centerLon: z.number().optional(),
        radiusMiles: z.number().optional(),
        // For polygon: array of [lon, lat] coordinates
        coordinates: z.array(z.array(z.number())).optional(),
      })),
    }))
    .query(({ input }) => {
      const results = input.properties.map(prop => {
        const layerMatches: string[] = [];
        
        for (const layer of input.layers) {
          let isInLayer = false;
          
          if (layer.type === 'circle' && layer.centerLat && layer.centerLon && layer.radiusMiles) {
            const distance = calculateDistance(
              prop.latitude,
              prop.longitude,
              layer.centerLat,
              layer.centerLon
            );
            isInLayer = distance <= layer.radiusMiles;
          } else if (layer.type === 'polygon' && layer.coordinates) {
            // Simplified point-in-polygon (ray casting algorithm)
            // For production, use a proper GIS library
            isInLayer = false; // Placeholder
          }
          
          if (isInLayer) {
            layerMatches.push(layer.name);
          }
        }
        
        return {
          id: prop.id,
          latitude: prop.latitude,
          longitude: prop.longitude,
          value: prop.value,
          layerMatches,
          matchCount: layerMatches.length,
        };
      });
      
      return {
        results,
        totalProperties: input.properties.length,
        layerCount: input.layers.length,
        propertiesInAllLayers: results.filter(r => r.matchCount === input.layers.length).length,
        propertiesInAnyLayer: results.filter(r => r.matchCount > 0).length,
      };
    }),
});
