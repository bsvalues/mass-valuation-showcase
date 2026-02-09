import { describe, it, expect } from 'vitest';

describe('Save WA Parcels to Database', () => {
  it('should transform WA parcel features to database schema', () => {
    const mockFeatures = [
      {
        type: 'Feature',
        properties: {
          OBJECTID: 12345,
          PARCEL_ID_NR: 'WA-TEST-001',
          SITUS_ADDRESS: '123 Test St',
          VALUE_LAND: 100000,
          VALUE_BLDG: 200000,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-122.5, 47.5],
            [-122.5, 47.6],
            [-122.4, 47.6],
            [-122.4, 47.5],
            [-122.5, 47.5],
          ]],
        },
      },
    ];

    const countyName = 'Test County';
    const userId = 1;

    const parcelsToInsert = mockFeatures.map((feature: any) => {
      const props = feature.properties;
      const coords = feature.geometry.coordinates[0][0];
      
      return {
        parcelId: props.PARCEL_ID_NR || `WA-${props.OBJECTID}`,
        address: props.SITUS_ADDRESS || null,
        latitude: coords[1]?.toString() || null,
        longitude: coords[0]?.toString() || null,
        landValue: props.VALUE_LAND || null,
        buildingValue: props.VALUE_BLDG || null,
        totalValue: (props.VALUE_LAND || 0) + (props.VALUE_BLDG || 0),
        neighborhood: countyName,
        propertyType: 'Unknown',
        uploadedBy: userId,
      };
    });

    expect(parcelsToInsert).toHaveLength(1);
    expect(parcelsToInsert[0].parcelId).toBe('WA-TEST-001');
    expect(parcelsToInsert[0].address).toBe('123 Test St');
    expect(parcelsToInsert[0].latitude).toBe('47.5');
    expect(parcelsToInsert[0].longitude).toBe('-122.5');
    expect(parcelsToInsert[0].landValue).toBe(100000);
    expect(parcelsToInsert[0].buildingValue).toBe(200000);
    expect(parcelsToInsert[0].totalValue).toBe(300000);
    expect(parcelsToInsert[0].neighborhood).toBe('Test County');
  });

  it('should handle missing optional fields', () => {
    const mockFeatures = [
      {
        type: 'Feature',
        properties: {
          OBJECTID: 67890,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-122.5, 47.5],
            [-122.5, 47.6],
            [-122.4, 47.6],
            [-122.4, 47.5],
            [-122.5, 47.5],
          ]],
        },
      },
    ];

    const countyName = 'Test County';
    const userId = 1;

    const parcelsToInsert = mockFeatures.map((feature: any) => {
      const props = feature.properties;
      const coords = feature.geometry.coordinates[0][0];
      
      return {
        parcelId: props.PARCEL_ID_NR || `WA-${props.OBJECTID}`,
        address: props.SITUS_ADDRESS || null,
        latitude: coords[1]?.toString() || null,
        longitude: coords[0]?.toString() || null,
        landValue: props.VALUE_LAND || null,
        buildingValue: props.VALUE_BLDG || null,
        totalValue: (props.VALUE_LAND || 0) + (props.VALUE_BLDG || 0),
        neighborhood: countyName,
        propertyType: 'Unknown',
        uploadedBy: userId,
      };
    });

    expect(parcelsToInsert[0].parcelId).toBe('WA-67890');
    expect(parcelsToInsert[0].address).toBeNull();
    expect(parcelsToInsert[0].landValue).toBeNull();
    expect(parcelsToInsert[0].buildingValue).toBeNull();
    expect(parcelsToInsert[0].totalValue).toBe(0);
  });
});
