"use client";
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
  if (typeof window === "undefined") {
    return null;
  }

  return (
    <div>
      <ReactApexChart
        options={options}
        series={series}
        type={type}
        height={height}
        width={width}
      />
    </div>
  );
}

