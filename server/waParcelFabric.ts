/**
 * WA State Parcel Fabric API Integration
 * Loads parcel geometries from Washington State Geospatial Portal
 */

import axios from 'axios';

// WA State ArcGIS REST API endpoint for parcel data
// Using Previous_Parcels (2024) as the confirmed working service
// Current_Parcels should have the same structure when available
const WA_PARCEL_SERVICE_URL = 'https://services.arcgis.com/jsIt88o09Q0r1j8h/arcgis/rest/services/Previous_Parcels/FeatureServer/0';

export interface ParcelFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][];
  };
  properties: {
    OBJECTID: number;
    PARCEL_ID_NR: string;
    COUNTY_NM: string;
    FIPS_NR: string;
    SITUS_ADDRESS?: string;
    SUB_ADDRESS?: string;
    SITUS_CITY_NM?: string;
    SITUS_ZIP_NR?: string;
    LANDUSE_CD?: number;
    VALUE_LAND?: number;
    VALUE_BLDG?: number;
    DATA_LINK?: string;
    FILE_DATE?: string;
    Shape__Area?: number;
    Shape__Length?: number;
  };
}

export interface ParcelLoadResult {
  success: boolean;
  countyName: string;
  parcelCount: number;
  features: ParcelFeature[];
  bounds?: {
    minLng: number;
    minLat: number;
    maxLng: number;
    maxLat: number;
  };
  error?: string;
}

/**
 * Load parcels for a specific WA county with pagination support
 * @param countyName - Name of the WA county
 * @param limit - Maximum number of parcels to load (use 0 for all parcels)
 * @param onProgress - Optional callback for progress updates (current, total)
 */
export async function loadWACountyParcels(
  countyName: string, 
  limit: number = 10000,
  onProgress?: (current: number, total: number) => void
): Promise<ParcelLoadResult> {
  // If limit is 0 or greater than 50000, load all parcels with pagination
  if (limit === 0 || limit > 50000) {
    return loadAllWACountyParcels(countyName, onProgress);
  }
  
  // Otherwise, single request with limit
  return loadWACountyParcelsSingle(countyName, limit);
}

/**
 * Load all parcels for a county using pagination (for 80,000+ parcel counties)
 */
async function loadAllWACountyParcels(
  countyName: string,
  onProgress?: (current: number, total: number) => void
): Promise<ParcelLoadResult> {
  const CHUNK_SIZE = 2000; // WA State API limit per request
  const allFeatures: ParcelFeature[] = [];
  let offset = 0;
  let hasMore = true;
  
  try {
    while (hasMore) {
      const params = {
        where: `COUNTY_NM = '${countyName.toUpperCase()}'`,
        outFields: '*',
        returnGeometry: 'true',
        f: 'geojson',
        resultRecordCount: CHUNK_SIZE.toString(),
        resultOffset: offset.toString(),
        orderByFields: 'OBJECTID ASC'
      };

      const response = await axios.get(`${WA_PARCEL_SERVICE_URL}/query`, {
        params,
        timeout: 60000, // Longer timeout for large requests
      });

      const geojson = response.data;
      
      if (!geojson.features || geojson.features.length === 0) {
        hasMore = false;
        break;
      }

      allFeatures.push(...geojson.features);
      offset += geojson.features.length;
      
      // Report progress
      if (onProgress) {
        onProgress(allFeatures.length, allFeatures.length + CHUNK_SIZE);
      }
      
      // If we got fewer than CHUNK_SIZE, we've reached the end
      if (geojson.features.length < CHUNK_SIZE) {
        hasMore = false;
      }
    }

    if (allFeatures.length === 0) {
      return {
        success: false,
        countyName,
        parcelCount: 0,
        features: [],
        error: `No parcels found for ${countyName}`
      };
    }

    // Calculate bounds from all features
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
    
    allFeatures.forEach((feature: any) => {
      if (feature.geometry && feature.geometry.coordinates) {
        const coords = feature.geometry.type === 'Polygon' 
          ? feature.geometry.coordinates[0] 
          : feature.geometry.coordinates[0][0];
        
        coords.forEach(([lng, lat]: [number, number]) => {
          minLng = Math.min(minLng, lng);
          minLat = Math.min(minLat, lat);
          maxLng = Math.max(maxLng, lng);
          maxLat = Math.max(maxLat, lat);
        });
      }
    });

    return {
      success: true,
      countyName,
      parcelCount: allFeatures.length,
      features: allFeatures,
      bounds: {
        minLng,
        minLat,
        maxLng,
        maxLat
      }
    };
  } catch (error: any) {
    console.error(`Error loading all parcels for ${countyName}:`, error.message);
    return {
      success: false,
      countyName,
      parcelCount: allFeatures.length, // Return what we got so far
      features: allFeatures,
      error: `Partial load: ${error.message || 'Failed to load all parcel data'}`
    };
  }
}

/**
 * Load parcels for a specific WA county (single request, no pagination)
 */
async function loadWACountyParcelsSingle(countyName: string, limit: number): Promise<ParcelLoadResult> {
  try {
    // Query parameters for ArcGIS REST API
    const params = {
      where: `COUNTY_NM = '${countyName.toUpperCase()}'`,
      outFields: '*',
      returnGeometry: 'true',
      f: 'geojson',
      resultRecordCount: limit.toString(),
      orderByFields: 'OBJECTID ASC'
    };

    const response = await axios.get(`${WA_PARCEL_SERVICE_URL}/query`, {
      params,
      timeout: 30000,
    });

    const geojson = response.data;
    
    if (!geojson.features || geojson.features.length === 0) {
      return {
        success: false,
        countyName,
        parcelCount: 0,
        features: [],
        error: `No parcels found for ${countyName}`
      };
    }

    // Calculate bounds
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
    
    geojson.features.forEach((feature: any) => {
      if (feature.geometry && feature.geometry.coordinates) {
        const coords = feature.geometry.type === 'Polygon' 
          ? feature.geometry.coordinates[0] 
          : feature.geometry.coordinates[0][0];
        
        coords.forEach(([lng, lat]: [number, number]) => {
          minLng = Math.min(minLng, lng);
          minLat = Math.min(minLat, lat);
          maxLng = Math.max(maxLng, lng);
          maxLat = Math.max(maxLat, lat);
        });
      }
    });

    return {
      success: true,
      countyName,
      parcelCount: geojson.features.length,
      features: geojson.features,
      bounds: {
        minLng,
        minLat,
        maxLng,
        maxLat
      }
    };
  } catch (error: any) {
    console.error(`Error loading parcels for ${countyName}:`, error.message);
    return {
      success: false,
      countyName,
      parcelCount: 0,
      features: [],
      error: error.message || 'Failed to load parcel data'
    };
  }
}

/**
 * Get list of available WA counties
 */
export async function getWACounties(): Promise<string[]> {
  // Washington State counties (39 total)
  return [
    'Adams', 'Asotin', 'Benton', 'Chelan', 'Clallam', 'Clark', 'Columbia',
    'Cowlitz', 'Douglas', 'Ferry', 'Franklin', 'Garfield', 'Grant', 'Grays Harbor',
    'Island', 'Jefferson', 'King', 'Kitsap', 'Kittitas', 'Klickitat', 'Lewis',
    'Lincoln', 'Mason', 'Okanogan', 'Pacific', 'Pend Oreille', 'Pierce', 'San Juan',
    'Skagit', 'Skamania', 'Snohomish', 'Spokane', 'Stevens', 'Thurston', 'Wahkiakum',
    'Walla Walla', 'Whatcom', 'Whitman', 'Yakima'
  ];
}
