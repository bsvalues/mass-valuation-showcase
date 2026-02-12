/**
 * ML Model tRPC Router
 * Handles model training, status checks, and predictions
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { trainModel as trainMLModel, isModelTrained, getModelMetrics } from "./mlModel";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

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
  
  /**
   * Make prediction for a single property
   */
  predict: publicProcedure
    .input(z.object({
      squareFeet: z.number().min(0),
      yearBuilt: z.number().min(1800).max(new Date().getFullYear()),
      bedrooms: z.number().min(0).max(20),
      propertyType: z.string(),
      saleYear: z.number().optional(),
      basementSqFt: z.number().min(0).optional(),
      acres: z.number().min(0).optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        if (!isModelTrained()) {
          throw new Error('Model not trained. Please train the model first.');
        }
        
        const modelPath = path.join(process.cwd(), 'ml', 'model.pkl');
        const scriptPath = path.join(process.cwd(), 'ml', 'predict.py');
        
        // Prepare input data with defaults
        const inputData = {
          ...input,
          saleYear: input.saleYear || new Date().getFullYear(),
          basementSqFt: input.basementSqFt || 0,
          acres: input.acres || 0,
          age: new Date().getFullYear() - input.yearBuilt,
        };
        
        const inputJson = JSON.stringify(inputData);
        const command = `python3.11 "${scriptPath}" "${modelPath}" '${inputJson}'`;
        
        console.log('[mlModel] Running prediction:', command);
        const { stdout, stderr } = await execAsync(command);
        
        if (stderr) {
          console.error('[mlModel] Prediction stderr:', stderr);
        }
        
        const result = JSON.parse(stdout);
        console.log('[mlModel] Prediction result:', result);
        
        return {
          success: true,
          predictedValue: result.predictions[0],
          features: inputData
        };
      } catch (error) {
        console.error('[mlModel] Prediction failed:', error);
        throw new Error(`Prediction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),
});
