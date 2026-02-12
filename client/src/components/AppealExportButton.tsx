import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface AppealExportButtonProps {
  status?: string;
}

export function AppealExportButton({ status }: AppealExportButtonProps) {
  const { data: appeals, isLoading } = trpc.appeals.list.useQuery({
    status: status as any,
  });

  const exportToCSV = () => {
    if (!appeals || appeals.length === 0) {
      toast.error("No appeals to export");
      return;
    }

    const headers = [
      "Parcel ID",
      "Appeal Date",
      "Current Assessed Value",
      "Appealed Value",
      "Status",
      "Appeal Reason",
      "Created At",
    ];

    const rows = appeals.map((appeal) => [
      appeal.parcelId,
      appeal.appealDate,
      appeal.currentAssessedValue,
      appeal.appealedValue,
      appeal.status,
      appeal.appealReason,
      new Date(appeal.createdAt).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `appeals_export_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${appeals.length} appeals to CSV`);
  };

  const exportToPDF = () => {
    if (!appeals || appeals.length === 0) {
      toast.error("No appeals to export");
      return;
    }

    const totalAppeals = appeals.length;
    const statusCounts = appeals.reduce((acc, appeal) => {
      acc[appeal.status] = (acc[appeal.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalValueDifference = appeals.reduce(
      (sum, appeal) =>
        sum + (appeal.currentAssessedValue - appeal.appealedValue),
      0
    );

    const avgValueDifference = totalValueDifference / totalAppeals;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Appeals Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    h1 { color: #00D9D9; border-bottom: 3px solid #00D9D9; padding-bottom: 10px; }
    h2 { color: #00FFEE; margin-top: 30px; }
    .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .stat { display: inline-block; margin: 10px 20px 10px 0; }
    .stat-label { font-weight: bold; color: #666; }
    .stat-value { font-size: 24px; color: #00D9D9; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #00D9D9; color: white; padding: 12px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #ddd; }
    tr:nth-child(even) { background: #f9f9f9; }
    .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .status-pending { background: #FEF3C7; color: #92400E; }
    .status-in_review { background: #DBEAFE; color: #1E40AF; }
    .status-hearing_scheduled { background: #E0E7FF; color: #3730A3; }
    .status-resolved { background: #D1FAE5; color: #065F46; }
    .status-withdrawn { background: #F3F4F6; color: #374151; }
  </style>
</head>
<body>
  <h1>TerraForge Appeals Report</h1>
  <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
  
  <div class="summary">
    <h2>Summary Statistics</h2>
    <div class="stat">
      <div class="stat-label">Total Appeals</div>
      <div class="stat-value">${totalAppeals}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Avg Value Difference</div>
      <div class="stat-value">$${Math.round(avgValueDifference).toLocaleString()}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Total Value Disputed</div>
      <div class="stat-value">$${Math.round(totalValueDifference).toLocaleString()}</div>
    </div>
  </div>

  <h2>Status Distribution</h2>
  <table>
    <tr><th>Status</th><th>Count</th><th>Percentage</th></tr>
    ${Object.entries(statusCounts).map(([status, count]) => `
      <tr>
        <td><span class="status-badge status-${status}">${status.replace("_", " ").toUpperCase()}</span></td>
        <td>${count}</td>
        <td>${((count / totalAppeals) * 100).toFixed(1)}%</td>
      </tr>
    `).join("")}
  </table>

  <h2>Appeals Detail</h2>
  <table>
    <tr>
      <th>Parcel ID</th><th>Appeal Date</th><th>Current Value</th><th>Appealed Value</th>
      <th>Difference</th><th>Status</th><th>Reason</th>
    </tr>
    ${appeals.map((appeal) => `
      <tr>
        <td>${appeal.parcelId}</td>
        <td>${appeal.appealDate}</td>
        <td>$${appeal.currentAssessedValue.toLocaleString()}</td>
        <td>$${appeal.appealedValue.toLocaleString()}</td>
        <td>$${(appeal.currentAssessedValue - appeal.appealedValue).toLocaleString()}</td>
        <td><span class="status-badge status-${appeal.status}">${appeal.status.replace("_", " ").toUpperCase()}</span></td>
        <td>${appeal.appealReason}</td>
      </tr>
    `).join("")}
  </table>
</body>
</html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }

    toast.success("PDF export dialog opened");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isLoading}>
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF}>
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
