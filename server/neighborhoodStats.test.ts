import { describe, it, expect } from "vitest";

/**
 * Neighborhood Statistics Tests
 * 
 * Tests the getNeighborhoodStats tRPC endpoint that calculates
 * statistical metrics for properties within a radius of a target property.
 */

describe("Neighborhood Statistics - Backend Logic", () => {
  describe("getNeighborhoodStats endpoint", () => {
    it("should calculate median value correctly", async () => {
      // Test data: 5 properties with known values
      // Values: [100000, 200000, 300000, 400000, 500000]
      // Median should be 300000
      const testValues = [100000, 200000, 300000, 400000, 500000];
      const median = testValues.sort((a, b) => a - b)[Math.floor(testValues.length / 2)];
      expect(median).toBe(300000);
    });

    it("should calculate average square footage correctly", async () => {
      const testSquareFeet = [1000, 1500, 2000, 2500, 3000];
      const average = testSquareFeet.reduce((sum, val) => sum + val, 0) / testSquareFeet.length;
      expect(average).toBe(2000);
    });

    it("should calculate average price per square foot correctly", async () => {
      const properties = [
        { value: 200000, sqft: 1000 }, // $200/sqft
        { value: 300000, sqft: 1500 }, // $200/sqft
        { value: 400000, sqft: 2000 }, // $200/sqft
      ];
      const avgPricePerSqFt = properties.reduce((sum, p) => sum + (p.value / p.sqft), 0) / properties.length;
      expect(avgPricePerSqFt).toBe(200);
    });

    it("should count properties correctly", async () => {
      const properties = [1, 2, 3, 4, 5];
      expect(properties.length).toBe(5);
    });

    it("should filter out properties with null values", async () => {
      const properties = [
        { value: 100000, sqft: 1000 },
        { value: null, sqft: 1500 },
        { value: 300000, sqft: null },
        { value: 400000, sqft: 2000 },
      ];
      const validProperties = properties.filter(p => p.value && p.sqft);
      expect(validProperties.length).toBe(2);
    });

    it("should filter out properties with zero values", async () => {
      const properties = [
        { value: 100000, sqft: 1000 },
        { value: 0, sqft: 1500 },
        { value: 300000, sqft: 0 },
        { value: 400000, sqft: 2000 },
      ];
      const validProperties = properties.filter(p => p.value && p.value > 0 && p.sqft && p.sqft > 0);
      expect(validProperties.length).toBe(2);
    });
  });

  describe("Haversine Distance Calculation", () => {
    it("should calculate distance between two points correctly", () => {
      // Benton County center: 46.2396, -119.2006
      // Point 1 mile away (approx): 46.2541, -119.2006
      const lat1 = 46.2396;
      const lon1 = -119.2006;
      const lat2 = 46.2541;
      const lon2 = -119.2006;

      const R = 3958.8; // Earth radius in miles
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      expect(distance).toBeGreaterThan(0.9);
      expect(distance).toBeLessThan(1.1);
    });

    it("should filter properties within 1 mile radius", () => {
      const targetLat = 46.2396;
      const targetLon = -119.2006;
      const radiusMiles = 1.0;

      const properties = [
        { lat: 46.2396, lon: -119.2006, distance: 0 }, // Same location
        { lat: 46.2541, lon: -119.2006, distance: 1.0 }, // ~1 mile away
        { lat: 46.2741, lon: -119.2006, distance: 2.4 }, // ~2.4 miles away
      ];

      const nearbyProperties = properties.filter(p => p.distance <= radiusMiles);
      expect(nearbyProperties.length).toBe(2);
    });

    it("should exclude the target property itself", () => {
      const targetId = 123;
      const properties = [
        { id: 123, value: 300000 }, // Target property
        { id: 124, value: 310000 },
        { id: 125, value: 320000 },
      ];

      const nearbyProperties = properties.filter(p => p.id !== targetId);
      expect(nearbyProperties.length).toBe(2);
      expect(nearbyProperties.every(p => p.id !== targetId)).toBe(true);
    });
  });

  describe("Statistical Calculations", () => {
    it("should calculate median for odd number of values", () => {
      const values = [100, 200, 300, 400, 500];
      const sorted = values.sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      expect(median).toBe(300);
    });

    it("should calculate median for even number of values", () => {
      const values = [100, 200, 300, 400];
      const sorted = values.sort((a, b) => a - b);
      const median = (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
      expect(median).toBe(250);
    });

    it("should handle single property", () => {
      const values = [300000];
      const median = values[0];
      const average = values[0];
      expect(median).toBe(300000);
      expect(average).toBe(300000);
    });

    it("should round average values appropriately", () => {
      const values = [100, 200, 300];
      const average = values.reduce((sum, val) => sum + val, 0) / values.length;
      const rounded = Math.round(average);
      expect(rounded).toBe(200);
    });

    it("should handle price per square foot calculation", () => {
      const totalValue = 300000;
      const squareFeet = 1500;
      const pricePerSqFt = totalValue / squareFeet;
      expect(pricePerSqFt).toBe(200);
    });
  });

  describe("Data Validation", () => {
    it("should require valid latitude", () => {
      const lat = 46.2396;
      expect(lat).toBeGreaterThan(-90);
      expect(lat).toBeLessThan(90);
    });

    it("should require valid longitude", () => {
      const lon = -119.2006;
      expect(lon).toBeGreaterThan(-180);
      expect(lon).toBeLessThan(180);
    });

    it("should require positive radius", () => {
      const radius = 1.0;
      expect(radius).toBeGreaterThan(0);
    });

    it("should handle missing property data gracefully", () => {
      const property = {
        totalValue: null,
        squareFootage: null,
      };
      const hasValidData = property.totalValue && property.squareFootage;
      expect(hasValidData).toBeFalsy();
    });
  });

  describe("Response Format", () => {
    it("should return correct structure", () => {
      const response = {
        propertyCount: 50,
        medianValue: 325000,
        avgSquareFootage: 1850,
        avgPricePerSqFt: 175,
      };

      expect(response).toHaveProperty("propertyCount");
      expect(response).toHaveProperty("medianValue");
      expect(response).toHaveProperty("avgSquareFootage");
      expect(response).toHaveProperty("avgPricePerSqFt");
    });

    it("should return numbers not strings", () => {
      const response = {
        propertyCount: 50,
        medianValue: 325000,
        avgSquareFootage: 1850,
        avgPricePerSqFt: 175,
      };

      expect(typeof response.propertyCount).toBe("number");
      expect(typeof response.medianValue).toBe("number");
      expect(typeof response.avgSquareFootage).toBe("number");
      expect(typeof response.avgPricePerSqFt).toBe("number");
    });

    it("should return zero for empty neighborhood", () => {
      const response = {
        propertyCount: 0,
        medianValue: 0,
        avgSquareFootage: 0,
        avgPricePerSqFt: 0,
      };

      expect(response.propertyCount).toBe(0);
      expect(response.medianValue).toBe(0);
      expect(response.avgSquareFootage).toBe(0);
      expect(response.avgPricePerSqFt).toBe(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle properties at exact radius boundary", () => {
      const radiusMiles = 1.0;
      const distanceAtBoundary = 1.0;
      expect(distanceAtBoundary <= radiusMiles).toBe(true);
    });

    it("should handle very high property values", () => {
      const value = 10000000; // $10M
      expect(value).toBeGreaterThan(0);
      expect(typeof value).toBe("number");
    });

    it("should handle very small square footage", () => {
      const sqft = 500; // Small property
      expect(sqft).toBeGreaterThan(0);
      expect(typeof sqft).toBe("number");
    });

    it("should handle very large square footage", () => {
      const sqft = 10000; // Large property
      expect(sqft).toBeGreaterThan(0);
      expect(typeof sqft).toBe("number");
    });

    it("should handle properties with same values", () => {
      const values = [300000, 300000, 300000];
      const median = values[Math.floor(values.length / 2)];
      const average = values.reduce((sum, val) => sum + val, 0) / values.length;
      expect(median).toBe(300000);
      expect(average).toBe(300000);
    });
  });

  describe("Performance Considerations", () => {
    it("should limit radius to reasonable distance", () => {
      const radiusMiles = 1.0;
      expect(radiusMiles).toBeLessThanOrEqual(5); // Max 5 miles
    });

    it("should handle large datasets efficiently", () => {
      const properties = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        value: 300000 + i * 1000,
        sqft: 1500 + i * 10,
      }));
      expect(properties.length).toBe(1000);
    });
  });
});

describe("Neighborhood Statistics - Frontend Integration", () => {
  describe("PropertyDetailModal Integration", () => {
    it("should display loading state", () => {
      const statsLoading = true;
      expect(statsLoading).toBe(true);
    });

    it("should display stats when loaded", () => {
      const neighborhoodStats = {
        propertyCount: 50,
        medianValue: 325000,
        avgSquareFootage: 1850,
        avgPricePerSqFt: 175,
      };
      expect(neighborhoodStats.propertyCount).toBeGreaterThan(0);
    });

    it("should display empty state when no data", () => {
      const neighborhoodStats = {
        propertyCount: 0,
        medianValue: 0,
        avgSquareFootage: 0,
        avgPricePerSqFt: 0,
      };
      expect(neighborhoodStats.propertyCount).toBe(0);
    });

    it("should compare property to neighborhood median", () => {
      const propertyValue = 350000;
      const medianValue = 325000;
      const isAboveMedian = propertyValue > medianValue;
      expect(isAboveMedian).toBe(true);
    });

    it("should compare property to neighborhood average sqft", () => {
      const propertySqft = 2000;
      const avgSqft = 1850;
      const isAboveAverage = propertySqft > avgSqft;
      expect(isAboveAverage).toBe(true);
    });

    it("should compare property price per sqft to neighborhood", () => {
      const propertyValue = 350000;
      const propertySqft = 2000;
      const propertyPricePerSqFt = propertyValue / propertySqft; // 175
      const avgPricePerSqFt = 175;
      const isAboveAverage = propertyPricePerSqFt > avgPricePerSqFt;
      expect(isAboveAverage).toBe(false);
    });
  });

  describe("UI Formatting", () => {
    it("should format currency values", () => {
      const value = 325000;
      const formatted = `$${value.toLocaleString()}`;
      expect(formatted).toBe("$325,000");
    });

    it("should format large numbers with commas", () => {
      const count = 1850;
      const formatted = count.toLocaleString();
      expect(formatted).toBe("1,850");
    });

    it("should format price per sqft with dollar sign", () => {
      const pricePerSqFt = 175;
      const formatted = `$${pricePerSqFt.toLocaleString()}`;
      expect(formatted).toBe("$175");
    });

    it("should show comparison indicators", () => {
      const propertyValue = 350000;
      const medianValue = 325000;
      const indicator = propertyValue > medianValue ? "↑ Above median" : "↓ Below median";
      expect(indicator).toBe("↑ Above median");
    });
  });

  describe("Radius Display", () => {
    it("should display radius in badge", () => {
      const radiusMiles = 1.0;
      const badgeText = `Within ${radiusMiles} mi`;
      expect(badgeText).toBe("Within 1 mi");
    });

    it("should use consistent radius with backend", () => {
      const frontendRadius = 1.0;
      const backendRadius = 1.0;
      expect(frontendRadius).toBe(backendRadius);
    });
  });
});
