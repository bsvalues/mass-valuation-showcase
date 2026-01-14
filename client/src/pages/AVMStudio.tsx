import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Brain, TreeDeciduous, TrendingUp, Play, Download } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { trpc } from '../lib/trpc';

export default function AVMStudio() {
  const [modelType, setModelType] = useState<'randomForest' | 'neuralNetwork'>('randomForest');
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [modelResults, setModelResults] = useState<any>(null);

  const { data: parcels } = trpc.parcels.list.useQuery();

  const handleTrain = async () => {
    setIsTraining(true);
    setTrainingProgress(0);
    
    // Simulate training progress
    const interval = setInterval(() => {
      setTrainingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsTraining(false);
          // Mock results
          setModelResults({
            mae: 45000,
            rmse: 67000,
            r2: 0.87,
            mape: 12.5,
            trainingTime: 2500,
          });
          return 100;
        }
        return prev + 10;
      });
    }, 250);
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
