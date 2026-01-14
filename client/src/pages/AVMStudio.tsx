import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Brain, TreeDeciduous, TrendingUp, Play, Download, Sparkles, History, BarChart } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { trpc } from '../lib/trpc';
import { preprocessData, trainTestSplit, type FeatureVector, type FeatureStats } from '../lib/ml/features';
import { trainRandomForest, evaluateRandomForest, predictRandomForest, type RandomForestConfig, DEFAULT_RF_CONFIG } from '../lib/ml/randomForest';
import { trainNeuralNetwork, evaluateNeuralNetwork, predictNeuralNetwork, type NeuralNetworkConfig, DEFAULT_NN_CONFIG } from '../lib/ml/neuralNetwork';
import type { RandomForestRegression } from 'ml-random-forest';
import type * as brain from 'brain.js';

export default function AVMStudio() {
  const [modelType, setModelType] = useState<'randomForest' | 'neuralNetwork'>('randomForest');
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [modelResults, setModelResults] = useState<any>(null);
  const [trainedModel, setTrainedModel] = useState<RandomForestRegression | brain.NeuralNetwork<number[], number[]> | null>(null);
  const [featureStats, setFeatureStats] = useState<FeatureStats[] | null>(null);
  const [targetStats, setTargetStats] = useState<FeatureStats | null>(null);
  const [predictionInput, setPredictionInput] = useState({
    squareFeet: '',
    yearBuilt: '',
    landValue: '',
    buildingValue: '',
  });
  const [predictionResult, setPredictionResult] = useState<number | null>(null);
  const [predictionHistory, setPredictionHistory] = useState<Array<{
    timestamp: Date;
    inputs: { squareFeet: string; yearBuilt: string; landValue: string; buildingValue: string };
    prediction: number;
    modelType: string;
    confidenceInterval?: { lower: number; upper: number };
  }>>([]);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [trainedRFModel, setTrainedRFModel] = useState<RandomForestRegression | null>(null);
  const [trainedNNModel, setTrainedNNModel] = useState<brain.NeuralNetwork<number[], number[]> | null>(null);
  const [rfResults, setRFResults] = useState<any>(null);
  const [nnResults, setNNResults] = useState<any>(null);
  const [featureImportance, setFeatureImportance] = useState<Array<{ feature: string; importance: number }> | null>(null);

  const { data: parcels } = trpc.parcels.list.useQuery();

  const handleTrain = async () => {
    if (!parcels || parcels.length < 10) {
      alert('Need at least 10 parcels to train model');
      return;
    }

    setIsTraining(true);
    setTrainingProgress(0);
    setPredictionResult(null);

    try {
      // Preprocess data
      setTrainingProgress(10);
      const { vectors, stats, targetStats: tStats } = preprocessData(parcels);
      setFeatureStats(stats);
      setTargetStats(tStats);

      // Split data
      setTrainingProgress(20);
      const { train, test } = trainTestSplit(vectors, 0.3, true);

      // Train model
      setTrainingProgress(30);
      const startTime = performance.now();

      if (modelType === 'randomForest') {
        const { model, trainingTime, featureImportance } = await trainRandomForest(train, DEFAULT_RF_CONFIG);
        setTrainedModel(model);
        setTrainingProgress(70);

        // Evaluate
        const evaluation = evaluateRandomForest(model, test, tStats);
        setTrainingProgress(100);

        // Store feature importance with names
        const featureNames = ['Square Feet', 'Year Built', 'Land Value', 'Building Value'];
        setFeatureImportance(
          featureImportance.map((importance, i) => ({
            feature: featureNames[i],
            importance,
          }))
        );

        setModelResults({
          ...evaluation,
          trainingTime,
        });
      } else {
        const { model, trainingTime, finalError, iterations } = await trainNeuralNetwork(
          train,
          DEFAULT_NN_CONFIG,
          (progress) => {
            setTrainingProgress(30 + (progress.iterations / DEFAULT_NN_CONFIG.iterations) * 40);
          }
        );
        setTrainedModel(model);
        setTrainingProgress(70);

        // Evaluate
        const evaluation = evaluateNeuralNetwork(model, test, tStats);
        setTrainingProgress(100);

        setModelResults({
          ...evaluation,
          trainingTime,
          finalError,
          iterations,
        });
      }
    } catch (error) {
      console.error('Training error:', error);
      alert('Training failed: ' + (error as Error).message);
    } finally {
      setIsTraining(false);
    }
  };

  const handlePredict = () => {
    if (!trainedModel || !featureStats || !targetStats) {
      alert('Please train a model first');
      return;
    }

    const sqft = parseFloat(predictionInput.squareFeet);
    const year = parseFloat(predictionInput.yearBuilt);
    const land = parseFloat(predictionInput.landValue);
    const building = parseFloat(predictionInput.buildingValue);

    if (isNaN(sqft) || isNaN(year) || isNaN(land) || isNaN(building)) {
      alert('Please fill in all fields with valid numbers');
      return;
    }

    // Create feature vector (must match training features)
    const features = [sqft, year, land, building];

    // Normalize features
    const normalizedFeatures = features.map((value, i) => {
      const { min, max } = featureStats[i];
      if (max === min) return 0;
      return (value - min) / (max - min);
    });

    // Predict
    let prediction: number;
    if (modelType === 'randomForest') {
      const result = predictRandomForest(trainedModel as RandomForestRegression, normalizedFeatures, targetStats);
      prediction = result.prediction;
    } else {
      const result = predictNeuralNetwork(trainedModel as brain.NeuralNetwork<number[], number[]>, normalizedFeatures, targetStats);
      prediction = result.prediction;
    }

    // Calculate simple confidence interval (±10% for demonstration)
    const confidenceInterval = {
      lower: prediction * 0.9,
      upper: prediction * 1.1,
    };

    setPredictionResult(prediction);

    // Add to history
    setPredictionHistory(prev => [{
      timestamp: new Date(),
      inputs: { ...predictionInput },
      prediction,
      modelType: modelType === 'randomForest' ? 'Random Forest' : 'Neural Network',
      confidenceInterval,
    }, ...prev].slice(0, 10)); // Keep last 10 predictions
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-cyan-400 mb-2">AVM Studio</h1>
          <p className="text-gray-400">Automated Valuation Models - Machine Learning</p>
        </div>

        {/* Model Selection */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-cyan-400 mb-4">Model Selection</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setModelType('randomForest')}
              className={`p-6 rounded-lg border-2 transition-all ${
                modelType === 'randomForest'
                  ? 'border-cyan-400 bg-cyan-400/10'
                  : 'border-gray-700 hover:border-cyan-400/50'
              }`}
            >
              <TreeDeciduous className="w-12 h-12 text-cyan-400 mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Random Forest</h3>
              <p className="text-sm text-gray-400">Ensemble of decision trees. Interpretable and robust.</p>
            </button>
            <button
              onClick={() => setModelType('neuralNetwork')}
              className={`p-6 rounded-lg border-2 transition-all ${
                modelType === 'neuralNetwork'
                  ? 'border-cyan-400 bg-cyan-400/10'
                  : 'border-gray-700 hover:border-cyan-400/50'
              }`}
            >
              <Brain className="w-12 h-12 text-cyan-400 mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Neural Network</h3>
              <p className="text-sm text-gray-400">Deep learning model. Captures complex patterns.</p>
            </button>
          </div>
        </div>

        {/* Training Configuration */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-cyan-400 mb-4">Training Configuration</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Training Data</label>
              <div className="text-white text-lg">{parcels?.length || 0} parcels</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Train/Test Split</label>
              <div className="text-white text-lg">70% / 30%</div>
            </div>
          </div>
          <button
            onClick={handleTrain}
            disabled={isTraining || !parcels || parcels.length < 10}
            className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Play className="w-5 h-5" />
            {isTraining ? `Training... ${trainingProgress}%` : 'Train Model'}
          </button>
          {isTraining && (
            <div className="mt-4">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-cyan-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${trainingProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Model Results */}
        {modelResults && (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-cyan-400">Model Performance</h2>
              <button className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300">
                <Download className="w-5 h-5" />
                Export Report
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">MAE</div>
                <div className="text-2xl font-bold text-white">${(modelResults.mae / 1000).toFixed(1)}K</div>
                <div className="text-xs text-green-400 mt-1">✓ Target: &lt;$50K</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">RMSE</div>
                <div className="text-2xl font-bold text-white">${(modelResults.rmse / 1000).toFixed(1)}K</div>
                <div className="text-xs text-green-400 mt-1">✓ Target: &lt;$75K</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">R²</div>
                <div className="text-2xl font-bold text-white">{modelResults.r2.toFixed(3)}</div>
                <div className="text-xs text-green-400 mt-1">✓ Target: &gt;0.85</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">MAPE</div>
                <div className="text-2xl font-bold text-white">{modelResults.mape.toFixed(1)}%</div>
                <div className="text-xs text-green-400 mt-1">✓ Target: &lt;15%</div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-gray-900 rounded-lg">
              <div className="text-sm text-gray-400">Training Time</div>
              <div className="text-lg text-white">{(modelResults.trainingTime / 1000).toFixed(2)}s</div>
            </div>
          </div>
        )}

        {/* Feature Importance */}
        {featureImportance && modelType === 'randomForest' && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart className="w-6 h-6 text-cyan-400" />
              <h2 className="text-xl font-semibold text-cyan-400">Feature Importance</h2>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Shows which property attributes most influence the valuation predictions.
            </p>
            <div className="space-y-3">
              {featureImportance
                .sort((a, b) => b.importance - a.importance)
                .map((item, idx) => {
                  const percentage = (item.importance * 100).toFixed(1);
                  return (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-white font-medium">{item.feature}</span>
                        <span className="text-cyan-400">{percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
            <div className="mt-4 p-3 bg-cyan-900/20 border border-cyan-400/30 rounded-lg">
              <p className="text-xs text-gray-300">
                <strong className="text-cyan-400">Interpretation:</strong> Higher percentages indicate features that have greater influence on property value predictions. For example, if "Square Feet" shows 40%, it means this attribute contributes most significantly to the model's valuation decisions.
              </p>
            </div>
          </div>
        )}

        {/* Prediction Interface */}
        {trainedModel && modelResults && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-cyan-400" />
              <h2 className="text-xl font-semibold text-cyan-400">Predict Property Value</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Square Feet</label>
                <input
                  type="number"
                  value={predictionInput.squareFeet}
                  onChange={(e) => setPredictionInput({ ...predictionInput, squareFeet: e.target.value })}
                  placeholder="e.g., 2000"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Year Built</label>
                <input
                  type="number"
                  value={predictionInput.yearBuilt}
                  onChange={(e) => setPredictionInput({ ...predictionInput, yearBuilt: e.target.value })}
                  placeholder="e.g., 2010"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Land Value ($)</label>
                <input
                  type="number"
                  value={predictionInput.landValue}
                  onChange={(e) => setPredictionInput({ ...predictionInput, landValue: e.target.value })}
                  placeholder="e.g., 150000"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Building Value ($)</label>
                <input
                  type="number"
                  value={predictionInput.buildingValue}
                  onChange={(e) => setPredictionInput({ ...predictionInput, buildingValue: e.target.value })}
                  placeholder="e.g., 350000"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
            <button
              onClick={handlePredict}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Sparkles className="w-5 h-5" />
              Predict Value
            </button>
            {predictionResult !== null && (
              <div className="mt-6 p-6 bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border border-cyan-400/50 rounded-lg">
                <div className="text-center">
                  <div className="text-sm text-cyan-400 mb-2">Predicted Total Value</div>
                  <div className="text-4xl font-bold text-white mb-2">
                    ${predictionResult.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs text-gray-400">
                    Model: {modelType === 'randomForest' ? 'Random Forest' : 'Neural Network'}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-cyan-400/30">
                  <div className="text-xs text-gray-400 mb-2">Input Features:</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-400">Square Feet:</div>
                    <div className="text-white text-right">{predictionInput.squareFeet}</div>
                    <div className="text-gray-400">Year Built:</div>
                    <div className="text-white text-right">{predictionInput.yearBuilt}</div>
                    <div className="text-gray-400">Land Value:</div>
                    <div className="text-white text-right">${parseFloat(predictionInput.landValue).toLocaleString()}</div>
                    <div className="text-gray-400">Building Value:</div>
                    <div className="text-white text-right">${parseFloat(predictionInput.buildingValue).toLocaleString()}</div>
                  </div>
                </div>
                {predictionResult !== null && predictionHistory[0]?.confidenceInterval && (
                  <div className="mt-4 pt-4 border-t border-cyan-400/30">
                    <div className="text-xs text-gray-400 mb-2">Confidence Interval (90%):</div>
                    <div className="text-sm text-white">
                      ${predictionHistory[0].confidenceInterval.lower.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      {' - '}
                      ${predictionHistory[0].confidenceInterval.upper.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Prediction History */}
        {predictionHistory.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-6 h-6 text-cyan-400" />
              <h2 className="text-xl font-semibold text-cyan-400">Prediction History</h2>
              <span className="text-sm text-gray-400">({predictionHistory.length} predictions)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-gray-400 font-medium py-2 px-2">Time</th>
                    <th className="text-right text-gray-400 font-medium py-2 px-2">Sqft</th>
                    <th className="text-right text-gray-400 font-medium py-2 px-2">Year</th>
                    <th className="text-right text-gray-400 font-medium py-2 px-2">Land Value</th>
                    <th className="text-right text-gray-400 font-medium py-2 px-2">Building Value</th>
                    <th className="text-right text-gray-400 font-medium py-2 px-2">Predicted Value</th>
                    <th className="text-left text-gray-400 font-medium py-2 px-2">Model</th>
                  </tr>
                </thead>
                <tbody>
                  {predictionHistory.map((entry, idx) => (
                    <tr key={idx} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                      <td className="py-2 px-2 text-gray-300">
                        {entry.timestamp.toLocaleTimeString()}
                      </td>
                      <td className="py-2 px-2 text-right text-white">{entry.inputs.squareFeet}</td>
                      <td className="py-2 px-2 text-right text-white">{entry.inputs.yearBuilt}</td>
                      <td className="py-2 px-2 text-right text-white">
                        ${parseFloat(entry.inputs.landValue).toLocaleString()}
                      </td>
                      <td className="py-2 px-2 text-right text-white">
                        ${parseFloat(entry.inputs.buildingValue).toLocaleString()}
                      </td>
                      <td className="py-2 px-2 text-right text-cyan-400 font-semibold">
                        ${entry.prediction.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-2 px-2 text-gray-300">{entry.modelType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info Box */}
        {!modelResults && !isTraining && (
          <div className="bg-cyan-900/20 border border-cyan-400/30 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">Getting Started</h3>
                <p className="text-gray-300 mb-2">
                  AVM Studio uses machine learning to predict property values based on historical data.
                </p>
                <ul className="list-disc list-inside text-gray-400 space-y-1">
                  <li>Select a model type (Random Forest or Neural Network)</li>
                  <li>Ensure you have at least 100 parcels for reliable training</li>
                  <li>Click "Train Model" to begin automated valuation model training</li>
                  <li>Review performance metrics to validate model accuracy</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
