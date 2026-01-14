import { useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { trpc } from '../lib/trpc';
import { Trash2, Download, Brain, TreeDeciduous, Calendar, TrendingUp, Edit, X, Tag } from 'lucide-react';

export default function ModelManagement() {
  const { data: savedModels, refetch } = trpc.avmModels.list.useQuery();
  const deleteModelMutation = trpc.avmModels.delete.useMutation();
  const updateNotesTagsMutation = trpc.avmModels.updateNotesTags.useMutation();
  const [selectedModels, setSelectedModels] = useState<number[]>([]);
  const [editingModel, setEditingModel] = useState<{ id: number; name: string; notes: string; tags: string } | null>(null);

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      await deleteModelMutation.mutateAsync({ id });
      refetch();
    }
  };

  const handleEditNotesTags = (model: any) => {
    setEditingModel({
      id: model.id,
      name: model.name,
      notes: model.notes || '',
      tags: model.tags || '',
    });
  };

  const handleSaveNotesTags = async () => {
    if (!editingModel) return;
    await updateNotesTagsMutation.mutateAsync({
      id: editingModel.id,
      notes: editingModel.notes,
      tags: editingModel.tags,
    });
    refetch();
    setEditingModel(null);
  };

  const toggleModelSelection = (id: number) => {
    setSelectedModels(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const selectedModelData = savedModels?.filter(m => selectedModels.includes(m.id));

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Model Management</h1>
          <p className="text-gray-400">View, compare, and manage your saved AVM models</p>
        </div>

        {/* Model List Table */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-cyan-400">Saved Models</h2>
            <div className="text-sm text-gray-400">
              {savedModels?.length || 0} models saved
            </div>
          </div>

          {!savedModels || savedModels.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-2">No saved models yet</div>
              <div className="text-sm text-gray-600">Train and save a model in AVM Studio to get started</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Select</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">MAE</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">RMSE</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">R²</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">MAPE</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Training Data</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Created</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {savedModels.map((model) => (
                    <tr key={model.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedModels.includes(model.id)}
                          onChange={() => toggleModelSelection(model.id)}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-cyan-500 focus:ring-cyan-500"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-white font-medium">{model.name}</div>
                        {model.description && (
                          <div className="text-xs text-gray-500 mt-1">{model.description}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {model.modelType === 'randomForest' ? (
                            <>
                              <TreeDeciduous className="w-4 h-4 text-green-400" />
                              <span className="text-sm text-gray-300">Random Forest</span>
                            </>
                          ) : (
                            <>
                              <Brain className="w-4 h-4 text-purple-400" />
                              <span className="text-sm text-gray-300">Neural Network</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-300">
                        ${model.mae ? (parseFloat(model.mae) / 1000).toFixed(1) : 'N/A'}K
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-300">
                        ${model.rmse ? (parseFloat(model.rmse) / 1000).toFixed(1) : 'N/A'}K
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-300">
                        {model.r2 ? parseFloat(model.r2).toFixed(3) : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-300">
                        {model.mape ? parseFloat(model.mape).toFixed(1) : 'N/A'}%
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-300">
                        {model.trainingDataSize || 'N/A'} parcels
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(model.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditNotesTags(model)}
                            className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/20 rounded transition-colors"
                            title="Edit notes & tags"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(model.id, model.name)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                            title="Delete model"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Model Comparison */}
        {selectedModels.length > 1 && selectedModelData && (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-semibold text-cyan-400">Model Comparison</h2>
              <span className="text-sm text-gray-400">({selectedModels.length} models selected)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedModelData.map((model) => (
                <div key={model.id} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center gap-2 mb-3">
                    {model.modelType === 'randomForest' ? (
                      <TreeDeciduous className="w-5 h-5 text-green-400" />
                    ) : (
                      <Brain className="w-5 h-5 text-purple-400" />
                    )}
                    <h3 className="text-lg font-semibold text-white">{model.name}</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">MAE</span>
                      <span className="text-white font-medium">
                        ${model.mae ? (parseFloat(model.mae) / 1000).toFixed(1) : 'N/A'}K
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">RMSE</span>
                      <span className="text-white font-medium">
                        ${model.rmse ? (parseFloat(model.rmse) / 1000).toFixed(1) : 'N/A'}K
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">R²</span>
                      <span className="text-white font-medium">
                        {model.r2 ? parseFloat(model.r2).toFixed(3) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">MAPE</span>
                      <span className="text-white font-medium">
                        {model.mape ? parseFloat(model.mape).toFixed(1) : 'N/A'}%
                      </span>
                    </div>
                    <div className="pt-2 border-t border-gray-700">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Training Data</span>
                        <span className="text-xs text-cyan-400">{model.trainingDataSize || 'N/A'} parcels</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-500">Training Time</span>
                        <span className="text-xs text-cyan-400">
                          {model.trainingTime ? (model.trainingTime / 1000).toFixed(2) : 'N/A'}s
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Best Model Indicator */}
            {selectedModelData.length > 1 && (
              <div className="mt-4 p-4 bg-cyan-900/20 border border-cyan-400/30 rounded-lg">
                <p className="text-sm text-gray-300">
                  <strong className="text-cyan-400">Best R² Score:</strong>{' '}
                  {selectedModelData.reduce((best, model) => {
                    const r2 = model.r2 ? parseFloat(model.r2) : 0;
                    return r2 > (best.r2 ? parseFloat(best.r2) : 0) ? model : best;
                  }).name}{' '}
                  ({Math.max(...selectedModelData.map(m => m.r2 ? parseFloat(m.r2) : 0)).toFixed(3)})
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Notes & Tags Modal */}
      {editingModel && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-cyan-400/30 rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Edit Notes & Tags</h2>
              <button
                onClick={() => setEditingModel(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Model Name</label>
                <div className="text-white font-semibold">{editingModel.name}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                <textarea
                  value={editingModel.notes}
                  onChange={(e) => setEditingModel({ ...editingModel, notes: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-400 transition-colors"
                  rows={4}
                  placeholder="Add descriptive notes about this model..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Tag className="w-4 h-4 inline mr-1" />
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={editingModel.tags}
                  onChange={(e) => setEditingModel({ ...editingModel, tags: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-400 transition-colors"
                  placeholder="e.g., production, high-accuracy, residential"
                />
                <p className="text-xs text-gray-500 mt-1">Separate tags with commas for better organization</p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleSaveNotesTags}
                className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors font-medium"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditingModel(null)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
