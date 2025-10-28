"use client";
import { useMemo } from "react";
import { Card } from 'flowbite-react';
import ChartWrapper from './ChartWrapper';

interface Props {
  data: Array<{ statusName: string; count: number }>;
}

export default function StatusAreaChart({ data }: Props) {
  const options = useMemo(() => {
    const categories = data.map(s => String(s.statusName || ''));
    
    // Return options directly - data is already cleaned upstream
    return {
      chart: { id: 'status-area', type: 'area', toolbar: { show: true } },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      fill: { type: 'gradient', gradient: { opacityFrom: 0.6, opacityTo: 0.1 } },
      xaxis: {
        categories: categories,
        labels: { rotate: -45, style: { fontSize: '11px' } }
      },
      yaxis: { title: { text: 'Number of Leads' } },
      colors: ['#3B82F6']
    };
  }, [data]);

  const series = useMemo(() => {
    const cleanData = data.map(s => Number(s.count || 0));
    return [{ name: 'Leads', data: cleanData }];
  }, [data]);

  return (
    <Card className="max-w-full">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Lead Status Flow (Area Chart)
      </h3>
      <ChartWrapper chartId="StatusArea" options={options} series={series} type="area" height={350} />
    </Card>
  );
}
