/**
 * WA State Parcel Fabric API Integration
 * Loads parcel geometries from Washington State Geospatial Portal
 */

import axios from 'axios';

// WA State ArcGIS REST API endpoint for parcel data
const WA_PARCEL_SERVICE_URL = 'https://services.arcgis.com/jsIt88o09Q0r1j8h/arcgis/rest/services/Parcels_2025/FeatureServer/0';

export interface ParcelFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][];
  };
  properties: {
    OBJECTID: number;
    PARCEL_ID: string;
    COUNTY_NAME: string;
    COUNTY_FIPS: string;
    PARCEL_AREA_SQFT?: number;
    PARCEL_AREA_ACRES?: number;
    SITUS_ADDRESS?: string;
    OWNER_NAME?: string;
    ASSESSED_VALUE?: number;
    LAND_VALUE?: number;
    BUILDING_VALUE?: number;
    TAX_YEAR?: number;
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
 * Load parcels for a specific WA county
 */
export async function loadWACountyParcels(countyName: string, limit: number = 1000): Promise<ParcelLoadResult> {
  try {
    // Query parameters for ArcGIS REST API
    const params = {
      where: `COUNTY_NAME = '${countyName.toUpperCase()}'`,
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
        error: `No parcels found for ${countyName} County`
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
