import { publicProcedure, router } from "./_core/trpc";
import { readFileSync } from "fs";
import { join } from "path";

// Helper to load GeoJSON files
function loadGeoJSON(filename: string) {
  try {
    const filePath = join(process.cwd(), "server", "data", filename);
    const data = readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    return { type: "FeatureCollection", features: [] };
  }
}

export const layerDataRouter = router({
  /**
   * Get zoning districts GeoJSON data
   */
  getZoningDistricts: publicProcedure.query(() => {
    return loadGeoJSON("zoning-districts.json");
  }),

  /**
   * Get school districts GeoJSON data
   */
  getSchoolDistricts: publicProcedure.query(() => {
    return loadGeoJSON("school-districts.json");
  }),

  /**
   * Get flood zones GeoJSON data
   */
  getFloodZones: publicProcedure.query(() => {
    return loadGeoJSON("flood-zones.json");
  }),

  /**
   * Get transit routes GeoJSON data
   */
  getTransitRoutes: publicProcedure.query(() => {
    return loadGeoJSON("transit-routes.json");
  }),

  /**
   * Get parks and recreation GeoJSON data
   */
  getParksRecreation: publicProcedure.query(() => {
    return loadGeoJSON("parks-recreation.json");
  }),

  /**
   * Get utility lines GeoJSON data
   */
  getUtilityLines: publicProcedure.query(() => {
    return loadGeoJSON("utility-lines.json");
  }),
});
