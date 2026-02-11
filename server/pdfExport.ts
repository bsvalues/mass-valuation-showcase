import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface RatioStudyData {
  count: number;
  medianRatio: number;
  meanRatio: number;
  cod: number;
  prd: number;
  prb: number;
  minRatio: number;
  maxRatio: number;
  totalSalesValue: number;
  totalAssessedValue: number;
}

interface ExportOptions {
  countyName?: string;
  propertyType?: string;
  startDate?: Date;
  endDate?: Date;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * Generate IAAO-compliant ratio study PDF report
 */
export function generateRatioStudyPDF(
  data: RatioStudyData,
  options: ExportOptions = {}
): Buffer {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(0, 217, 217); // TerraFusion cyan
  doc.text("IAAO Ratio Study Report", 105, 20, { align: "center" });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("TerraFusion Mass Valuation Appraisal Suite", 105, 28, { align: "center" });
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 34, { align: "center" });
  
  // Study Parameters
  let yPos = 45;
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Study Parameters", 14, yPos);
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  
  if (options.countyName) {
    doc.text(`County: ${options.countyName}`, 14, yPos);
    yPos += 6;
  }
  if (options.propertyType) {
    doc.text(`Property Type: ${options.propertyType}`, 14, yPos);
    yPos += 6;
  }
  if (options.startDate && options.endDate) {
    doc.text(
      `Date Range: ${options.startDate.toLocaleDateString()} - ${options.endDate.toLocaleDateString()}`,
      14,
      yPos
    );
    yPos += 6;
  }
  if (options.minPrice !== undefined && options.maxPrice !== undefined) {
    doc.text(
      `Price Range: $${options.minPrice.toLocaleString()} - $${options.maxPrice.toLocaleString()}`,
      14,
      yPos
    );
    yPos += 6;
  }
  
  doc.text(`Sample Size: ${data.count.toLocaleString()} sales`, 14, yPos);
  yPos += 10;
  
  // IAAO Compliance Summary
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("IAAO Compliance Summary", 14, yPos);
  yPos += 8;
  
  const complianceData = [
    ["Metric", "Value", "IAAO Standard", "Status"],
    [
      "Median Ratio",
      data.medianRatio.toFixed(3),
      "0.90 - 1.10",
      data.medianRatio >= 0.90 && data.medianRatio <= 1.10 ? "✓ Pass" : "✗ Fail",
    ],
    [
      "COD (Uniformity)",
      `${data.cod.toFixed(1)}%`,
      "< 10% (Excellent)\n10-15% (Good)\n15-20% (Fair)",
      data.cod <= 10
        ? "✓ Excellent"
        : data.cod <= 15
        ? "✓ Good"
        : data.cod <= 20
        ? "✓ Fair"
        : "✗ Poor",
    ],
    [
      "PRD (Regressivity)",
      data.prd.toFixed(3),
      "0.98 - 1.03",
      data.prd >= 0.98 && data.prd <= 1.03 ? "✓ Pass" : "✗ Fail",
    ],
    [
      "PRB (Price Bias)",
      data.prb.toFixed(4),
      "-0.05 to 0.05",
      data.prb >= -0.05 && data.prb <= 0.05 ? "✓ Pass" : "✗ Fail",
    ],
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [complianceData[0]],
    body: complianceData.slice(1),
    theme: "grid",
    headStyles: {
      fillColor: [0, 217, 217],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 45 },
      1: { halign: "right", cellWidth: 30 },
      2: { cellWidth: 60 },
      3: { halign: "center", cellWidth: 35 },
    },
  });
  
  // Additional Statistics
  yPos = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Additional Statistics", 14, yPos);
  yPos += 8;
  
  const additionalData = [
    ["Statistic", "Value"],
    ["Mean Ratio", data.meanRatio.toFixed(3)],
    ["Minimum Ratio", data.minRatio.toFixed(3)],
    ["Maximum Ratio", data.maxRatio.toFixed(3)],
    ["Total Sales Value", `$${data.totalSalesValue.toLocaleString()}`],
    ["Total Assessed Value", `$${data.totalAssessedValue.toLocaleString()}`],
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [additionalData[0]],
    body: additionalData.slice(1),
    theme: "grid",
    headStyles: {
      fillColor: [0, 217, 217],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 80 },
      1: { halign: "right", cellWidth: 80 },
    },
  });
  
  // IAAO Standards Explanation
  yPos = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("IAAO Standards Explanation", 14, yPos);
  yPos += 8;
  
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  
  const explanations = [
    "COD (Coefficient of Dispersion): Measures uniformity of assessments. Lower values indicate more uniform assessments.",
    "PRD (Price-Related Differential): Detects assessment bias by price level. Values > 1.03 indicate regressive assessments (favoring low-value properties).",
    "PRB (Price-Related Bias): Regression-based bias detection. Positive values indicate regressive assessments.",
    "Median Ratio: Central tendency of assessment-to-sale ratios. Should be close to 1.0 for accurate assessments.",
  ];
  
  explanations.forEach((text) => {
    const lines = doc.splitTextToSize(text, 180);
    doc.text(lines, 14, yPos);
    yPos += lines.length * 5 + 2;
  });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    "This report was generated by TerraFusion Mass Valuation Appraisal Suite",
    105,
    285,
    { align: "center" }
  );
  doc.text(
    "Compliant with IAAO (International Association of Assessing Officers) standards",
    105,
    290,
    { align: "center" }
  );
  
  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  return pdfBuffer;
}
