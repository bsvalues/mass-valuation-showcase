/**
 * Automated Monthly Valuation Report Generation
 * 
 * This script generates comprehensive valuation reports for all properties
 * and sends them to county administrators via email.
 * 
 * Schedule with cron: 0 0 1 * * (1st day of each month at midnight)
 */

import { getDb } from '../server/db';
import { sales, parcels } from '../drizzle/schema';
import { sql } from 'drizzle-orm';
import { notifyOwner } from '../server/_core/notification';

interface MonthlyStats {
  totalProperties: number;
  totalSalesVolume: number;
  medianSalePrice: number;
  avgSalePrice: number;
  monthOverMonthChange: number;
  complianceRate: number;
}

async function calculateMonthlyStats(): Promise<MonthlyStats> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Get current month stats
  const currentMonthQuery = await db
    .select({
      count: sql<number>`COUNT(*)`,
      median: sql<number>`AVG(${sales.salePrice})`,
      avg: sql<number>`AVG(${sales.salePrice})`,
    })
    .from(sales)
    .where(sql`saleDate >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)`);

  // Get previous month stats for comparison
  const previousMonthQuery = await db
    .select({
      avg: sql<number>`AVG(${sales.salePrice})`,
    })
    .from(sales)
    .where(sql`saleDate >= DATE_SUB(CURDATE(), INTERVAL 2 MONTH) AND saleDate < DATE_SUB(CURDATE(), INTERVAL 1 MONTH)`);

  const current = currentMonthQuery[0];
  const previous = previousMonthQuery[0];

  const monthOverMonthChange = previous?.avg 
    ? ((current.avg - previous.avg) / previous.avg) * 100 
    : 0;

  // Calculate compliance rate (properties within IAAO standards)
  const complianceQuery = await db
    .select({
      total: sql<number>`COUNT(*)`,
      compliant: sql<number>`SUM(CASE WHEN ABS((${sales.assessedValue} / ${sales.salePrice}) - 1.0) <= 0.10 THEN 1 ELSE 0 END)`,
    })
    .from(sales)
    .where(sql`saleDate >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)`);

  const compliance = complianceQuery[0];
  const complianceRate = compliance.total > 0 
    ? (compliance.compliant / compliance.total) * 100 
    : 0;

  return {
    totalProperties: current.count || 0,
    totalSalesVolume: current.count || 0,
    medianSalePrice: current.median || 0,
    avgSalePrice: current.avg || 0,
    monthOverMonthChange,
    complianceRate,
  };
}

async function generateReportSummary(stats: MonthlyStats): Promise<string> {
  const currentDate = new Date();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return `
# Monthly Valuation Report - ${monthName}

## Executive Summary

**Total Sales Volume**: ${stats.totalSalesVolume} properties
**Median Sale Price**: $${stats.medianSalePrice.toLocaleString()}
**Average Sale Price**: $${stats.avgSalePrice.toLocaleString()}
**Month-over-Month Change**: ${stats.monthOverMonthChange >= 0 ? '+' : ''}${stats.monthOverMonthChange.toFixed(2)}%
**IAAO Compliance Rate**: ${stats.complianceRate.toFixed(1)}%

## Market Trends

${stats.monthOverMonthChange > 5 ? '⬆️ **Strong Growth**: Market showing significant appreciation' : 
  stats.monthOverMonthChange > 0 ? '📈 **Moderate Growth**: Market trending upward' :
  stats.monthOverMonthChange > -5 ? '📊 **Stable Market**: Prices holding steady' :
  '⬇️ **Market Correction**: Prices declining'}

## Compliance Status

${stats.complianceRate >= 90 ? '✅ **Excellent**: Assessments well within IAAO standards' :
  stats.complianceRate >= 80 ? '⚠️ **Good**: Minor adjustments recommended' :
  '❌ **Action Required**: Significant assessment review needed'}

## Recommendations

${stats.complianceRate < 85 ? '- Review assessment models and update coefficients\n' : ''}
${Math.abs(stats.monthOverMonthChange) > 10 ? '- Consider mass revaluation due to significant market movement\n' : ''}
- Continue monitoring market trends
- Schedule quarterly ratio study review

---
*Generated automatically by TerraFusion Mass Valuation Suite*
  `.trim();
}

async function sendMonthlyReport() {
  console.log('=' .repeat(60));
  console.log('Generating Monthly Valuation Report');
  console.log('='.repeat(60));

  try {
    // Calculate stats
    console.log('\n📊 Calculating monthly statistics...');
    const stats = await calculateMonthlyStats();

    // Generate report
    console.log('📝 Generating report summary...');
    const reportContent = await generateReportSummary(stats);

    // Send notification
    console.log('📧 Sending report to county administrators...');
    const success = await notifyOwner({
      title: `Monthly Valuation Report - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`,
      content: reportContent,
    });

    if (success) {
      console.log('✅ Report sent successfully!');
    } else {
      console.log('⚠️ Failed to send report (notification service unavailable)');
    }

    // Log summary
    console.log('\n' + '='.repeat(60));
    console.log('Report Summary:');
    console.log(`  Total Sales: ${stats.totalSalesVolume}`);
    console.log(`  Median Price: $${stats.medianSalePrice.toLocaleString()}`);
    console.log(`  MoM Change: ${stats.monthOverMonthChange.toFixed(2)}%`);
    console.log(`  Compliance: ${stats.complianceRate.toFixed(1)}%`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error generating monthly report:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  sendMonthlyReport()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { sendMonthlyReport, calculateMonthlyStats };
