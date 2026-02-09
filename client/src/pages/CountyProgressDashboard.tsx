import { DashboardLayout } from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function CountyProgressDashboard() {
  const { data: countyStats, isLoading } = (trpc.parcels as any).getCountyStatistics.useQuery();

  const stats = countyStats || [];
  const countiesWithData = stats.filter((s: any) => s.hasData).length;
  const totalParcels = stats.reduce((sum: number, s: any) => sum + s.parcelCount, 0);
  const completeness = ((countiesWithData / stats.length) * 100).toFixed(1);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            County Progress Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Washington State parcel data import status and statistics
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Counties with Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{countiesWithData} / 39</div>
              <p className="text-xs text-muted-foreground mt-1">
                {completeness}% complete
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Parcels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalParcels.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all counties
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average per County
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {countiesWithData > 0 ? Math.round(totalParcels / countiesWithData).toLocaleString() : 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                With imported data
              </p>
            </CardContent>
          </Card>
        </div>

        {/* County Table */}
        <Card>
          <CardHeader>
            <CardTitle>County Import Status</CardTitle>
            <CardDescription>
              Detailed view of parcel data imports for each Washington county
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Clock className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading county statistics...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>County</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Parcel Count</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.map((county: any) => (
                    <TableRow key={county.county}>
                      <TableCell className="font-medium">{county.county}</TableCell>
                      <TableCell>
                        {county.hasData ? (
                          <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Imported
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-muted text-muted-foreground">
                            <XCircle className="w-3 h-3 mr-1" />
                            No Data
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {county.parcelCount > 0 ? county.parcelCount.toLocaleString() : '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {county.lastUpdate
                          ? formatDistanceToNow(new Date(county.lastUpdate), { addSuffix: true })
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
