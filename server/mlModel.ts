/**
 * ML Model Bridge - Node.js wrapper for Python ML model
 * Provides training and prediction capabilities
 */

import { spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

const MODEL_PATH = path.join(process.cwd(), 'ml', 'model.pkl');
const METRICS_PATH = path.join(process.cwd(), 'ml', 'model_metrics.json');
const TRAIN_SCRIPT = path.join(process.cwd(), 'ml', 'train_model.py');
const PREDICT_SCRIPT = path.join(process.cwd(), 'ml', 'predict.py');

export interface ModelMetrics {
  mae: number;
  rmse: number;
  r2: number;
  cv_mean: number;
  cv_std: number;
  training_samples: number;
  test_samples: number;
  feature_count: number;
  trained_at: string;
}

export interface PredictionInput {
  squareFeet: number;
  yearBuilt: number;
  bedrooms: number;
  propertyType: string;
  saleYear?: number;
  basementSqFt?: number;
  acres?: number;
  age?: number;
}

export interface PredictionResult {
  predictions: number[];
  count: number;
}

/**
 * Check if ML model is trained and available
 */
export function isModelTrained(): boolean {
  return existsSync(MODEL_PATH);
}

/**
 * Get model training metrics
 */
export function getModelMetrics(): ModelMetrics | null {
  if (!existsSync(METRICS_PATH)) {
    return null;
  }
  
  try {
    const content = readFileSync(METRICS_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading model metrics:', error);
    return null;
  }
}

/**
 * Train ML model using Python script
 * Returns: training metrics
 */
export async function trainModel(): Promise<ModelMetrics> {
  return new Promise((resolve, reject) => {
    const python = spawn('python3.11', [TRAIN_SCRIPT, MODEL_PATH], {
      env: process.env,
      cwd: process.cwd(),
    });
    
    let stdout = '';
    let stderr = '';
    let jsonOutput = '';
    let captureJson = false;
    
    python.stdout.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      console.log('[ML Train]', text.trim());
      
      // Capture JSON output
      if (text.includes('__JSON_OUTPUT__')) {
        captureJson = true;
      } else if (captureJson) {
        jsonOutput += text;
      }
    });
    
    python.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error('[ML Train Error]', data.toString().trim());
    });
    
    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Training failed with code ${code}: ${stderr}`));
        return;
      }
      
      try {
        // Parse JSON output
        const metrics = JSON.parse(jsonOutput.trim());
        resolve(metrics);
      } catch (error) {
        reject(new Error(`Failed to parse training output: ${error}`));
      }
    });
    
    python.on('error', (error) => {
      reject(new Error(`Failed to start training process: ${error.message}`));
    });
  });
}

/**
 * Make predictions using trained ML model
 */
export async function predict(input: PredictionInput | PredictionInput[]): Promise<number[]> {
  if (!isModelTrained()) {
    throw new Error('ML model not trained. Please train the model first.');
  }
  
  return new Promise((resolve, reject) => {
    const inputJson = JSON.stringify(input);
    
    const python = spawn('python3.11', [PREDICT_SCRIPT, MODEL_PATH, inputJson], {
      env: process.env,
      cwd: process.cwd(),
    });
    
    let stdout = '';
    let stderr = '';
    
    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error('[ML Predict Error]', data.toString().trim());
    });
    
    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Prediction failed with code ${code}: ${stderr}`));
        return;
      }
      
      try {
        const result: PredictionResult = JSON.parse(stdout.trim());
        resolve(result.predictions);
      } catch (error) {
        reject(new Error(`Failed to parse prediction output: ${error}`));
      }
    });
    
    python.on('error', (error) => {
      reject(new Error(`Failed to start prediction process: ${error.message}`));
    });
  });
}

/**
 * Predict single property value
 */
export async function predictSingle(input: PredictionInput): Promise<number> {
  const predictions = await predict(input);
  return predictions[0];
}

/**
 * Predict batch of property values
 */
export async function predictBatch(inputs: PredictionInput[]): Promise<number[]> {
  return predict(inputs);
}
