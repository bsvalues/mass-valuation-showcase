import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  TrendingUp,
  Home,
  MapPin,
  Star,
  Wrench,
  DollarSign,
  Download,
  RefreshCw
} from 'lucide-react';
import {
  engineerFeatures,
  getFeatureImportanceRankings,
  type PropertyFeatures,
  type EngineerEdFeatures
} from '@/lib/featureEngineering';

export default function ValueDriverAnalysis() {
  // Sample property state (in real app, would come from selected parcel)
  const [property, setProperty] = useState<PropertyFeatures>({
    squareFeet: 2400,
    yearBuilt: 1995,
    landValue: 150000,
    buildingValue: 350000,
    totalValue: 500000,
    bedrooms: 4,
    bathrooms: 3,
    lotSize: 8000,
    basementSqFt: 800,
    quality: 'good',
    condition: 'good',
    renovationYear: 2015,
    distanceToSchool: 0.8,
    distanceToPark: 0.5,
    distanceToTransit: 1.2,
    distanceToDowntown: 5.5,
    walkabilityScore: 72,
    neighborhoodClusterId: 3,
    propertyType: 'residential',
    propertySubtype: 'single_family'
  });

  // Engineer features
  const engineeredFeatures = useMemo(() => engineerFeatures(property), [property]);

  // Calculate predicted value based on engineered features
  const predictedValue = useMemo(() => {
    // Simplified valuation model for demonstration
    const baseSqFtValue = (property.squareFeet || 0) * 200;
    const qualityMultiplier = (engineeredFeatures.qualityScore || 3) / 3;
    const conditionMultiplier = (engineeredFeatures.conditionScore || 3) / 3;
    const depreciationAdjustment = engineeredFeatures.depreciationFactor || 1;
    const renovationAdjustment = engineeredFeatures.renovationBoost || 1;
    const locationAdjustment = ((engineeredFeatures.locationScore || 50) / 50);
    
    return Math.round(
      baseSqFtValue *
      qualityMultiplier *
      conditionMultiplier *
      depreciationAdjustment *
      renovationAdjustment *
      locationAdjustment
    );
  }, [property, engineeredFeatures]);

  // Feature importance data for bar chart
  const featureImportanceData = [
    { name: 'Square Footage', importance: 35, color: '#00FFEE' },
    { name: 'Location Score', importance: 25, color: '#00D4FF' },
    { name: 'Quality', importance: 15, color: '#00AAFF' },
    { name: 'Condition', importance: 12, color: '#0088FF' },
    { name: 'Effective Age', importance: 8, color: '#0066FF' },
    { name: 'Lot Size', importance: 5, color: '#0044FF' },
  ];

  // Value breakdown for pie chart
  const valueBreakdownData = [
    { name: 'Land Value', value: property.landValue || 0, color: '#00FFEE' },
    { name: 'Building Value', value: property.buildingValue || 0, color: '#00AAFF' },
    { name: 'Location Premium', value: Math.round((predictedValue - (property.totalValue || 0)) * 0.3), color: '#0066FF' },
    { name: 'Quality Premium', value: Math.round((predictedValue - (property.totalValue || 0)) * 0.7), color: '#0044FF' },
  ];

  // Radar chart data for property profile
  const propertyProfileData = [
    { attribute: 'Size', value: Math.min(100, ((property.squareFeet || 0) / 50)), fullMark: 100 },
    { attribute: 'Quality', value: (engineeredFeatures.qualityScore || 3) * 20, fullMark: 100 },
    { attribute: 'Condition', value: (engineeredFeatures.conditionScore || 3) * 20, fullMark: 100 },
    { attribute: 'Location', value: engineeredFeatures.locationScore || 50, fullMark: 100 },
    { attribute: 'Age', value: Math.max(0, 100 - ((engineeredFeatures.propertyAge || 0) * 2)), fullMark: 100 },
    { attribute: 'Amenities', value: engineeredFeatures.amenityScore || 50, fullMark: 100 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
              Value Driver Analysis
            </h1>
            <p className="text-[var(--color-text-secondary)] mt-1">
              Understand all factors driving property valuations
            </p>
          </div>
          <Button className="bg-[var(--color-signal-primary)] hover:bg-[var(--color-signal-primary)]/90">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[var(--color-glass-2)] border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[var(--color-text-tertiary)]">
                Predicted Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[var(--color-signal-primary)]">
                ${predictedValue.toLocaleString()}
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                Based on {getFeatureImportanceRankings().length} features
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[var(--color-glass-2)] border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[var(--color-text-tertiary)]">
                Price per Sq Ft
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                ${engineeredFeatures.pricePerSqFt?.toFixed(0) || 0}
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                Market average: $185
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[var(--color-glass-2)] border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[var(--color-text-tertiary)]">
                Location Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                {engineeredFeatures.locationScore?.toFixed(0) || 0}/100
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                {(engineeredFeatures.locationScore || 0) > 70 ? 'Excellent' : (engineeredFeatures.locationScore || 0) > 50 ? 'Good' : 'Average'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[var(--color-glass-2)] border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[var(--color-text-tertiary)]">
                Effective Age
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                {engineeredFeatures.effectiveAge?.toFixed(0) || 0} years
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                Actual: {engineeredFeatures.propertyAge || 0} years
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="drivers" className="space-y-4">
          <TabsList className="bg-[var(--color-glass-2)]">
            <TabsTrigger value="drivers">Value Drivers</TabsTrigger>
            <TabsTrigger value="whatif">What-If Analysis</TabsTrigger>
            <TabsTrigger value="breakdown">Value Breakdown</TabsTrigger>
            <TabsTrigger value="profile">Property Profile</TabsTrigger>
          </TabsList>

          {/* Value Drivers Tab */}
          <TabsContent value="drivers" className="space-y-4">
            <Card className="bg-[var(--color-glass-2)] border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[var(--color-signal-primary)]" />
                  Feature Importance Rankings
                </CardTitle>
                <CardDescription>
                  Top factors driving property valuation (% contribution to predicted value)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={featureImportanceData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis type="number" stroke="rgba(255,255,255,0.5)" />
                    <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.5)" width={150} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(10, 14, 26, 0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="importance" radius={[0, 8, 8, 0]}>
                      {featureImportanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Feature Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getFeatureImportanceRankings().slice(0, 6).map((feature) => (
                <Card key={feature.feature} className="bg-[var(--color-glass-2)] border-white/10">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        {feature.displayName}
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {feature.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {feature.description}
                    </p>
                    <div className="mt-2 text-lg font-bold text-[var(--color-text-primary)]">
                      {engineeredFeatures[feature.feature as keyof EngineerEdFeatures]?.toString() || 'N/A'}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* What-If Analysis Tab */}
          <TabsContent value="whatif" className="space-y-4">
            <Card className="bg-[var(--color-glass-2)] border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-[var(--color-signal-primary)]" />
                  Interactive Property Adjustments
                </CardTitle>
                <CardDescription>
                  Adjust property attributes to see real-time impact on valuation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Square Footage Slider */}
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-primary)] mb-2 block">
                    Square Footage: {property.squareFeet} sq ft
                  </label>
                  <Slider
                    value={[property.squareFeet || 2000]}
                    onValueChange={([value]) => setProperty({ ...property, squareFeet: value })}
                    min={500}
                    max={10000}
                    step={100}
                    className="w-full"
                  />
                </div>

                {/* Quality Select */}
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-primary)] mb-2 block">
                    Construction Quality
                  </label>
                  <Select
                    value={property.quality}
                    onValueChange={(value) => setProperty({ ...property, quality: value as any })}
                  >
                    <SelectTrigger className="bg-[var(--color-glass-3)] border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="economy">Economy</SelectItem>
                      <SelectItem value="average">Average</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="very_good">Very Good</SelectItem>
                      <SelectItem value="excellent">Excellent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Condition Select */}
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-primary)] mb-2 block">
                    Property Condition
                  </label>
                  <Select
                    value={property.condition}
                    onValueChange={(value) => setProperty({ ...property, condition: value as any })}
                  >
                    <SelectTrigger className="bg-[var(--color-glass-3)] border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="poor">Poor</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="average">Average</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="excellent">Excellent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Year Built Slider */}
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-primary)] mb-2 block">
                    Year Built: {property.yearBuilt}
                  </label>
                  <Slider
                    value={[property.yearBuilt || 2000]}
                    onValueChange={([value]) => setProperty({ ...property, yearBuilt: value })}
                    min={1900}
                    max={2026}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Predicted Value Display */}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                      Updated Predicted Value:
                    </span>
                    <span className="text-2xl font-bold text-[var(--color-signal-primary)]">
                      ${predictedValue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-[var(--color-text-tertiary)]">
                      Change from baseline:
                    </span>
                    <span className={`text-sm font-medium ${
                      predictedValue > (property.totalValue || 0) ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {predictedValue > (property.totalValue || 0) ? '+' : ''}
                      ${(predictedValue - (property.totalValue || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Value Breakdown Tab */}
          <TabsContent value="breakdown" className="space-y-4">
            <Card className="bg-[var(--color-glass-2)] border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[var(--color-signal-primary)]" />
                  Value Component Breakdown
                </CardTitle>
                <CardDescription>
                  Distribution of value across land, building, and premium factors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={valueBreakdownData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {valueBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(10, 14, 26, 0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => `$${value.toLocaleString()}`}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Property Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card className="bg-[var(--color-glass-2)] border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-[var(--color-signal-primary)]" />
                  Property Profile Radar
                </CardTitle>
                <CardDescription>
                  Multi-dimensional view of property characteristics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={propertyProfileData}>
                    <PolarGrid stroke="rgba(255,255,255,0.2)" />
                    <PolarAngleAxis dataKey="attribute" stroke="rgba(255,255,255,0.7)" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="rgba(255,255,255,0.5)" />
                    <Radar
                      name="Property"
                      dataKey="value"
                      stroke="#00FFEE"
                      fill="#00FFEE"
                      fillOpacity={0.3}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(10, 14, 26, 0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px'
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
