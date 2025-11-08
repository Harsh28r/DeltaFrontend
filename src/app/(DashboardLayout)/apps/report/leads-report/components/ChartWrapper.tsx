"use client";
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
