import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * TerraForge PDF Export Service
 * Generates professional PDF reports for regression analysis and AVM predictions
 */

// TerraForge branding colors
const TERRA_CYAN = '#00FFEE';
const TERRA_DARK = '#0A0E1A';
const TERRA_GRAY = '#64748B';

interface RegressionResults {
  coefficients: Record<string, number>;
  rSquared: number;
  adjustedRSquared: number;
  fStatistic: number;
  pValues: Record<string, number>;
  standardErrors: Record<string, number>;
  confidenceIntervals: Record<string, [number, number]>;
  residualStandardError: number;
  observations: number;
}

interface AVMPrediction {
  predictedValue: number;
  modelType: string;
  features: Record<string, number>;
  timestamp: string;
  confidenceInterval?: [number, number];
}

interface AVMModelMetrics {
  name: string;
  type: string;
  mae: number;
  rmse: number;
  rSquared: number;
  mape: number;
  trainingDataSize: number;
  createdAt: string;
}

/**
 * Add TerraForge header to PDF
 */
function addHeader(doc: jsPDF, title: string) {
  // Add logo placeholder (you can replace with actual logo image)
  doc.setFillColor(0, 255, 238);
  doc.circle(15, 15, 5, 'F');
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(0, 255, 238);
  doc.text(title, 25, 18);
  
  // Subtitle
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('TerraForge Quantum Valuation Engine', 25, 24);
  
  // Date
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 25, 29);
  
  // Separator line
  doc.setDrawColor(0, 255, 238);
  doc.setLineWidth(0.5);
  doc.line(15, 35, 195, 35);
}

/**
 * Add footer to PDF
 */
function addFooter(doc: jsPDF, pageNumber: number) {
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `TerraForge | Page ${pageNumber} | Confidential`,
    105,
    pageHeight - 10,
    { align: 'center' }
  );
}

/**
 * Export regression results to PDF
 */
export function exportRegressionToPDF(results: RegressionResults) {
  const doc = new jsPDF();
  
  addHeader(doc, 'Regression Analysis Report');
  
  let yPos = 45;
  
  // Model Summary
  doc.setFontSize(14);
  doc.setTextColor(0, 255, 238);
  doc.text('Model Summary', 15, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(51, 51, 51);
  doc.text(`R-squared: ${results.rSquared.toFixed(4)}`, 15, yPos);
  yPos += 6;
  doc.text(`Adjusted R-squared: ${results.adjustedRSquared.toFixed(4)}`, 15, yPos);
  yPos += 6;
  doc.text(`F-statistic: ${results.fStatistic.toFixed(2)}`, 15, yPos);
  yPos += 6;
  doc.text(`Residual Standard Error: ${results.residualStandardError.toFixed(2)}`, 15, yPos);
  yPos += 6;
  doc.text(`Observations: ${results.observations}`, 15, yPos);
  yPos += 15;
  
  // Coefficients Table
  doc.setFontSize(14);
  doc.setTextColor(0, 255, 238);
  doc.text('Coefficients', 15, yPos);
  yPos += 5;
  
  const coeffData = Object.entries(results.coefficients).map(([variable, coef]) => [
    variable,
    coef.toFixed(4),
    results.standardErrors[variable]?.toFixed(4) || 'N/A',
    results.pValues[variable]?.toFixed(4) || 'N/A',
    results.confidenceIntervals[variable]
      ? `[${results.confidenceIntervals[variable][0].toFixed(2)}, ${results.confidenceIntervals[variable][1].toFixed(2)}]`
      : 'N/A',
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Variable', 'Coefficient', 'Std. Error', 'P-Value', '95% CI']],
    body: coeffData,
    theme: 'grid',
    headStyles: {
      fillColor: [0, 255, 238],
      textColor: [10, 14, 26],
      fontSize: 10,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  // Interpretation
  doc.setFontSize(14);
  doc.setTextColor(0, 255, 238);
  doc.text('Interpretation', 15, yPos);
  yPos += 10;
  
  doc.setFontSize(9);
  doc.setTextColor(51, 51, 51);
  const interpretation = [
    `The model explains ${(results.rSquared * 100).toFixed(1)}% of the variance in property values.`,
    `The F-statistic of ${results.fStatistic.toFixed(2)} indicates ${results.fStatistic > 10 ? 'strong' : 'moderate'} overall model significance.`,
    `Coefficients with p-values < 0.05 are statistically significant predictors.`,
  ];
  
  interpretation.forEach((line) => {
    doc.text(line, 15, yPos, { maxWidth: 180 });
    yPos += 6;
  });
  
  addFooter(doc, 1);
  
  // Save PDF
  doc.save(`TerraForge_Regression_Report_${Date.now()}.pdf`);
}

/**
 * Export AVM prediction to PDF
 */
export function exportAVMPredictionToPDF(prediction: AVMPrediction) {
  const doc = new jsPDF();
  
  addHeader(doc, 'AVM Prediction Report');
  
  let yPos = 45;
  
  // Prediction Summary
  doc.setFontSize(14);
  doc.setTextColor(0, 255, 238);
  doc.text('Predicted Property Value', 15, yPos);
  yPos += 10;
  
  doc.setFontSize(20);
  doc.setTextColor(51, 51, 51);
  doc.text(`$${prediction.predictedValue.toLocaleString()}`, 15, yPos);
  yPos += 10;
  
  if (prediction.confidenceInterval) {
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Confidence Interval: $${prediction.confidenceInterval[0].toLocaleString()} - $${prediction.confidenceInterval[1].toLocaleString()}`,
      15,
      yPos
    );
    yPos += 15;
  } else {
    yPos += 10;
  }
  
  // Model Information
  doc.setFontSize(14);
  doc.setTextColor(0, 255, 238);
  doc.text('Model Information', 15, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(51, 51, 51);
  doc.text(`Model Type: ${prediction.modelType}`, 15, yPos);
  yPos += 6;
  doc.text(`Timestamp: ${new Date(prediction.timestamp).toLocaleString()}`, 15, yPos);
  yPos += 15;
  
  // Input Features
  doc.setFontSize(14);
  doc.setTextColor(0, 255, 238);
  doc.text('Input Features', 15, yPos);
  yPos += 5;
  
  const featureData = Object.entries(prediction.features).map(([key, value]) => [
    key.replace(/([A-Z])/g, ' $1').trim(),
    typeof value === 'number' ? value.toLocaleString() : value,
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Feature', 'Value']],
    body: featureData,
    theme: 'grid',
    headStyles: {
      fillColor: [0, 255, 238],
      textColor: [10, 14, 26],
      fontSize: 10,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
  });
  
  addFooter(doc, 1);
  
  // Save PDF
  doc.save(`TerraForge_AVM_Prediction_${Date.now()}.pdf`);
}

/**
 * Export AVM model metrics to PDF
 */
export function exportAVMModelToPDF(model: AVMModelMetrics) {
  const doc = new jsPDF();
  
  addHeader(doc, 'AVM Model Report');
  
  let yPos = 45;
  
  // Model Information
  doc.setFontSize(14);
  doc.setTextColor(0, 255, 238);
  doc.text('Model Information', 15, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(51, 51, 51);
  doc.text(`Model Name: ${model.name}`, 15, yPos);
  yPos += 6;
  doc.text(`Model Type: ${model.type}`, 15, yPos);
  yPos += 6;
  doc.text(`Created: ${new Date(model.createdAt).toLocaleString()}`, 15, yPos);
  yPos += 6;
  doc.text(`Training Data Size: ${model.trainingDataSize} parcels`, 15, yPos);
  yPos += 15;
  
  // Performance Metrics
  doc.setFontSize(14);
  doc.setTextColor(0, 255, 238);
  doc.text('Performance Metrics', 15, yPos);
  yPos += 5;
  
  const metricsData = [
    ['Mean Absolute Error (MAE)', `$${model.mae.toLocaleString()}`],
    ['Root Mean Square Error (RMSE)', `$${model.rmse.toLocaleString()}`],
    ['R-squared (R²)', model.rSquared.toFixed(4)],
    ['Mean Absolute Percentage Error (MAPE)', `${model.mape.toFixed(2)}%`],
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value']],
    body: metricsData,
    theme: 'grid',
    headStyles: {
      fillColor: [0, 255, 238],
      textColor: [10, 14, 26],
      fontSize: 10,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  // Model Quality Assessment
  doc.setFontSize(14);
  doc.setTextColor(0, 255, 238);
  doc.text('Model Quality Assessment', 15, yPos);
  yPos += 10;
  
  doc.setFontSize(9);
  doc.setTextColor(51, 51, 51);
  
  const quality = model.rSquared > 0.8 ? 'Excellent' : model.rSquared > 0.6 ? 'Good' : 'Fair';
  const assessment = [
    `Overall Model Quality: ${quality}`,
    `The R² of ${model.rSquared.toFixed(4)} indicates the model explains ${(model.rSquared * 100).toFixed(1)}% of variance.`,
    `Average prediction error is $${model.mae.toLocaleString()} (${model.mape.toFixed(1)}% of actual values).`,
    `Model trained on ${model.trainingDataSize} property records.`,
  ];
  
  assessment.forEach((line) => {
    doc.text(line, 15, yPos, { maxWidth: 180 });
    yPos += 6;
  });
  
  addFooter(doc, 1);
  
  // Save PDF
  doc.save(`TerraForge_Model_${model.name}_${Date.now()}.pdf`);
}

/**
 * Export multiple models comparison to PDF
 */
export function exportModelComparisonToPDF(models: AVMModelMetrics[]) {
  const doc = new jsPDF();
  
  addHeader(doc, 'AVM Model Comparison Report');
  
  let yPos = 45;
  
  // Summary
  doc.setFontSize(14);
  doc.setTextColor(0, 255, 238);
  doc.text(`Comparing ${models.length} Models`, 15, yPos);
  yPos += 10;
  
  // Comparison Table
  const comparisonData = models.map((model) => [
    model.name,
    model.type,
    model.rSquared.toFixed(4),
    `$${model.mae.toLocaleString()}`,
    `$${model.rmse.toLocaleString()}`,
    `${model.mape.toFixed(2)}%`,
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Model Name', 'Type', 'R²', 'MAE', 'RMSE', 'MAPE']],
    body: comparisonData,
    theme: 'grid',
    headStyles: {
      fillColor: [0, 255, 238],
      textColor: [10, 14, 26],
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  // Best Model
  const bestModel = models.reduce((best, current) =>
    current.rSquared > best.rSquared ? current : best
  );
  
  doc.setFontSize(14);
  doc.setTextColor(0, 255, 238);
  doc.text('Recommended Model', 15, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(51, 51, 51);
  doc.text(`${bestModel.name} (${bestModel.type})`, 15, yPos);
  yPos += 6;
  doc.text(`R² = ${bestModel.rSquared.toFixed(4)} | MAE = $${bestModel.mae.toLocaleString()}`, 15, yPos);
  
  addFooter(doc, 1);
  
  // Save PDF
  doc.save(`TerraForge_Model_Comparison_${Date.now()}.pdf`);
}
