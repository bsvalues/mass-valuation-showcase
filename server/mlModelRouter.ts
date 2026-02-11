/**
 * ML Model tRPC Router
 * Handles model training, status checks, and predictions
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { trainModel as trainMLModel, isModelTrained, getModelMetrics } from "./mlModel";

export const mlModelRouter = router({
  /**
   * Train ML model using sales data from database
   */
  trainModel: publicProcedure
    .mutation(async () => {
      try {
        console.log('[mlModel] Starting model training...');
        const metrics = await trainMLModel();
        console.log('[mlModel] Training complete:', metrics);
        
        return {
          success: true,
          metrics,
          message: 'Model trained successfully'
        };
      } catch (error) {
        console.error('[mlModel] Training failed:', error);
        throw new Error(`Model training failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),
  
  /**
   * Get model training status and metrics
   */
  getModelStatus: publicProcedure
    .query(async () => {
      const trained = isModelTrained();
      const metrics = getModelMetrics();
      
      return {
        trained,
        metrics,
        modelPath: trained ? '/ml/model.pkl' : null
      };
    }),
});
