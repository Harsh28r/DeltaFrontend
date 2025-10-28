"use client";
import { useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ChartWrapperProps {
  options: any;
  series: any;
  type: 'line' | 'area' | 'bar' | 'pie' | 'donut' | 'radialBar' | 'scatter' | 'bubble' | 'heatmap' | 'candlestick';
  height?: number | string;
  width?: string;
  chartId?: string;
}

export default function ChartWrapper({ options, series, type, height = 350, width = "100%", chartId = "chart" }: ChartWrapperProps) {
  const chartRef = useRef<any>(null);
  const chartInstanceRef = useRef<any>(null);

  // Capture and destroy chart instance
  useEffect(() => {
    // Capture the chart instance when it's created
    const captureInterval = setInterval(() => {
      if (chartRef.current?.chart && !chartInstanceRef.current) {
        chartInstanceRef.current = chartRef.current.chart;
        clearInterval(captureInterval);
      }
    }, 50);

    const timeout = setTimeout(() => clearInterval(captureInterval), 500);

    return () => {
      clearInterval(captureInterval);
      clearTimeout(timeout);

      // Destroy the captured chart instance
      if (chartInstanceRef.current && typeof chartInstanceRef.current.destroy === 'function') {
        try {
          chartInstanceRef.current.destroy();
          chartInstanceRef.current = null;
        } catch (error) {
          console.error(`Chart ${chartId} destroy error:`, error);
        }
      }
    };
  }, [chartId]);

  // Use options and series directly - memoization happens in parent components
  const safeOptions = options;
  const safeSeries = series;

  return (
    <div>
      <ReactApexChart
        ref={chartRef}
        options={safeOptions}
        series={safeSeries}
        type={type}
        height={height}
        width={width}
      />
    </div>
  );
}
