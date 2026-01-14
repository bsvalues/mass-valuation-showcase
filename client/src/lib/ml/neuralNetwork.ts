/**
 * Neural Network Regressor for Property Valuation
 * 
 * TerraForge ML - Automated Valuation Model
 * TerraFusion Elite Protocol - Evidence-Based Implementation
 * 
 * Features:
 * - 3-layer feedforward neural network
 * - Backpropagation training
 * - Captures complex non-linear patterns
 * - High accuracy predictions
 */

import * as brain from 'brain.js';
import type { FeatureVector, FeatureStats } from './features';
import { denormalizePrediction } from './features';
import { calculateMetrics, type ModelEvaluation } from './randomForest';

export interface NeuralNetworkConfig {
  hiddenLayers: number[]; // Array of hidden layer sizes, e.g., [64, 32]
  activation: 'sigmoid' | 'relu' | 'leaky-relu' | 'tanh';
  learningRate: number;
  iterations: number; // Max epochs
  errorThresh: number; // Stop training when error below this
}

export const DEFAULT_NN_CONFIG: NeuralNetworkConfig = {
  hiddenLayers: [64],
  activation: 'relu',
  learningRate: 0.001,
  iterations: 100,
  errorThresh: 0.005,
};

export interface NNTrainingResult {
  model: brain.NeuralNetwork<number[], number[]>;
  trainingTime: number; // milliseconds
  finalError: number;
  iterations: number;
}

export interface NNPredictionResult {
  prediction: number;
  confidence?: number;
}

/**
 * Train Neural Network model
 */
export async function trainNeuralNetwork(
  trainVectors: FeatureVector[],
  config: NeuralNetworkConfig = DEFAULT_NN_CONFIG,
  onProgress?: (progress: { iterations: number; error: number }) => void
): Promise<NNTrainingResult> {
  const startTime = performance.now();

  // Prepare training data
  const trainingData = trainVectors.map(v => ({
    input: v.features,
    output: [v.target || 0], // brain.js expects array for output
  }));

  // Create neural network
  const net = new brain.NeuralNetwork({
    hiddenLayers: config.hiddenLayers,
    activation: config.activation,
  }) as brain.NeuralNetwork<number[], number[]>;

  // Train with progress callback
  let finalError = 0;
  let finalIterations = 0;

  const trainResult = net.train(trainingData, {
    iterations: config.iterations,
    errorThresh: config.errorThresh,
    learningRate: config.learningRate,
    log: false,
    logPeriod: 10,
    callback: (stats) => {
      finalError = stats.error;
      finalIterations = stats.iterations;
      if (onProgress) {
        onProgress({ iterations: stats.iterations, error: stats.error });
      }
    },
  });

  const trainingTime = performance.now() - startTime;

  return {
    model: net,
    trainingTime,
    finalError: trainResult.error,
    iterations: trainResult.iterations,
  };
}

/**
 * Make predictions with trained model
 */
export function predictNeuralNetwork(
  model: brain.NeuralNetwork<number[], number[]>,
  features: number[],
  targetStats?: FeatureStats
): NNPredictionResult {
  const output = model.run(features) as any;
  const normalizedPrediction = Array.isArray(output) ? output[0] : output;

  // Denormalize if target stats provided
  const prediction = targetStats
    ? denormalizePrediction(normalizedPrediction, targetStats)
    : normalizedPrediction;

  return {
    prediction,
    confidence: undefined, // Neural networks don't provide confidence by default
  };
}

/**
 * Evaluate model performance
 */
export function evaluateNeuralNetwork(
  model: brain.NeuralNetwork<number[], number[]>,
  testVectors: FeatureVector[],
  targetStats?: FeatureStats
): ModelEvaluation {
  const predictions: number[] = [];
  const actuals: number[] = [];

  testVectors.forEach(vector => {
    const pred = predictNeuralNetwork(model, vector.features, targetStats);
    const actual = targetStats && vector.target !== undefined
      ? denormalizePrediction(vector.target, targetStats)
      : vector.target || 0;

    predictions.push(pred.prediction);
    actuals.push(actual);
  });

  return calculateMetrics(predictions, actuals);
}

/**
 * Serialize model to JSON
 */
export function serializeNNModel(model: brain.NeuralNetwork<number[], number[]>): string {
  return JSON.stringify(model.toJSON());
}

/**
 * Deserialize model from JSON
 */
export function deserializeNNModel(json: string): brain.NeuralNetwork<number[], number[]> {
  const net = new brain.NeuralNetwork();
  net.fromJSON(JSON.parse(json));
  return net as any;
}

/**
 * Cross-validation for model reliability
 */
export async function crossValidateNeuralNetwork(
  vectors: FeatureVector[],
  config: NeuralNetworkConfig = DEFAULT_NN_CONFIG,
  folds: number = 5
): Promise<{
  meanMAE: number;
  meanRMSE: number;
  meanR2: number;
  meanMAPE: number;
  stdMAE: number;
  stdRMSE: number;
  stdR2: number;
  stdMAPE: number;
}> {
  const foldSize = Math.floor(vectors.length / folds);
  const evaluations: ModelEvaluation[] = [];

  for (let i = 0; i < folds; i++) {
    // Split data into train and validation
    const validationStart = i * foldSize;
    const validationEnd = (i + 1) * foldSize;
    
    const validation = vectors.slice(validationStart, validationEnd);
    const train = [
      ...vectors.slice(0, validationStart),
      ...vectors.slice(validationEnd),
    ];

    // Train model
    const { model } = await trainNeuralNetwork(train, config);

    // Evaluate model
    const evaluation = evaluateNeuralNetwork(model, validation);
    evaluations.push(evaluation);
  }

  // Calculate mean and std for each metric
  const meanMAE = evaluations.reduce((sum, e) => sum + e.mae, 0) / folds;
  const meanRMSE = evaluations.reduce((sum, e) => sum + e.rmse, 0) / folds;
  const meanR2 = evaluations.reduce((sum, e) => sum + e.r2, 0) / folds;
  const meanMAPE = evaluations.reduce((sum, e) => sum + e.mape, 0) / folds;

  const stdMAE = Math.sqrt(
    evaluations.reduce((sum, e) => sum + Math.pow(e.mae - meanMAE, 2), 0) / folds
  );
  const stdRMSE = Math.sqrt(
    evaluations.reduce((sum, e) => sum + Math.pow(e.rmse - meanRMSE, 2), 0) / folds
  );
  const stdR2 = Math.sqrt(
    evaluations.reduce((sum, e) => sum + Math.pow(e.r2 - meanR2, 2), 0) / folds
  );
  const stdMAPE = Math.sqrt(
    evaluations.reduce((sum, e) => sum + Math.pow(e.mape - meanMAPE, 2), 0) / folds
  );

  return {
    meanMAE,
    meanRMSE,
    meanR2,
    meanMAPE,
    stdMAE,
    stdRMSE,
    stdR2,
    stdMAPE,
  };
}
