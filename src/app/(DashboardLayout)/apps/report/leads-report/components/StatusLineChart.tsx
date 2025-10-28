"use client";
import React, { useMemo } from 'react';
import { Card } from 'flowbite-react';
import ChartWrapper from './ChartWrapper';

interface Props {
  data: Array<{ statusName: string; count: number }>;
}

const StatusLineChart: React.FC<Props> = React.memo(({ data }) => {
  const chartOptions = useMemo(() => {
    const categories = data.map(s => String(s.statusName || ''));
    
    // Return options directly - data is already cleaned upstream
    return {
      chart: { id: 'status-line', type: 'line', toolbar: { show: true } },
      stroke: { curve: 'smooth', width: 3 },
      markers: { size: 5 },
      xaxis: {
        categories: categories,
        labels: { rotate: -45, style: { fontSize: '12px' } }
      },
      yaxis: { title: { text: 'Number of Leads' } },
      colors: ['#3B82F6']
    };
  }, [data]);

  const series = useMemo(() => {
    const cleanData = data.map(s => Number(s.count || 0));
    return [{ name: 'Leads by Status', data: cleanData }];
  }, [data]);

  return (
    <Card className="max-w-full">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Lead Status Trend (Line Chart)
      </h3>
      <ChartWrapper chartId="StatusLine" options={chartOptions} series={series} type="line" height={350} />
    </Card>
  );
});

StatusLineChart.displayName = 'StatusLineChart';

export default StatusLineChart;

