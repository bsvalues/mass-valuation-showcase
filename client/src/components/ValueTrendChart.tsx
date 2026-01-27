import { useEffect, useRef } from "react";
import { Chart, ChartConfiguration, registerables } from "chart.js";

Chart.register(...registerables);

interface ValueTrendChartProps {
  data: { year: number; value: number }[];
  height?: number;
}

export function ValueTrendChart({ data, height = 60 }: ValueTrendChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    // Sort data by year
    const sortedData = [...data].sort((a, b) => a.year - b.year);
    
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Destroy existing chart
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const config: ChartConfiguration = {
      type: "line",
      data: {
        labels: sortedData.map(d => d.year.toString()),
        datasets: [
          {
            data: sortedData.map(d => d.value),
            borderColor: "rgb(0, 255, 238)",
            backgroundColor: "rgba(0, 255, 238, 0.1)",
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: "rgb(0, 255, 238)",
            pointHoverBorderColor: "#fff",
            pointHoverBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            mode: "index",
            intersect: false,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleColor: "rgb(0, 255, 238)",
            bodyColor: "#fff",
            borderColor: "rgb(0, 255, 238)",
            borderWidth: 1,
            padding: 8,
            displayColors: false,
            callbacks: {
              title: (items: any) => `Year ${items[0].label}`,
              label: (item: any) => `$${Number(item.raw).toLocaleString()}`,
            },
          },
        },
        scales: {
          x: {
            display: false,
            grid: { display: false },
          },
          y: {
            display: false,
            grid: { display: false },
          },
        },
        interaction: {
          mode: "nearest",
          axis: "x",
          intersect: false,
        },
      },
    };

    chartRef.current = new Chart(ctx, config);

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        No historical data
      </div>
    );
  }

  return (
    <div style={{ height: `${height}px` }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
