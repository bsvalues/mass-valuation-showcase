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


/**
 * Value Driver Analysis PDF Export
 * Generates comprehensive PDF reports with charts, metrics, and property details
 */

import type { PropertyFeatures, EngineerEdFeatures } from './featureEngineering';

interface ValueDriverPDFOptions {
  property: PropertyFeatures;
  engineeredFeatures: EngineerEdFeatures;
  predictedValue: number;
  featureImportance: Array<{ name: string; importance: number }>;
}

export function exportValueDriverReport(options: ValueDriverPDFOptions): void {
  const { property, engineeredFeatures, predictedValue, featureImportance } = options;
  
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  // Helper function to add new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper function to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // ========================================
  // HEADER & TITLE
  // ========================================
  
  // TerraFusion branding
  doc.setFillColor(0, 255, 255);
  doc.rect(margin, yPosition, 5, 10, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(0, 255, 255);
  doc.text('TerraFusion', margin + 8, yPosition + 7);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Mass Valuation Appraisal Suite', margin + 8, yPosition + 12);
  
  yPosition += 25;

  // Report title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text('Property Value Driver Analysis Report', margin, yPosition);
  
  yPosition += 10;

  // Report date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.text(`Generated: ${reportDate}`, margin, yPosition);
  
  yPosition += 15;

  // ========================================
  // PROPERTY SUMMARY
  // ========================================
  
  checkPageBreak(50);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Property Summary', margin, yPosition);
  
  yPosition += 8;

  // Property details table
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  const propertyDetails = [
    ['Square Footage:', `${property.squareFeet?.toLocaleString() || 'N/A'} sq ft`],
    ['Year Built:', `${property.yearBuilt || 'N/A'}`],
    ['Property Age:', `${engineeredFeatures.propertyAge || 'N/A'} years`],
    ['Bedrooms:', `${property.bedrooms || 'N/A'}`],
    ['Bathrooms:', `${property.bathrooms || 'N/A'}`],
    ['Lot Size:', `${property.lotSize?.toLocaleString() || 'N/A'} sq ft`],
    ['Quality Rating:', `${property.quality || 'N/A'}`],
    ['Condition:', `${property.condition || 'N/A'}`],
    ['Property Type:', `${property.propertySubtype || property.propertyType || 'N/A'}`],
  ];

  propertyDetails.forEach(([label, value]) => {
    doc.setTextColor(80, 80, 80);
    doc.text(label, margin, yPosition);
    doc.setTextColor(0, 0, 0);
    doc.text(value, margin + 50, yPosition);
    yPosition += 6;
  });

  yPosition += 10;

  // ========================================
  // VALUATION METRICS
  // ========================================
  
  checkPageBreak(60);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Valuation Metrics', margin, yPosition);
  
  yPosition += 8;

  // Metrics boxes
  const metrics = [
    { label: 'Predicted Value', value: formatCurrency(predictedValue) },
    { label: 'Land Value', value: formatCurrency(property.landValue || 0) },
    { label: 'Building Value', value: formatCurrency(property.buildingValue || 0) },
    { label: 'Price per Sq Ft', value: formatCurrency(engineeredFeatures.pricePerSqFt || 0) },
  ];

  const boxWidth = (pageWidth - 2 * margin - 15) / 4;
  let xPos = margin;

  metrics.forEach((metric) => {
    // Box background
    doc.setFillColor(0, 255, 255, 0.1);
    doc.roundedRect(xPos, yPosition, boxWidth, 20, 2, 2, 'F');
    
    // Label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(metric.label, xPos + boxWidth / 2, yPosition + 6, { align: 'center' });
    
    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(metric.value, xPos + boxWidth / 2, yPosition + 14, { align: 'center' });
    
    xPos += boxWidth + 5;
  });

  yPosition += 30;

  // ========================================
  // FEATURE IMPORTANCE
  // ========================================
  
  checkPageBreak(80);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Top Value Drivers', margin, yPosition);
  
  yPosition += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('Features ranked by impact on property value', margin, yPosition);
  
  yPosition += 8;

  // Feature importance bars
  const topFeatures = featureImportance.slice(0, 10);
  const maxImportance = Math.max(...topFeatures.map(f => f.importance));

  topFeatures.forEach((feature, index) => {
    checkPageBreak(10);
    
    // Feature name
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(`${index + 1}. ${feature.name}`, margin, yPosition);
    
    // Bar
    const barWidth = (pageWidth - 2 * margin - 60) * (feature.importance / maxImportance);
    doc.setFillColor(0, 255, 255, 0.6);
    doc.roundedRect(margin + 60, yPosition - 3, barWidth, 5, 1, 1, 'F');
    
    // Percentage
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 255, 255);
    doc.text(`${feature.importance.toFixed(1)}%`, pageWidth - margin, yPosition, { align: 'right' });
    
    yPosition += 7;
  });

  yPosition += 10;

  // ========================================
  // ENGINEERED FEATURES SUMMARY
  // ========================================
  
  checkPageBreak(70);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Engineered Features', margin, yPosition);
  
  yPosition += 8;

  const engineeredSummary = [
    ['Quality Score:', `${engineeredFeatures.qualityScore?.toFixed(1) || 'N/A'} / 5.0`],
    ['Condition Score:', `${engineeredFeatures.conditionScore?.toFixed(1) || 'N/A'} / 5.0`],
    ['Location Score:', `${engineeredFeatures.locationScore?.toFixed(1) || 'N/A'} / 100`],
    ['Amenity Score:', `${engineeredFeatures.amenityScore?.toFixed(1) || 'N/A'} / 100`],
    ['Depreciation Factor:', `${engineeredFeatures.depreciationFactor?.toFixed(3) || 'N/A'}`],
    ['Renovation Boost:', `${engineeredFeatures.renovationBoost?.toFixed(2) || 'N/A'}x`],
    ['Lot to Building Ratio:', `${engineeredFeatures.lotSizeToSqFtRatio?.toFixed(2) || 'N/A'}`],
    ['Basement Ratio:', `${engineeredFeatures.basementRatio?.toFixed(2) || 'N/A'}`],
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  engineeredSummary.forEach(([label, value]) => {
    checkPageBreak(7);
    doc.setTextColor(80, 80, 80);
    doc.text(label, margin, yPosition);
    doc.setTextColor(0, 0, 0);
    doc.text(value, margin + 70, yPosition);
    yPosition += 6;
  });

  yPosition += 10;

  // ========================================
  // FOOTER
  // ========================================
  
  const totalPages = doc.internal.pages.length - 1;
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(0, 255, 255);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    // Footer text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('TerraFusion Mass Valuation Appraisal Suite', margin, pageHeight - 10);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  }

  // ========================================
  // SAVE PDF
  // ========================================
  
  const filename = `Value_Driver_Analysis_${property.squareFeet}sqft_${new Date().getTime()}.pdf`;
  doc.save(filename);
}
