/**
 * Utility functions for exporting property comparison reports
 */

interface PropertyComparisonData {
  id: number;
  address: string;
  parcelId: string;
  totalValue: number;
  squareFeet: number;
  yearBuilt: number;
  propertyType: string;
  latitude: string;
  longitude: string;
}

/**
 * Export property comparison as CSV
 */
export function exportComparisonCSV(properties: PropertyComparisonData[]): void {
  if (properties.length === 0) {
    console.warn('No properties to export');
    return;
  }

  // CSV Headers
  const headers = [
    'Property #',
    'Address',
    'Parcel ID',
    'Assessed Value',
    'Square Footage',
    'Price per Sqft',
    'Year Built',
    'Age',
    'Property Type',
    'Latitude',
    'Longitude'
  ];

  // CSV Rows
  const rows = properties.map((prop, index) => {
    const pricePerSqft = prop.squareFeet > 0 ? (prop.totalValue / prop.squareFeet).toFixed(2) : 'N/A';
    const age = new Date().getFullYear() - prop.yearBuilt;
    
    return [
      index + 1,
      `"${prop.address}"`,
      prop.parcelId,
      prop.totalValue,
      prop.squareFeet,
      pricePerSqft,
      prop.yearBuilt,
      age,
      prop.propertyType,
      prop.latitude,
      prop.longitude
    ];
  });

  // Add summary statistics
  const totalValue = properties.reduce((sum, p) => sum + p.totalValue, 0);
  const avgValue = totalValue / properties.length;
  const totalSqft = properties.reduce((sum, p) => sum + p.squareFeet, 0);
  const avgSqft = totalSqft / properties.length;
  const avgPricePerSqft = avgSqft > 0 ? (avgValue / avgSqft).toFixed(2) : 'N/A';

  rows.push([]);
  rows.push(['Summary Statistics']);
  rows.push(['Total Properties', properties.length]);
  rows.push(['Average Value', `$${avgValue.toFixed(2)}`]);
  rows.push(['Average Square Footage', avgSqft.toFixed(2)]);
  rows.push(['Average Price per Sqft', `$${avgPricePerSqft}`]);

  // Generate CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Download CSV
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `property-comparison-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export property comparison as PDF
 */
export function exportComparisonPDF(properties: PropertyComparisonData[]): void {
  if (properties.length === 0) {
    console.warn('No properties to export');
    return;
  }

  // Create HTML content for PDF
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Property Comparison Report</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 40px;
      color: #333;
    }
    h1 {
      color: #00FFEE;
      border-bottom: 3px solid #00FFEE;
      padding-bottom: 10px;
      margin-bottom: 30px;
    }
    h2 {
      color: #0A1020;
      margin-top: 30px;
      margin-bottom: 15px;
    }
    .property-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    .property-card {
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      background: #f9f9f9;
    }
    .property-card.highlight {
      border-color: #00FFEE;
      background: #e6fffd;
    }
    .property-header {
      font-weight: bold;
      color: #00FFEE;
      font-size: 14px;
      margin-bottom: 10px;
    }
    .property-address {
      font-weight: bold;
      font-size: 16px;
      margin-bottom: 5px;
      color: #0A1020;
    }
    .property-parcel {
      font-size: 12px;
      color: #666;
      margin-bottom: 15px;
    }
    .metric {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #ddd;
    }
    .metric:last-child {
      border-bottom: none;
    }
    .metric-label {
      font-size: 13px;
      color: #666;
    }
    .metric-value {
      font-weight: bold;
      font-size: 14px;
      color: #0A1020;
    }
    .metric-value.highlight {
      color: #00FFEE;
    }
    .summary {
      background: #f0f0f0;
      padding: 20px;
      border-radius: 8px;
      margin-top: 30px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #ddd;
    }
    .summary-row:last-child {
      border-bottom: none;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 12px;
      color: #999;
    }
  </style>
</head>
<body>
  <h1>Property Comparison Report</h1>
  <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
  <p><strong>Total Properties:</strong> ${properties.length}</p>

  <h2>Property Details</h2>
  <div class="property-grid">
    ${properties.map((prop, index) => {
      const values = properties.map(p => p.totalValue);
      const maxValue = Math.max(...values);
      const isHighest = prop.totalValue === maxValue;
      const pricePerSqft = prop.squareFeet > 0 ? (prop.totalValue / prop.squareFeet).toFixed(2) : 'N/A';
      const age = new Date().getFullYear() - prop.yearBuilt;

      return `
        <div class="property-card ${isHighest ? 'highlight' : ''}">
          <div class="property-header">Property ${index + 1}</div>
          <div class="property-address">${prop.address}</div>
          <div class="property-parcel">${prop.parcelId}</div>
          <div class="metric">
            <span class="metric-label">Assessed Value</span>
            <span class="metric-value ${isHighest ? 'highlight' : ''}">$${prop.totalValue.toLocaleString()}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Square Footage</span>
            <span class="metric-value">${prop.squareFeet.toLocaleString()} sqft</span>
          </div>
          <div class="metric">
            <span class="metric-label">Price per Sqft</span>
            <span class="metric-value">$${pricePerSqft}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Year Built</span>
            <span class="metric-value">${prop.yearBuilt} (${age} years old)</span>
          </div>
          <div class="metric">
            <span class="metric-label">Property Type</span>
            <span class="metric-value">${prop.propertyType}</span>
          </div>
        </div>
      `;
    }).join('')}
  </div>

  <div class="summary">
    <h2>Summary Statistics</h2>
    ${(() => {
      const totalValue = properties.reduce((sum, p) => sum + p.totalValue, 0);
      const avgValue = totalValue / properties.length;
      const totalSqft = properties.reduce((sum, p) => sum + p.squareFeet, 0);
      const avgSqft = totalSqft / properties.length;
      const avgPricePerSqft = avgSqft > 0 ? (avgValue / avgSqft).toFixed(2) : 'N/A';
      const minValue = Math.min(...properties.map(p => p.totalValue));
      const maxValue = Math.max(...properties.map(p => p.totalValue));

      return `
        <div class="summary-row">
          <span>Average Value</span>
          <strong>$${avgValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
        </div>
        <div class="summary-row">
          <span>Value Range</span>
          <strong>$${minValue.toLocaleString()} - $${maxValue.toLocaleString()}</strong>
        </div>
        <div class="summary-row">
          <span>Average Square Footage</span>
          <strong>${avgSqft.toLocaleString(undefined, { maximumFractionDigits: 2 })} sqft</strong>
        </div>
        <div class="summary-row">
          <span>Average Price per Sqft</span>
          <strong>$${avgPricePerSqft}</strong>
        </div>
      `;
    })()}
  </div>

  <div class="footer">
    <p>TerraForge Mass Valuation System | Generated on ${new Date().toLocaleDateString()}</p>
  </div>
</body>
</html>
  `;

  // Create a new window and print to PDF
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print dialog
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  } else {
    alert('Please allow pop-ups to export PDF');
  }
}
