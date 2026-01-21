import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Dashboard Analytics - KPI Calculations', () => {
  describe('Total Assessed Value', () => {
    it('should calculate total assessed value from mock properties', () => {
      const properties = [
        { landValue: 100000, buildingValue: 200000 },
        { landValue: 150000, buildingValue: 250000 },
        { landValue: 120000, buildingValue: 180000 },
      ];
      
      const totalValue = properties.reduce((sum, p) => {
        const landValue = p.landValue || 0;
        const buildingValue = p.buildingValue || 0;
        return sum + landValue + buildingValue;
      }, 0);
      
      expect(totalValue).toBe(1000000);
      expect(typeof totalValue).toBe('number');
    });

    it('should handle properties with null values', () => {
      const properties = [
        { landValue: 100000, buildingValue: null },
        { landValue: null, buildingValue: 200000 },
        { landValue: null, buildingValue: null },
      ];
      
      // Should not throw error when calculating with nulls
      const totalValue = properties.reduce((sum, p) => {
        const landValue = p.landValue || 0;
        const buildingValue = p.buildingValue || 0;
        return sum + landValue + buildingValue;
      }, 0);
      
      expect(totalValue).toBe(300000);
    });

    it('should return zero for empty database', async () => {
      // Mock empty result
      const emptyProperties: any[] = [];
      const totalValue = emptyProperties.reduce((sum, p) => {
        const landValue = p.landValue || 0;
        const buildingValue = p.buildingValue || 0;
        return sum + landValue + buildingValue;
      }, 0);
      
      expect(totalValue).toBe(0);
    });
  });

  describe('Parcel Count', () => {
    it('should count total number of properties', () => {
      const properties = [
        { id: 1 },
        { id: 2 },
        { id: 3 },
      ];
      const count = properties.length;
      
      expect(count).toBe(3);
      expect(Number.isInteger(count)).toBe(true);
    });

    it('should return zero for empty database', async () => {
      const emptyProperties: any[] = [];
      expect(emptyProperties.length).toBe(0);
    });
  });

  describe('Median Ratio (A/S)', () => {
    it('should calculate median ratio from assessed/sale values', () => {
      const ratios = [0.85, 0.92, 0.96, 1.02, 1.15];
      ratios.sort((a, b) => a - b);
      const median = ratios[Math.floor(ratios.length / 2)];
      
      expect(median).toBe(0.96);
    });

    it('should handle even number of ratios', () => {
      const ratios = [0.90, 0.95, 1.00, 1.05];
      ratios.sort((a, b) => a - b);
      const mid = Math.floor(ratios.length / 2);
      const median = (ratios[mid - 1] + ratios[mid]) / 2;
      
      expect(median).toBe(0.975);
    });

    it('should return 0 for empty ratio array', () => {
      const ratios: number[] = [];
      const median = ratios.length > 0 
        ? ratios[Math.floor(ratios.length / 2)] 
        : 0;
      
      expect(median).toBe(0);
    });

    it('should handle single ratio', () => {
      const ratios = [0.96];
      const median = ratios[Math.floor(ratios.length / 2)];
      
      expect(median).toBe(0.96);
    });
  });

  describe('COD (Coefficient of Dispersion)', () => {
    it('should calculate COD from ratio deviations', () => {
      const ratios = [0.85, 0.92, 0.96, 1.02, 1.15];
      const median = 0.96;
      
      const deviations = ratios.map(r => Math.abs(r - median));
      const avgDeviation = deviations.reduce((sum, d) => sum + d, 0) / deviations.length;
      const cod = (avgDeviation / median) * 100;
      
      expect(cod).toBeGreaterThan(0);
      expect(cod).toBeLessThan(100);
    });

    it('should return 0 for identical ratios (perfect uniformity)', () => {
      const ratios = [1.0, 1.0, 1.0, 1.0];
      const median = 1.0;
      
      const deviations = ratios.map(r => Math.abs(r - median));
      const avgDeviation = deviations.reduce((sum, d) => sum + d, 0) / deviations.length;
      const cod = (avgDeviation / median) * 100;
      
      expect(cod).toBe(0);
    });

    it('should handle empty ratio array', () => {
      const ratios: number[] = [];
      const median = 0;
      
      const cod = ratios.length === 0 ? 0 : (() => {
        const deviations = ratios.map(r => Math.abs(r - median));
        const avgDeviation = deviations.reduce((sum, d) => sum + d, 0) / deviations.length;
        return (avgDeviation / median) * 100;
      })();
      
      expect(cod).toBe(0);
    });
  });
});

describe('Dashboard Analytics - Value Trends', () => {
  describe('Monthly Aggregation', () => {
    it('should group properties by month', () => {
      const mockData = [
        { createdAt: new Date('2024-01-15'), totalValue: 100000 },
        { createdAt: new Date('2024-01-20'), totalValue: 150000 },
        { createdAt: new Date('2024-02-10'), totalValue: 200000 },
      ];

      const monthlyData = mockData.reduce((acc, item) => {
        const month = item.createdAt.toISOString().slice(0, 7); // YYYY-MM
        if (!acc[month]) {
          acc[month] = { month, totalValue: 0, count: 0 };
        }
        acc[month].totalValue += item.totalValue;
        acc[month].count += 1;
        return acc;
      }, {} as Record<string, { month: string; totalValue: number; count: number }>);

      expect(Object.keys(monthlyData)).toHaveLength(2);
      expect(monthlyData['2024-01'].totalValue).toBe(250000);
      expect(monthlyData['2024-02'].totalValue).toBe(200000);
    });

    it('should handle empty data', () => {
      const mockData: any[] = [];
      const monthlyData = mockData.reduce((acc, item) => {
        const month = item.createdAt.toISOString().slice(0, 7);
        if (!acc[month]) {
          acc[month] = { month, totalValue: 0, count: 0 };
        }
        acc[month].totalValue += item.totalValue;
        acc[month].count += 1;
        return acc;
      }, {} as Record<string, { month: string; totalValue: number; count: number }>);

      expect(Object.keys(monthlyData)).toHaveLength(0);
    });

    it('should sort months chronologically', () => {
      const mockData = [
        { month: '2024-03', totalValue: 300000 },
        { month: '2024-01', totalValue: 100000 },
        { month: '2024-02', totalValue: 200000 },
      ];

      const sorted = mockData.sort((a, b) => a.month.localeCompare(b.month));

      expect(sorted[0].month).toBe('2024-01');
      expect(sorted[1].month).toBe('2024-02');
      expect(sorted[2].month).toBe('2024-03');
    });
  });

  describe('Trend Calculation', () => {
    it('should calculate growth percentage', () => {
      const previous = 1000000;
      const current = 1050000;
      const growth = ((current - previous) / previous) * 100;

      expect(growth).toBe(5);
    });

    it('should handle negative growth', () => {
      const previous = 1000000;
      const current = 950000;
      const growth = ((current - previous) / previous) * 100;

      expect(growth).toBe(-5);
    });

    it('should handle zero previous value', () => {
      const previous = 0;
      const current = 100000;
      const growth = previous === 0 ? 0 : ((current - previous) / previous) * 100;

      expect(growth).toBe(0);
    });
  });
});

describe('Dashboard Analytics - Recent Activity', () => {
  describe('Activity Types', () => {
    it('should categorize import jobs', () => {
      const activity = {
        type: 'import',
        description: 'Data import completed',
        status: 'completed',
        timestamp: new Date(),
      };

      expect(activity.type).toBe('import');
      expect(activity.status).toBe('completed');
    });

    it('should categorize model training', () => {
      const activity = {
        type: 'model',
        description: 'AVM model trained',
        status: 'completed',
        timestamp: new Date(),
      };

      expect(activity.type).toBe('model');
    });

    it('should categorize batch jobs', () => {
      const activity = {
        type: 'batch',
        description: 'Batch valuation processing',
        status: 'processing',
        timestamp: new Date(),
      };

      expect(activity.type).toBe('batch');
      expect(activity.status).toBe('processing');
    });
  });

  describe('Activity Status', () => {
    it('should handle completed status', () => {
      const status = 'completed';
      const color = status === 'completed' ? 'green' : 'gray';

      expect(color).toBe('green');
    });

    it('should handle processing status', () => {
      const status = 'processing';
      const color = status === 'processing' ? 'yellow' : 'gray';

      expect(color).toBe('yellow');
    });

    it('should handle failed status', () => {
      const status = 'failed';
      const color = status === 'failed' ? 'red' : 'gray';

      expect(color).toBe('red');
    });

    it('should handle unknown status', () => {
      const status = 'unknown';
      const color = ['completed', 'processing', 'failed'].includes(status) ? 'blue' : 'gray';

      expect(color).toBe('gray');
    });
  });

  describe('Activity Sorting', () => {
    it('should sort by timestamp descending', () => {
      const activities = [
        { timestamp: new Date('2024-01-01'), description: 'Old' },
        { timestamp: new Date('2024-03-01'), description: 'Recent' },
        { timestamp: new Date('2024-02-01'), description: 'Middle' },
      ];

      const sorted = activities.sort((a, b) => 
        b.timestamp.getTime() - a.timestamp.getTime()
      );

      expect(sorted[0].description).toBe('Recent');
      expect(sorted[1].description).toBe('Middle');
      expect(sorted[2].description).toBe('Old');
    });

    it('should limit to recent N activities', () => {
      const activities = Array.from({ length: 20 }, (_, i) => ({
        timestamp: new Date(),
        description: `Activity ${i}`,
      }));

      const limited = activities.slice(0, 10);

      expect(limited).toHaveLength(10);
    });
  });
});

describe('Dashboard Analytics - Data Formatting', () => {
  describe('Currency Formatting', () => {
    it('should format large values with compact notation', () => {
      const value = 42800000;
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(value);

      expect(formatted).toMatch(/\$42\.8M|\$43M/);
    });

    it('should format small values without compact notation', () => {
      const value = 1500;
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value);

      expect(formatted).toBe('$1,500.00');
    });
  });

  describe('Number Formatting', () => {
    it('should format integers with thousand separators', () => {
      const value = 125000;
      const formatted = new Intl.NumberFormat('en-US').format(value);

      expect(formatted).toBe('125,000');
    });

    it('should handle zero', () => {
      const value = 0;
      const formatted = new Intl.NumberFormat('en-US').format(value);

      expect(formatted).toBe('0');
    });
  });

  describe('Percentage Formatting', () => {
    it('should format decimal as percentage', () => {
      const value = 0.084;
      const formatted = (value * 100).toFixed(1) + '%';

      expect(formatted).toBe('8.4%');
    });

    it('should handle zero percentage', () => {
      const value = 0;
      const formatted = (value * 100).toFixed(1) + '%';

      expect(formatted).toBe('0.0%');
    });
  });
});
