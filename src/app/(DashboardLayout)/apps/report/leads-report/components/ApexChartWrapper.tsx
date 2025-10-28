"use client";
import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ApexChartWrapperProps {
  options: any;
  series: any;
  type: 'line' | 'area' | 'bar' | 'pie' | 'donut' | 'radialBar' | 'scatter' | 'bubble' | 'heatmap' | 'candlestick';
  height?: number | string;
  width?: string;
}

export default function ApexChartWrapper({ 
  options, 
  series, 
  type, 
  height = 350, 
  width = "100%" 
}: ApexChartWrapperProps) {
  const chartRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      // Cleanup chart instance on unmount
      if (chartRef.current?.chart) {
        try {
          chartRef.current.chart.destroy();
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  return (
    <div>
      <ReactApexChart
        ref={chartRef}
        options={options}
        series={series}
        type={type}
        height={height}
        width={width}
      />
    </div>
  );
}

